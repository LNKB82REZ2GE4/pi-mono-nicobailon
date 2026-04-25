/**
 * Main orchestration tool for LLM to invoke multi-agent coordination.
 */

import { type Static, Type } from "@sinclair/typebox";
import { executeChain } from "../coordination/chain.js";
import { executeParallel } from "../coordination/parallel.js";
import { executeTeam } from "../coordination/team.js";
import { buildBranchedContext } from "../core/context/branched.js";
import type { AgentConfig, AgentProgress, OrchestrateResult, TeamTask } from "../core/types.js";
import { DEFAULT_CONCURRENCY, DEFAULT_TIMEOUT_MS } from "../core/types.js";

// =============================================================================
// Tool Schemas
// =============================================================================

const ChainStepSchema = Type.Object({
	agent: Type.String({ description: "Agent name (e.g., 'scout', 'planner', 'worker')" }),
	task: Type.String({ description: "Task prompt. Use {previous} to reference prior step output" }),
	model: Type.Optional(Type.String({ description: "Model override (e.g., 'claude-haiku-4-5')" })),
	thinking: Type.Optional(
		Type.Union(
			[
				Type.Literal("off"),
				Type.Literal("minimal"),
				Type.Literal("low"),
				Type.Literal("medium"),
				Type.Literal("high"),
				Type.Literal("xhigh"),
			],
			{ description: "Thinking level" },
		),
	),
});

const ParallelTaskSchema = Type.Object({
	agent: Type.String({ description: "Agent name" }),
	task: Type.String({ description: "Task prompt" }),
	name: Type.Optional(Type.String({ description: "Display name for this task" })),
	model: Type.Optional(Type.String({ description: "Model override" })),
	thinking: Type.Optional(
		Type.Union([
			Type.Literal("off"),
			Type.Literal("minimal"),
			Type.Literal("low"),
			Type.Literal("medium"),
			Type.Literal("high"),
			Type.Literal("xhigh"),
		]),
	),
});

const TeamTaskSchema = Type.Object({
	title: Type.String({ description: "Task title" }),
	description: Type.Optional(Type.String({ description: "Detailed task description" })),
	assignee: Type.String({ description: "Agent name/role to assign" }),
	dependsOn: Type.Optional(Type.Array(Type.String(), { description: "Task titles this depends on" })),
});

const TeamConfigSchema = Type.Object({
	teamId: Type.Optional(Type.String({ description: "Existing team ID to use" })),
	name: Type.Optional(Type.String({ description: "Team name (for new team)" })),
	members: Type.Optional(
		Type.Array(
			Type.Object({
				id: Type.String({ description: "Agent ID" }),
				name: Type.String({ description: "Display name" }),
				role: Type.String({ description: "Role name" }),
				model: Type.String({ description: "Model to use" }),
				provider: Type.Optional(Type.String()),
				thinking: Type.Optional(Type.String()),
				tools: Type.Optional(Type.Array(Type.String())),
				systemPrompt: Type.Optional(Type.String()),
				routingPolicy: Type.Optional(
					Type.Array(
						Type.Object({
							provider: Type.Optional(Type.String()),
							model: Type.String(),
							thinking: Type.Optional(
								Type.Union([
									Type.Literal("off"),
									Type.Literal("minimal"),
									Type.Literal("low"),
									Type.Literal("medium"),
									Type.Literal("high"),
									Type.Literal("xhigh"),
								]),
							),
						}),
					),
				),
				spawnMode: Type.Optional(Type.Union([Type.Literal("subprocess"), Type.Literal("rpc")])),
				contextMode: Type.Optional(Type.Union([Type.Literal("fresh"), Type.Literal("branched")])),
			}),
		),
	),
	tasks: Type.Array(TeamTaskSchema, { description: "Tasks with dependencies" }),
});

export const OrchestrateParamsSchema = Type.Object({
	mode: Type.Union([Type.Literal("chain"), Type.Literal("parallel"), Type.Literal("team")], {
		description: "Execution mode: chain (sequential), parallel (concurrent), or team (persistent specialists)",
	}),

	// Chain mode
	chain: Type.Optional(
		Type.Array(ChainStepSchema, {
			description: "Sequential steps. Each step gets {previous} output.",
		}),
	),

	// Parallel mode
	tasks: Type.Optional(
		Type.Array(ParallelTaskSchema, {
			description: "Parallel tasks to run concurrently",
		}),
	),
	concurrency: Type.Optional(
		Type.Number({
			description: "Max concurrent tasks (default: 4, max: 8)",
			minimum: 1,
			maximum: 8,
		}),
	),

	// Team mode
	team: Type.Optional(TeamConfigSchema),

	// Common options
	timeout: Type.Optional(
		Type.Number({
			description: "Per-task timeout in milliseconds (default: 600000 = 10 min)",
		}),
	),
});

export type OrchestrateParams = Static<typeof OrchestrateParamsSchema>;

// =============================================================================
// Tool Definition
// =============================================================================

export interface OrchestrateToolOptions {
	/** Working directory */
	cwd: string;
	/** Abort signal */
	signal?: AbortSignal;
	/** Session manager for branched context */
	sessionManager?: {
		getEntries(): Array<{
			type: string;
			message?: {
				role: string;
				content?: string | Array<{ type: string; text?: string }>;
			};
		}>;
	};
	/** Progress callback for widget updates */
	onProgress?: (progress: AgentProgress) => void;
}

/**
 * Execute orchestration based on mode.
 */
export async function executeOrchestration(
	params: OrchestrateParams,
	options: OrchestrateToolOptions,
): Promise<OrchestrateResult> {
	// Build branched context if needed
	const branchContext = await buildBranchedContext({
		cwd: options.cwd,
		sessionManager: options.sessionManager,
	});

	switch (params.mode) {
		case "chain":
			return executeChainMode(params, options, branchContext);

		case "parallel":
			return executeParallelMode(params, options, branchContext);

		case "team":
			return executeTeamMode(params, options, branchContext);

		default:
			throw new Error(`Unknown mode: ${params.mode}`);
	}
}

// =============================================================================
// Mode Executors
// =============================================================================

async function executeChainMode(
	params: OrchestrateParams,
	options: OrchestrateToolOptions,
	branchContext: Awaited<ReturnType<typeof buildBranchedContext>>,
): Promise<OrchestrateResult> {
	if (!params.chain || params.chain.length === 0) {
		throw new Error("Chain mode requires 'chain' parameter with at least one step");
	}

	return executeChain(params.chain, {
		cwd: options.cwd,
		signal: options.signal,
		timeout: params.timeout ?? DEFAULT_TIMEOUT_MS,
		onProgress: (_stepIndex, _totalSteps, progress) => {
			options.onProgress?.(progress);
		},
		branchContext,
	});
}

async function executeParallelMode(
	params: OrchestrateParams,
	options: OrchestrateToolOptions,
	branchContext: Awaited<ReturnType<typeof buildBranchedContext>>,
): Promise<OrchestrateResult> {
	if (!params.tasks || params.tasks.length === 0) {
		throw new Error("Parallel mode requires 'tasks' parameter with at least one task");
	}

	return executeParallel(params.tasks, {
		cwd: options.cwd,
		signal: options.signal,
		timeout: params.timeout ?? DEFAULT_TIMEOUT_MS,
		concurrency: params.concurrency ?? DEFAULT_CONCURRENCY,
		onProgress: (_taskIndex, _totalTasks, progress) => {
			options.onProgress?.(progress);
		},
		branchContext,
	});
}

async function executeTeamMode(
	params: OrchestrateParams,
	options: OrchestrateToolOptions,
	branchContext: Awaited<ReturnType<typeof buildBranchedContext>>,
): Promise<OrchestrateResult> {
	if (!params.team || !params.team.tasks || params.team.tasks.length === 0) {
		throw new Error("Team mode requires 'team' parameter with at least one task");
	}

	// Build team config
	const team: AgentConfig[] =
		params.team.members?.map((m) => ({
			id: m.id,
			name: m.name,
			role: m.role,
			model: m.model,
			provider: m.provider,
			thinking: m.thinking as "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | undefined,
			tools: m.tools,
			systemPrompt: m.systemPrompt,
			routingPolicy: m.routingPolicy as AgentConfig["routingPolicy"],
			spawnMode: (m.spawnMode as "subprocess" | "rpc") ?? "subprocess",
			contextMode: (m.contextMode as "fresh" | "branched") ?? "fresh",
		})) ?? createDefaultTeam(params.team.tasks);

	const teamConfig = {
		id: params.team.teamId ?? `team-${Date.now()}`,
		name: params.team.name ?? "Ad-hoc Team",
		members: team,
		persistence: "none" as const,
		humanRole: "configurable" as const,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	return executeTeam(teamConfig, params.team.tasks, {
		cwd: options.cwd,
		signal: options.signal,
		timeout: params.timeout ?? DEFAULT_TIMEOUT_MS,
		concurrency: params.concurrency ?? DEFAULT_CONCURRENCY,
		onProgress: (_taskId, progress) => {
			options.onProgress?.(progress);
		},
		branchContext,
	});
}

// =============================================================================
// Default Team Creation
// =============================================================================

function createDefaultTeam(tasks: TeamTask[]): AgentConfig[] {
	// Extract unique assignees
	const assignees = new Set(tasks.map((t) => t.assignee));

	// Create default agents for each assignee
	return Array.from(assignees).map((assignee, index) => ({
		id: `agent-${index}`,
		name: assignee,
		role: assignee,
		model: "claude-sonnet-4-5",
		routingPolicy: [{ model: "claude-sonnet-4-5" }],
		spawnMode: "subprocess" as const,
		contextMode: "fresh" as const,
	}));
}

// =============================================================================
// Result Formatting
// =============================================================================

export function formatOrchestrateResult(result: OrchestrateResult): string {
	const lines: string[] = [];

	switch (result.mode) {
		case "chain":
			lines.push(`## Chain Execution: ${result.steps.length} steps`);
			lines.push(`Total: ${formatDuration(result.totalDurationMs)} | ${formatUsage(result.totalUsage)}`);
			lines.push("");
			for (let i = 0; i < result.steps.length; i++) {
				const step = result.steps[i];
				const icon = step.exitCode === 0 ? "✓" : "✗";
				lines.push(`### ${icon} Step ${i + 1}: ${step.agentName}`);
				lines.push(`Task: ${truncateText(step.task, 100)}`);
				lines.push(`Duration: ${formatDuration(step.durationMs)} | ${formatUsage(step.usage)}`);
				if (step.error) {
					lines.push(`Error: ${step.error}`);
				}
				lines.push("");
				lines.push("Output:");
				lines.push(truncateText(step.output, 2000));
				lines.push("");
			}
			break;

		case "parallel":
			lines.push(`## Parallel Execution: ${result.succeeded}/${result.results.length} succeeded`);
			lines.push(`Total: ${formatDuration(result.totalDurationMs)} | ${formatUsage(result.totalUsage)}`);
			lines.push("");
			for (const r of result.results) {
				const icon = r.exitCode === 0 ? "✓" : "✗";
				lines.push(`### ${icon} ${r.agentName}`);
				lines.push(`Task: ${truncateText(r.task, 100)}`);
				lines.push(`Duration: ${formatDuration(r.durationMs)} | ${formatUsage(r.usage)}`);
				if (r.error) {
					lines.push(`Error: ${r.error}`);
				}
				lines.push("");
				lines.push(truncateText(r.output, 1000));
				lines.push("");
			}
			break;

		case "team":
			lines.push(
				`## Team Execution: ${result.completed} completed, ${result.failed} failed, ${result.blocked} blocked`,
			);
			lines.push(`Workflow: ${result.workflowId}`);
			lines.push(`Total: ${formatDuration(result.totalDurationMs)} | ${formatUsage(result.totalUsage)}`);
			lines.push("");
			for (const r of result.results) {
				const icon = r.exitCode === 0 ? "✓" : "✗";
				lines.push(`### ${icon} ${r.agentName}`);
				lines.push(`Task: ${truncateText(r.task, 100)}`);
				if (r.error) {
					lines.push(`Error: ${r.error}`);
				}
				lines.push("");
			}
			break;
	}

	return lines.join("\n");
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	return `${(ms / 60000).toFixed(1)}m`;
}

function formatUsage(usage: { input: number; output: number; cost: number }): string {
	const tokens = usage.input + usage.output;
	const cost = usage.cost > 0 ? ` | $${usage.cost.toFixed(4)}` : "";
	return `${tokens} tokens${cost}`;
}

function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
}
