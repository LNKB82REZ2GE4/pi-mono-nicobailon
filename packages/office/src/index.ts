/**
 * The Office extension.
 */

import type { Api, Model } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionCommandContext, ExtensionUIContext } from "@mariozechner/pi-coding-agent";
import { checkSubagentDepth } from "./core/spawn/subprocess.js";
import type {
	AgentConfig,
	OfficeConfig,
	OrchestrateParams as OfficeOrchestrateParams,
	SpecialistTemplate,
	TeamConfig,
} from "./core/types.js";
import { officeMessageBus } from "./office/message-bus.js";
import {
	applyTeamRoutingPolicies,
	decomposeLeadTasks,
	planSpecialistInstanceNames,
	routeToTeam,
	toParallelTasksFromTeam,
} from "./office/runtime.js";
import { auditStore, officeStore, teamStore } from "./persistence/store.js";
import {
	executeOrchestration,
	formatOrchestrateResult,
	type OrchestrateParams,
	OrchestrateParamsSchema,
} from "./tools/orchestrate.js";
import {
	createMonitorWidget,
	type MonitorWidgetState,
	notePlannedSession,
	renderOfficeMonitor,
	setWidgetOffice,
	updateWidgetFromProgress,
} from "./tui/monitor-widget.js";
import { type DashboardScopedModel, OfficeDashboard, type OfficeDashboardAction } from "./tui/office-dashboard.js";

interface OfficeSettings {
	maxConcurrent: number;
	defaultTimeout: number;
	widgetPinned: boolean;
}

const DEFAULT_SETTINGS: OfficeSettings = {
	maxConcurrent: 4,
	defaultTimeout: 600000,
	widgetPinned: false,
};

function resolveSettings(pi: ExtensionAPI): OfficeSettings {
	try {
		const getSettings = (pi as unknown as { getSettings?: () => { office?: Partial<OfficeSettings> } }).getSettings;
		if (getSettings) {
			const settings = getSettings();
			if (settings?.office) return { ...DEFAULT_SETTINGS, ...settings.office };
		}
	} catch {
		// ignore settings lookup failures
	}
	return DEFAULT_SETTINGS;
}

function createDefaultOffice(): OfficeConfig {
	const now = new Date().toISOString();
	const officeManager: AgentConfig = {
		id: "office-manager",
		name: "Office Manager",
		role: "office-manager",
		model: "claude-sonnet-4-5",
		spawnMode: "subprocess",
		contextMode: "branched",
	};

	return {
		id: "default-office",
		name: "The Office",
		officeManager,
		teams: [],
		interactionMode: "routed",
		createdAt: now,
		updatedAt: now,
	};
}

async function getOrCreateDefaultOffice(): Promise<OfficeConfig> {
	const existing = await officeStore.getDefault();
	if (existing) return existing;
	const created = createDefaultOffice();
	await officeStore.save(created);
	return created;
}

function sanitizeId(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function formatModelOption(model: Model<Api>): string {
	return `${model.provider}/${model.id} — ${model.name}`;
}

function parseModelOption(option: string): { provider: string; model: string } {
	const [left] = option.split(" — ", 1);
	const [provider, ...rest] = left.split("/");
	return { provider, model: rest.join("/") };
}

interface ScopedModelEntry {
	model: Model<Api>;
}

interface ScopedModelsAPI {
	getScopedModels?: () => ReadonlyArray<ScopedModelEntry>;
}

function hasScopedModelsApi(pi: ExtensionAPI): boolean {
	const maybeScopedApi = pi as unknown as ScopedModelsAPI;
	return typeof maybeScopedApi.getScopedModels === "function";
}

function readScopedModels(pi: ExtensionAPI): ReadonlyArray<ScopedModelEntry> {
	const maybeScopedApi = pi as unknown as ScopedModelsAPI;
	if (!hasScopedModelsApi(pi)) {
		return [];
	}
	try {
		return maybeScopedApi.getScopedModels?.() ?? [];
	} catch {
		return [];
	}
}

function getScopedModelOptions(pi: ExtensionAPI): string[] {
	return readScopedModels(pi)
		.map((scoped) => scoped.model)
		.slice()
		.sort((a, b) => formatModelOption(a).localeCompare(formatModelOption(b)))
		.map((model) => formatModelOption(model));
}

async function selectModelOption(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	title: string,
	preferredProvider?: string,
	preferredModel?: string,
): Promise<{ provider: string; model: string } | null> {
	const options = getScopedModelOptions(pi);
	if (options.length === 0) {
		ctx.ui.notify(
			hasScopedModelsApi(pi)
				? "No scoped models configured. Configure model scope first with /scoped-models or --models."
				: "This Office build requires a newer pi runtime with scoped model APIs. Update pi, then configure /scoped-models or --models.",
			"warning",
		);
		return null;
	}

	const preferredKey = preferredProvider && preferredModel ? `${preferredProvider}/${preferredModel}` : undefined;
	let ordered = options;
	if (preferredKey) {
		const preferred = options.find((option) => option.startsWith(`${preferredKey} —`) || option === preferredKey);
		if (preferred) {
			ordered = [preferred, ...options.filter((option) => option !== preferred)];
		}
	}

	const selected = await ctx.ui.select(title, ordered);
	if (!selected) return null;
	return parseModelOption(selected);
}

function getScopedDashboardModels(pi: ExtensionAPI): DashboardScopedModel[] {
	return readScopedModels(pi)
		.map((scoped) => scoped.model)
		.slice()
		.sort((a, b) => formatModelOption(a).localeCompare(formatModelOption(b)))
		.map((model) => ({ label: formatModelOption(model), provider: model.provider, model: model.id }));
}

function upsertRolePrimaryFallback(
	team: OfficeConfig["teams"][number],
	role: string,
	provider: string,
	model: string,
): void {
	const existingPolicy = team.routingPolicies.find((policy) => policy.role === role);
	const nextFallbacks = [
		{ provider, model },
		...(existingPolicy?.fallbacks.filter((fallback) => fallback.provider !== provider || fallback.model !== model) ??
			[]),
	].slice(0, 8);

	if (existingPolicy) existingPolicy.fallbacks = nextFallbacks;
	else team.routingPolicies.push({ role, fallbacks: nextFallbacks });

	if (team.lead.role === role) {
		team.lead.fallbacks = nextFallbacks;
	}

	for (const member of team.members) {
		if (member.role !== role) continue;
		member.provider = provider;
		member.model = model;
		member.routingPolicy = nextFallbacks;
	}

	for (const template of team.specialistTemplates) {
		if (template.role !== role) continue;
		template.defaultProvider = provider;
		template.defaultModel = model;
		template.fallbacks = nextFallbacks;
		template.updatedAt = new Date().toISOString();
	}
}

async function runRolePolicyCommand(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	initialTeamId?: string,
	initialRole?: string,
): Promise<void> {
	const office = await getOrCreateDefaultOffice();
	if (office.teams.length === 0) {
		ctx.ui.notify("No teams available. Create one with /office-create-team", "warning");
		return;
	}

	let team = initialTeamId ? office.teams.find((item) => item.id === initialTeamId) : undefined;
	if (!team) {
		const selectedTeam = await ctx.ui.select(
			"Select team",
			office.teams.map((candidateTeam) => `${candidateTeam.id}:${candidateTeam.name}`),
		);
		if (!selectedTeam) return;
		const teamId = selectedTeam.split(":")[0];
		team = office.teams.find((item) => item.id === teamId);
		if (!team) return;
	}

	const role = (await ctx.ui.input("Role", initialRole ?? team.lead.role))?.trim();
	if (!role) return;
	const fallbackCountInput = (await ctx.ui.input("How many fallback entries?", "2"))?.trim() ?? "2";
	const fallbackCountRaw = Number.parseInt(fallbackCountInput, 10);
	const fallbackCount = Number.isFinite(fallbackCountRaw) ? Math.min(Math.max(fallbackCountRaw, 1), 8) : 2;
	const fallbacks: Array<{ provider?: string; model: string }> = [];
	for (let i = 0; i < fallbackCount; i++) {
		const selectedModel = await selectModelOption(
			pi,
			ctx,
			`Select fallback ${i + 1}/${fallbackCount} for role ${role}`,
			i === 0 ? team.lead.fallbacks[0]?.provider : fallbacks[i - 1]?.provider,
			i === 0 ? team.lead.fallbacks[0]?.model : fallbacks[i - 1]?.model,
		);
		if (!selectedModel) return;
		fallbacks.push({ provider: selectedModel.provider, model: selectedModel.model });
	}

	team.routingPolicies = [...team.routingPolicies.filter((policy) => policy.role !== role), { role, fallbacks }];
	team.updatedAt = new Date().toISOString();
	office.updatedAt = team.updatedAt;
	await officeStore.save(office);
	await syncTeamStoreFromOfficeTeam(team);
	if (widgetState) setWidgetOffice(widgetState, office);
	ctx.ui.notify(
		`Updated ${team.name}/${role} policy: ${fallbacks.map((fallback) => `${fallback.provider ?? "default"}/${fallback.model}`).join(" -> ")}`,
		"info",
	);
}

async function runCreateTeamCommand(pi: ExtensionAPI, args: string, ctx: ExtensionCommandContext): Promise<void> {
	const now = new Date().toISOString();
	ctx.ui.notify("Step 1/6: Team identity", "info");
	let teamName = args.trim();
	if (!teamName) {
		const response = await ctx.ui.input("Team name", "frontend-platform");
		if (!response?.trim()) {
			ctx.ui.notify("Canceled team creation", "info");
			return;
		}
		teamName = response.trim();
	}
	const teamId = sanitizeId(teamName);
	if (!teamId) {
		ctx.ui.notify("Invalid team name", "warning");
		return;
	}
	const teamDescription = (
		await ctx.ui.input("Team mission/description", "Owns frontend architecture and delivery")
	)?.trim();

	ctx.ui.notify("Step 2/6: Team Lead identity", "info");
	const leadName = (await ctx.ui.input("Team lead display name", `${teamName} Lead`))?.trim() || `${teamName} Lead`;
	const leadRole =
		(await ctx.ui.input("Team lead role (responsibility label, not person name)", "engineering-lead"))?.trim() ||
		"engineering-lead";

	ctx.ui.notify("Step 3/6: Team Lead model selection", "info");
	const leadModelSelection = await selectModelOption(
		pi,
		ctx,
		"Select Team Lead model",
		"anthropic",
		"claude-sonnet-4-5",
	);
	if (!leadModelSelection) {
		ctx.ui.notify("Canceled team creation", "info");
		return;
	}

	ctx.ui.notify("Step 4/6: Specialist templates", "info");
	const specialistCountInput = (await ctx.ui.input("Number of specialist roles to scaffold", "2"))?.trim() ?? "2";
	const specialistCountRaw = Number.parseInt(specialistCountInput, 10);
	const specialistCount = Number.isFinite(specialistCountRaw) ? Math.min(Math.max(specialistCountRaw, 0), 12) : 2;

	const specialistAgents: AgentConfig[] = [];
	const specialistTemplates: SpecialistTemplate[] = [];
	for (let i = 0; i < specialistCount; i++) {
		ctx.ui.notify(`Configuring specialist ${i + 1}/${specialistCount}`, "info");
		const specialistName =
			(await ctx.ui.input(`Specialist ${i + 1} display name`, `Specialist ${i + 1}`))?.trim() ||
			`Specialist ${i + 1}`;
		const specialistRole =
			(await ctx.ui.input(`Specialist ${i + 1} role`, `specialist-${i + 1}`))?.trim() || `specialist-${i + 1}`;
		const specialistModelSelection = await selectModelOption(
			pi,
			ctx,
			`Select model for ${specialistRole}`,
			leadModelSelection.provider,
			leadModelSelection.model,
		);
		if (!specialistModelSelection) {
			ctx.ui.notify("Canceled team creation", "info");
			return;
		}
		const skillsRaw =
			(await ctx.ui.input(`Specialist ${i + 1} skills (comma-separated)`, "analysis,implementation"))?.trim() || "";
		const skills = skillsRaw
			.split(",")
			.map((skill) => skill.trim())
			.filter((skill) => skill.length > 0);
		const systemPrompt =
			(await ctx.ui.editor(
				`Specialist ${i + 1} system prompt`,
				`You are ${specialistName} (${specialistRole}) in team ${teamName}.\nDeliver concise, auditable specialist output.`,
			)) ?? "";

		const specialistId = `${teamId}-${sanitizeId(specialistRole)}-${i + 1}`;
		specialistAgents.push({
			id: specialistId,
			name: specialistName,
			role: specialistRole,
			model: specialistModelSelection.model,
			provider: specialistModelSelection.provider,
			systemPrompt,
			spawnMode: "subprocess",
			contextMode: "branched",
			routingPolicy: [{ provider: specialistModelSelection.provider, model: specialistModelSelection.model }],
		});

		specialistTemplates.push({
			id: `${teamId}-template-${sanitizeId(specialistRole)}-${i + 1}`,
			teamId,
			role: specialistRole,
			name: specialistName,
			description: `Template for ${specialistRole}`,
			skills,
			systemPrompt,
			defaultModel: specialistModelSelection.model,
			defaultProvider: specialistModelSelection.provider,
			fallbacks: [{ provider: specialistModelSelection.provider, model: specialistModelSelection.model }],
			createdAt: now,
			updatedAt: now,
		});
	}

	ctx.ui.notify("Step 5/6: Team persistence and routing policy", "info");
	const leadAgentId = `${teamId}-lead`;
	const leadAgent: AgentConfig = {
		id: leadAgentId,
		name: leadName,
		role: leadRole,
		model: leadModelSelection.model,
		provider: leadModelSelection.provider,
		spawnMode: "subprocess",
		contextMode: "branched",
		routingPolicy: [{ provider: leadModelSelection.provider, model: leadModelSelection.model }],
	};

	const allMembers = [leadAgent, ...specialistAgents];
	const team: TeamConfig = {
		id: teamId,
		name: teamName,
		description: teamDescription,
		members: allMembers,
		persistence: "disk",
		humanRole: "configurable",
		createdAt: now,
		updatedAt: now,
	};

	await teamStore.save(team);
	const office = await getOrCreateDefaultOffice();
	const existingTeamIndex = office.teams.findIndex((existingTeam) => existingTeam.id === team.id);
	const officeTeam = {
		id: team.id,
		name: team.name,
		description: team.description,
		lead: {
			agentId: leadAgentId,
			teamId,
			name: leadName,
			role: leadRole,
			fallbacks: [{ provider: leadModelSelection.provider, model: leadModelSelection.model }],
		},
		members: allMembers,
		specialistTemplates,
		routingPolicies: [
			{
				role: leadRole,
				fallbacks: [{ provider: leadModelSelection.provider, model: leadModelSelection.model }],
			},
			...specialistAgents.map((member) => ({
				role: member.role,
				fallbacks: member.routingPolicy ?? [{ provider: member.provider, model: member.model }],
			})),
		],
		createdAt: now,
		updatedAt: now,
	};

	if (existingTeamIndex >= 0) office.teams[existingTeamIndex] = officeTeam;
	else office.teams.push(officeTeam);
	await officeStore.save(office);
	if (widgetState) setWidgetOffice(widgetState, office);

	ctx.ui.notify("Step 6/6: Team created", "info");
	ctx.ui.notify(`Created team ${teamName} with lead ${leadName} and ${specialistAgents.length} specialists`, "info");
}

async function runSetInteractionModeCommand(ctx: ExtensionCommandContext, mode: string): Promise<void> {
	if (mode !== "routed" && mode !== "direct") {
		ctx.ui.notify("Usage: /office-interaction routed|direct", "warning");
		return;
	}
	const office = await getOrCreateDefaultOffice();
	office.interactionMode = mode;
	await officeStore.save(office);
	if (widgetState) setWidgetOffice(widgetState, office);
	await officeMessageBus.recordEvent({
		eventType: "office.interaction-mode",
		actorId: "user",
		data: { mode },
	});
	ctx.ui.notify(`Office interaction mode set to: ${mode}`, "info");
}

async function runAuditCommand(ctx: ExtensionCommandContext): Promise<void> {
	const events = await auditStore.listEvents(20);
	if (events.length === 0) {
		ctx.ui.notify("No audit events yet", "info");
		return;
	}
	const lines = events.map((event) => `${event.timestamp} ${event.eventType}`);
	ctx.ui.notify(`Recent audit events:\n${lines.join("\n")}`, "info");
}

function removeMemberFromTeam(
	team: OfficeConfig["teams"][number],
	memberId: string,
): { removed: boolean; message?: string } {
	const member = team.members.find((candidateMember) => candidateMember.id === memberId);
	if (!member) return { removed: false, message: "Member no longer exists" };
	if (member.id === team.lead.agentId) return { removed: false, message: "Team lead cannot be removed" };

	team.members = team.members.filter((candidateMember) => candidateMember.id !== memberId);
	team.specialistTemplates = team.specialistTemplates.filter(
		(template) => !(template.role === member.role && template.name === member.name),
	);

	const remainingRoles = new Set<string>(team.members.map((remainingMember) => remainingMember.role));
	remainingRoles.add(team.lead.role);
	team.routingPolicies = team.routingPolicies.filter((policy) => remainingRoles.has(policy.role));
	team.updatedAt = new Date().toISOString();
	return { removed: true };
}

async function syncTeamStoreFromOfficeTeam(team: OfficeConfig["teams"][number]): Promise<void> {
	const existing = await teamStore.load(team.id);
	if (!existing) return;
	const nextTeam: TeamConfig = {
		...existing,
		name: team.name,
		description: team.description,
		members: team.members,
		updatedAt: team.updatedAt,
	};
	await teamStore.save(nextTeam);
}

const monitorWidgetKey = "office-monitor";

function renderPinnedMonitorPanel(width: number): string[] {
	if (!widgetState) return [];
	return renderOfficeMonitor(width, widgetState);
}

async function syncPinnedMonitorPanel(ui: ExtensionUIContext): Promise<void> {
	if (!widgetState?.pinned) return;
	setWidgetOffice(widgetState, await getOrCreateDefaultOffice());
	ui.setWidget(
		monitorWidgetKey,
		() => ({
			render: (width: number) => renderPinnedMonitorPanel(width),
			invalidate: () => {},
		}),
		{ placement: "aboveEditor" },
	);
}

async function runDashboardAction(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	action: OfficeDashboardAction,
): Promise<void> {
	if (!action) return;
	switch (action.type) {
		case "create-team":
			await runCreateTeamCommand(pi, "", ctx);
			return;
		case "edit-role-policy":
			await runRolePolicyCommand(pi, ctx, action.teamId, action.role);
			return;
		case "set-interaction":
			await runSetInteractionModeCommand(ctx, action.mode);
			return;
		case "show-audit":
			await runAuditCommand(ctx);
			return;
		case "apply-role-model": {
			const office = await getOrCreateDefaultOffice();
			const team = office.teams.find((candidateTeam) => candidateTeam.id === action.teamId);
			if (!team) {
				ctx.ui.notify("Selected team no longer exists", "warning");
				return;
			}
			upsertRolePrimaryFallback(team, action.role, action.provider, action.model);
			team.updatedAt = new Date().toISOString();
			office.updatedAt = team.updatedAt;
			await officeStore.save(office);
			await syncTeamStoreFromOfficeTeam(team);
			if (widgetState) setWidgetOffice(widgetState, office);
			ctx.ui.notify(
				`Updated ${team.name}/${action.role} primary model to ${action.provider}/${action.model}`,
				"info",
			);
			return;
		}
		case "delete-team": {
			const office = await getOrCreateDefaultOffice();
			const team = office.teams.find((candidateTeam) => candidateTeam.id === action.teamId);
			if (!team) {
				ctx.ui.notify("Selected team no longer exists", "warning");
				return;
			}
			const confirmed = await ctx.ui.confirm("Delete team", `Delete team ${team.name}? This cannot be undone.`);
			if (!confirmed) return;
			office.teams = office.teams.filter((candidateTeam) => candidateTeam.id !== team.id);
			office.updatedAt = new Date().toISOString();
			await officeStore.save(office);
			await teamStore.delete(team.id);
			if (widgetState) setWidgetOffice(widgetState, office);
			ctx.ui.notify(`Deleted team ${team.name}`, "info");
			return;
		}
		case "remove-member": {
			const office = await getOrCreateDefaultOffice();
			const team = office.teams.find((candidateTeam) => candidateTeam.id === action.teamId);
			if (!team) {
				ctx.ui.notify("Selected team no longer exists", "warning");
				return;
			}
			const member = team.members.find((candidateMember) => candidateMember.id === action.memberId);
			if (!member) {
				ctx.ui.notify("Selected member no longer exists", "warning");
				return;
			}
			if (member.id === team.lead.agentId) {
				ctx.ui.notify("Cannot remove team lead from dashboard", "warning");
				return;
			}
			const confirmed = await ctx.ui.confirm(
				"Remove member",
				`Remove ${member.name} (${member.role}) from ${team.name}?`,
			);
			if (!confirmed) return;

			const result = removeMemberFromTeam(team, member.id);
			if (!result.removed) {
				ctx.ui.notify(result.message ?? "Unable to remove member", "warning");
				return;
			}
			office.updatedAt = team.updatedAt;
			await officeStore.save(office);
			await syncTeamStoreFromOfficeTeam(team);
			if (widgetState) setWidgetOffice(widgetState, office);
			ctx.ui.notify(`Removed ${member.name} from ${team.name}`, "info");
			return;
		}
	}
}

let widgetState: MonitorWidgetState | null = null;

export default function (pi: ExtensionAPI) {
	resolveSettings(pi);
	const depthCheck = checkSubagentDepth();
	if (depthCheck.blocked) return;

	pi.registerTool({
		name: "orchestrate",
		label: "Orchestrate Office",
		description: `Execute multi-agent coordination in The Office.\n\nModes:\n- chain: Sequential A→B→C where each step gets {previous} output\n- parallel: Run independent tasks concurrently\n- team: Persistent specialists with DAG-based task scheduling`,
		parameters: OrchestrateParamsSchema,
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			if (!widgetState) {
				const { state } = createMonitorWidget();
				widgetState = state;
			}

			const orchestrateParams = params as OrchestrateParams;
			const runtimeParams = orchestrateParams as unknown as OfficeOrchestrateParams;
			const office = await getOrCreateDefaultOffice();
			setWidgetOffice(widgetState, office);
			const route = routeToTeam(office, runtimeParams);

			await officeMessageBus.recordEvent({
				eventType: "office.workflow-start",
				threadId: route.threadId,
				correlationId: route.correlationId,
				data: { mode: orchestrateParams.mode },
			});

			if (route.team) {
				await officeMessageBus.recordRoute(route.correlationId, route.threadId, {
					teamId: route.team.id,
					teamName: route.team.name,
					reason: route.reason,
					teamLead: route.team.lead,
				});

				const delegatedTasks = decomposeLeadTasks(route.team, runtimeParams);
				const plannedNames = await planSpecialistInstanceNames(route.team, delegatedTasks);
				for (const task of delegatedTasks) {
					const sessionName = plannedNames[task.title];
					notePlannedSession(widgetState, task.assignee, sessionName);
					await officeMessageBus.recordSpawn(route.correlationId, route.threadId, {
						task: task.title,
						assignee: task.assignee,
						sessionName,
					});
				}

				if (orchestrateParams.mode === "team") {
					orchestrateParams.team = {
						teamId: route.team.id,
						name: route.team.name,
						members: applyTeamRoutingPolicies(route.team, route.team.members),
						tasks: delegatedTasks,
					};
				} else if (orchestrateParams.mode === "parallel") {
					const routeByRole = new Map(route.team.routingPolicies.map((policy) => [policy.role, policy.fallbacks]));
					orchestrateParams.tasks = toParallelTasksFromTeam(delegatedTasks).map((task) => ({
						...task,
						model: routeByRole.get(task.agent)?.[0]?.model ?? task.model,
					}));
				}
			}

			const result = await executeOrchestration(orchestrateParams, {
				cwd: ctx.cwd,
				signal,
				sessionManager: ctx.sessionManager,
				onProgress: (progress) => {
					updateWidgetFromProgress(widgetState!, progress);
					void syncPinnedMonitorPanel(ctx.ui);
				},
			});

			await officeMessageBus.recordEvent({
				eventType: "office.workflow-end",
				threadId: route.threadId,
				correlationId: route.correlationId,
				data: { mode: result.mode, durationMs: result.totalDurationMs },
			});

			return {
				content: [{ type: "text", text: formatOrchestrateResult(result) }],
				details: { result, threadId: route.threadId, correlationId: route.correlationId },
			};
		},
	});

	pi.registerCommand("office", {
		description: "Toggle the office monitor widget",
		handler: async (_args, ctx) => {
			if (!widgetState) {
				const { state } = createMonitorWidget();
				widgetState = state;
			}
			setWidgetOffice(widgetState, await getOrCreateDefaultOffice());

			widgetState.pinned = !widgetState.pinned;
			if (widgetState.pinned) {
				await syncPinnedMonitorPanel(ctx.ui);
				ctx.ui.notify("Office monitor pinned above editor", "info");
			} else {
				ctx.ui.setWidget(monitorWidgetKey, undefined);
				ctx.ui.notify("Office monitor unpinned", "info");
			}
		},
	});

	pi.registerCommand("office-teams", {
		description: "List saved office teams",
		handler: async (_args, ctx) => {
			const teams = await teamStore.list();
			if (teams.length === 0) {
				ctx.ui.notify("No office teams saved", "info");
				return;
			}
			ctx.ui.notify(
				`Teams:\n${teams.map((team) => `- ${team.name} (${team.members.length} members)`).join("\n")}`,
				"info",
			);
		},
	});

	pi.registerCommand("office-dashboard", {
		description: "Open interactive office dashboard",
		handler: async (_args, ctx) => {
			if (!hasScopedModelsApi(pi)) {
				ctx.ui.notify(
					"Scoped model API is unavailable in this pi runtime. Model management actions are disabled until pi is updated.",
					"warning",
				);
			}

			const restorePinnedPanel = widgetState?.pinned === true;
			if (restorePinnedPanel) {
				ctx.ui.setWidget(monitorWidgetKey, undefined);
			}

			try {
				while (true) {
					const office = await getOrCreateDefaultOffice();
					const scopedModels = getScopedDashboardModels(pi);
					const action = await ctx.ui.custom<OfficeDashboardAction>(
						(_tui, _theme, _keybindings, done) =>
							new OfficeDashboard(office, scopedModels, (result) => done(result)),
						{ overlay: true, overlayOptions: { anchor: "center", width: 96, maxHeight: "85%" } },
					);
					if (!action) return;
					await runDashboardAction(pi, ctx, action);
				}
			} finally {
				if (restorePinnedPanel) {
					await syncPinnedMonitorPanel(ctx.ui);
				}
			}
		},
	});

	pi.registerCommand("office-role-policy", {
		description: "Configure ordered provider/model fallback list for a team role",
		handler: async (_args, ctx) => {
			await runRolePolicyCommand(pi, ctx);
		},
	});

	pi.registerCommand("office-create-team", {
		description: "Create an office team scaffold",
		handler: async (args, ctx) => {
			await runCreateTeamCommand(pi, args, ctx);
		},
	});

	pi.registerCommand("office-interaction", {
		description: "Set office interaction mode: routed | direct",
		handler: async (args, ctx) => {
			await runSetInteractionModeCommand(ctx, args.trim());
		},
	});

	pi.registerCommand("office-audit", {
		description: "Show recent office audit events",
		handler: async (_args, ctx) => {
			await runAuditCommand(ctx);
		},
	});

	pi.registerCommand("office-chat", {
		description: "Send a message via routed or direct office interaction mode",
		handler: async (args, ctx) => {
			const message = args.trim();
			if (!message) {
				ctx.ui.notify("Usage: /office-chat <message>", "warning");
				return;
			}
			const office = await getOrCreateDefaultOffice();
			if (office.interactionMode === "direct") {
				if (ctx.isIdle()) {
					pi.sendUserMessage(`Direct office interaction: ${message}`);
				} else {
					pi.sendUserMessage(`Direct office interaction: ${message}`, { deliverAs: "followUp" });
				}
				await officeMessageBus.recordEvent({
					eventType: "office.message",
					actorId: "user",
					data: { mode: "direct", message },
				});
				ctx.ui.notify("Sent direct message", "info");
				return;
			}

			await officeMessageBus.recordEvent({
				eventType: "office.message",
				actorId: "user",
				data: { mode: "routed", message },
			});
			if (ctx.isIdle()) {
				pi.sendUserMessage(`Routed office request: ${message}`);
			} else {
				pi.sendUserMessage(`Routed office request: ${message}`, { deliverAs: "followUp" });
			}
			ctx.ui.notify("Sent routed message", "info");
		},
	});

	pi.on("before_agent_start", async (event, ctx) => {
		await syncPinnedMonitorPanel(ctx.ui);
		const officePrompt = `

---
## The Office

You have access to an orchestration system with an Office Manager, Team Leads, and Specialists.
Use the \`orchestrate\` tool for multi-agent execution.

Communication requirements:
- Keep delegation traceable and explicit.
- Include role-to-role handoffs in your reasoning.
- Prefer creating structured tasks over ad-hoc long prompts.
`;
		return { systemPrompt: event.systemPrompt + officePrompt };
	});

	pi.on("turn_end", async (_event, ctx) => {
		await syncPinnedMonitorPanel(ctx.ui);
	});

	pi.on("message_end", async (_event, ctx) => {
		await syncPinnedMonitorPanel(ctx.ui);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		ctx.ui.setWidget(monitorWidgetKey, undefined);
		if (widgetState) {
			widgetState.pinned = false;
		}
		widgetState = null;
	});
}

export { executeOrchestration, formatOrchestrateResult, OrchestrateParamsSchema };
export type { OrchestrateParams };
export { auditStore, officeStore, teamStore } from "./persistence/store.js";
export type { AgentCard, MonitorWidgetState } from "./tui/monitor-widget.js";
export { createMonitorWidget, updateWidgetFromProgress } from "./tui/monitor-widget.js";
