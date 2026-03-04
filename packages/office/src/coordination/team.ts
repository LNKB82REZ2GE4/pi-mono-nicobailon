/**
 * Team coordination - persistent specialists with shared task list.
 */

import { spawnAgentSubprocess } from "../core/spawn/subprocess.js";
import type {
	AgentConfig,
	AgentProgress,
	AgentResult,
	BranchedContext,
	Task,
	TaskStatus,
	TeamConfig,
	TeamResult,
	TeamTask,
	Usage,
} from "../core/types.js";
import { DEFAULT_CONCURRENCY, MAX_CONCURRENCY } from "../core/types.js";

export interface TeamOptions {
	cwd: string;
	signal?: AbortSignal;
	timeout?: number;
	concurrency?: number;
	onProgress?: (taskId: string, progress: AgentProgress) => void;
	onTaskComplete?: (taskId: string, result: AgentResult) => void;
	branchContext?: BranchedContext;
}

function aggregateUsage(results: AgentResult[]): Usage {
	return results.reduce(
		(acc, result) => ({
			input: acc.input + result.usage.input,
			output: acc.output + result.usage.output,
			cacheRead: acc.cacheRead + result.usage.cacheRead,
			cacheWrite: acc.cacheWrite + result.usage.cacheWrite,
			cost: acc.cost + result.usage.cost,
			turns: acc.turns + result.usage.turns,
		}),
		{ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 },
	);
}

class TaskGraph {
	private tasks: Map<string, Task> = new Map();
	private dependencies: Map<string, Set<string>> = new Map();

	addTask(task: Task): void {
		this.tasks.set(task.id, task);
		this.dependencies.set(task.id, new Set(task.dependsOn));
	}

	updateStatus(id: string, status: TaskStatus): void {
		const task = this.tasks.get(id);
		if (task) task.status = status;
	}

	getReadyTasks(): Task[] {
		const ready: Task[] = [];
		for (const [id, task] of this.tasks) {
			if (task.status !== "pending") continue;
			const deps = this.dependencies.get(id) ?? new Set();
			const allDepsComplete = Array.from(deps).every((depId) => this.tasks.get(depId)?.status === "completed");
			if (allDepsComplete) ready.push(task);
		}
		return ready;
	}

	getBlockedTasks(): Task[] {
		const blocked: Task[] = [];
		for (const [id, task] of this.tasks) {
			if (task.status !== "pending") continue;
			const deps = this.dependencies.get(id) ?? new Set();
			const hasFailedDep = Array.from(deps).some((depId) => this.tasks.get(depId)?.status === "failed");
			if (hasFailedDep) {
				task.status = "blocked";
				blocked.push(task);
			}
		}
		return blocked;
	}

	isComplete(): boolean {
		for (const task of this.tasks.values()) {
			if (task.status === "pending" || task.status === "running") return false;
		}
		return true;
	}

	getAllTasks(): Task[] {
		return Array.from(this.tasks.values());
	}
}

let taskCounter = 0;

function generateTaskId(): string {
	taskCounter += 1;
	return `task-${taskCounter}`;
}

function convertTeamTasks(teamTasks: TeamTask[]): Task[] {
	const titleToId = new Map<string, string>();
	const tasks: Task[] = [];

	for (const task of teamTasks) {
		const id = generateTaskId();
		titleToId.set(task.title, id);
		tasks.push({
			id,
			title: task.title,
			description: task.description,
			assignee: task.assignee,
			status: "pending",
			dependsOn: [],
		});
	}

	for (let i = 0; i < teamTasks.length; i++) {
		const task = teamTasks[i];
		const mapped = tasks[i];
		for (const ref of task.dependsOn ?? []) {
			const depId = titleToId.get(ref);
			if (depId && depId !== mapped.id) mapped.dependsOn.push(depId);
		}
	}

	return tasks;
}

function findAgent(team: TeamConfig, assignee: string): AgentConfig | undefined {
	return team.members.find((member) => member.id === assignee || member.name === assignee || member.role === assignee);
}

export async function executeTeam(team: TeamConfig, teamTasks: TeamTask[], options: TeamOptions): Promise<TeamResult> {
	const startTime = Date.now();
	const concurrency = Math.min(Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY), MAX_CONCURRENCY);

	const graph = new TaskGraph();
	const tasks = convertTeamTasks(teamTasks);
	for (const task of tasks) graph.addTask(task);

	const results: AgentResult[] = [];
	const runningTasks = new Map<string, Promise<AgentResult>>();

	while (!graph.isComplete()) {
		graph.getBlockedTasks();
		const ready = graph.getReadyTasks();
		if (ready.length === 0 && runningTasks.size === 0) break;

		const slots = Math.max(0, concurrency - runningTasks.size);
		const toStart = ready.slice(0, slots);

		for (const task of toStart) {
			const agent = findAgent(team, task.assignee);
			if (!agent) {
				graph.updateStatus(task.id, "failed");
				results.push({
					agentId: task.assignee,
					agentName: task.assignee,
					task: task.title,
					exitCode: 1,
					output: "",
					truncated: false,
					durationMs: 0,
					usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 },
					error: `Agent not found: ${task.assignee}`,
				});
				continue;
			}

			graph.updateStatus(task.id, "running");
			task.startedAt = new Date().toISOString();

			const taskPrompt = task.description ? `${task.title}\n${task.description}` : task.title;
			const promise = spawnAgentSubprocess(
				agent,
				taskPrompt,
				{
					cwd: options.cwd,
					signal: options.signal,
					timeout: options.timeout,
					onProgress: (progress) => options.onProgress?.(task.id, progress),
				},
				options.branchContext,
			).then((result) => {
				runningTasks.delete(task.id);
				if (result.exitCode === 0) {
					graph.updateStatus(task.id, "completed");
					task.result = result.output;
				} else {
					graph.updateStatus(task.id, "failed");
					task.error = result.error;
				}
				task.endedAt = new Date().toISOString();
				results.push(result);
				options.onTaskComplete?.(task.id, result);
				return result;
			});

			runningTasks.set(task.id, promise);
		}

		if (runningTasks.size > 0) {
			await Promise.race(runningTasks.values());
		}
	}

	if (runningTasks.size > 0) {
		await Promise.all(runningTasks.values());
	}

	const totalDurationMs = Date.now() - startTime;
	const totalUsage = aggregateUsage(results);
	const allTasks = graph.getAllTasks();

	return {
		mode: "team",
		workflowId: `workflow-${Date.now()}`,
		results,
		completed: allTasks.filter((task) => task.status === "completed").length,
		failed: allTasks.filter((task) => task.status === "failed").length,
		blocked: allTasks.filter((task) => task.status === "blocked").length,
		totalDurationMs,
		totalUsage,
	};
}
