import { randomUUID } from "node:crypto";
import type {
	AgentConfig,
	ModelFallbackChoice,
	OfficeConfig,
	OfficeTeam,
	OrchestrateParams,
	ParallelTask,
	TeamTask,
} from "../core/types.js";
import { generateOfficeSessionName } from "./session-name.js";

function taskTextFromParams(params: OrchestrateParams): string {
	if (params.mode === "chain") {
		return (params.chain ?? [])
			.map((step) => step.task)
			.join("\n")
			.slice(0, 1000);
	}
	if (params.mode === "parallel") {
		return (params.tasks ?? [])
			.map((task) => task.task)
			.join("\n")
			.slice(0, 1000);
	}
	return (params.team?.tasks ?? [])
		.map((task) => `${task.title} ${task.description ?? ""}`)
		.join("\n")
		.slice(0, 1000);
}

function scoreTeamForTask(team: OfficeTeam, taskText: string): number {
	const text = taskText.toLowerCase();
	let score = 0;
	if (text.includes(team.name.toLowerCase())) score += 6;
	if (team.description && text.includes(team.description.toLowerCase())) score += 3;
	for (const member of team.members) {
		if (text.includes(member.role.toLowerCase())) score += 2;
		if (text.includes(member.name.toLowerCase())) score += 2;
	}
	for (const policy of team.routingPolicies) {
		if (text.includes(policy.role.toLowerCase())) score += 1;
	}
	return score;
}

export function routeToTeam(
	office: OfficeConfig,
	params: OrchestrateParams,
): {
	team: OfficeTeam | undefined;
	reason: string;
	correlationId: string;
	threadId: string;
} {
	const taskText = taskTextFromParams(params);
	const scored = office.teams
		.map((team) => ({ team, score: scoreTeamForTask(team, taskText) }))
		.sort((a, b) => b.score - a.score);
	const picked = scored[0]?.team;
	const reason = picked
		? scored[0].score > 0
			? `matched team '${picked.name}' via keyword scoring`
			: `defaulted to first team '${picked.name}'`
		: "no team available";
	return {
		team: picked,
		reason,
		correlationId: randomUUID(),
		threadId: randomUUID(),
	};
}

function roleFallbacks(team: OfficeTeam, role: string): ModelFallbackChoice[] {
	return team.routingPolicies.find((policy) => policy.role === role)?.fallbacks ?? [];
}

export function applyTeamRoutingPolicies(team: OfficeTeam, members: AgentConfig[]): AgentConfig[] {
	return members.map((member) => ({
		...member,
		routingPolicy:
			member.routingPolicy && member.routingPolicy.length > 0
				? member.routingPolicy
				: roleFallbacks(team, member.role),
	}));
}

function pickAssigneeRole(task: TeamTask, team: OfficeTeam): string {
	if (task.assignee) return task.assignee;
	return team.members[0]?.role ?? team.lead.role;
}

export async function planSpecialistInstanceNames(
	team: OfficeTeam,
	tasks: TeamTask[],
): Promise<Record<string, string>> {
	const names: Record<string, string> = {};
	for (const task of tasks) {
		const role = pickAssigneeRole(task, team);
		names[task.title] = await generateOfficeSessionName({
			team: team.name,
			role,
			template: role,
			shortTask: task.title,
		});
	}
	return names;
}

export function decomposeLeadTasks(team: OfficeTeam, params: OrchestrateParams): TeamTask[] {
	if (params.mode === "team") {
		return (params.team?.tasks ?? []).map((task) => ({
			...task,
			assignee: task.assignee || pickAssigneeRole(task, team),
		}));
	}

	if (params.mode === "parallel") {
		return (params.tasks ?? []).map((task) => ({
			title: task.name ?? task.task.slice(0, 80),
			description: task.task,
			assignee: task.agent,
		}));
	}

	const chain = params.chain ?? [];
	const tasks: TeamTask[] = [];
	for (let i = 0; i < chain.length; i++) {
		const step = chain[i];
		tasks.push({
			title: `Chain step ${i + 1}`,
			description: step.task,
			assignee: step.agent,
			dependsOn: i === 0 ? [] : [`Chain step ${i}`],
		});
	}
	return tasks;
}

export function toParallelTasksFromTeam(tasks: TeamTask[]): ParallelTask[] {
	return tasks.map((task) => ({
		agent: task.assignee,
		name: task.title,
		task: `${task.title}${task.description ? `\n${task.description}` : ""}`,
	}));
}
