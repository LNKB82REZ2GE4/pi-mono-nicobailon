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

// =============================================================================
// Team Options
// =============================================================================

export interface TeamOptions {
	/** Working directory */
	cwd: string;
	/** Abort signal for cancellation */
	signal?: AbortSignal;
	/** Timeout per task in milliseconds */
	timeout?: number;
	/** Maximum concurrent agents */
	concurrency?: number;
	/** Progress callback */
	onProgress?: (taskId: string, progress: AgentProgress) => void;
	/** Task completion callback */
	onTaskComplete?: (taskId: string, result: AgentResult) => void;
	/** Branched context from parent session */
	branchContext?: BranchedContext;
}

// =============================================================================
// Usage Aggregation
// =============================================================================

function aggregateUsage(results: AgentResult[]): Usage {
	return results.reduce(
		(acc, r) => ({
			input: acc.input + r.usage.input,
			output: acc.output + r.usage.output,
			cacheRead: acc.cacheRead + r.usage.cacheRead,
			cacheWrite: acc.cacheWrite + r.usage.cost,
			cost: acc.cost + r.usage.cost,
			turns: acc.turns + r.usage.turns,
		}),
		{ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 },
	);
}

// =============================================================================
// Task Graph (DAG)
// =============================================================================

class TaskGraph {
	private tasks: Map<string, Task> = new Map();
	private dependencies: Map<string, Set<string>> = new Map();
	private dependents: Map<string, Set<string>> = new Map();

	addTask(task: Task): void {
		this.tasks.set(task.id, task);
		this.dependencies.set(task.id, new Set(task.dependsOn));

		for (const depId of task.dependsOn) {
			if (!this.dependents.has(depId)) {
				this.dependents.set(depId, new Set());
			}
			this.dependents.get(depId)!.add(task.id);
		}
	}

	getTask(id: string): Task | undefined {
		return this.tasks.get(id);
	}

	updateStatus(id: string, status: TaskStatus): void {
		const task = this.tasks.get(id);
		if (task) {
			task.status = status;
		}
	}

	/** Get tasks that are ready to run (all dependencies completed) */
	getReadyTasks(): Task[] {
		const ready: Task[] = [];

		for (const [id, task] of this.tasks) {
			if (task.status !== "pending") continue;

			const deps = this.dependencies.get(id) ?? new Set();
			const allDepsComplete = Array.from(deps).every((depId) => {
				const depTask = this.tasks.get(depId);
				return depTask?.status === "completed";
			});

			if (allDepsComplete) {
				ready.push(task);
			}
		}

		return ready;
	}

	/** Get tasks that are blocked (dependencies failed) */
	getBlockedTasks(): Task[] {
		const blocked: Task[] = [];

		for (const [id, task] of this.tasks) {
			if (task.status !== "pending") continue;

			const deps = this.dependencies.get(id) ?? new Set();
			const hasFailedDep = Array.from(deps).some((depId) => {
				const depTask = this.tasks.get(depId);
				return depTask?.status === "failed";
			});

			if (hasFailedDep) {
				task.status = "blocked";
				blocked.push(task);
			}
		}

		return blocked;
	}

	/** Check if all tasks are done */
	isComplete(): boolean {
		for (const task of this.tasks.values()) {
			if (task.status === "pending" || task.status === "running") {
				return false;
			}
		}
		return true;
	}

	/** Get all tasks */
	getAllTasks(): Task[] {
		return Array.from(this.tasks.values());
	}
}

// =============================================================================
// Task ID Generation
// =============================================================================

let taskCounter = 0;

function generateTaskId(): string {
	return `task-${++taskCounter}`;
}

// =============================================================================
// Convert TeamTasks to Tasks
// =============================================================================

function convertTeamTasks(teamTasks: TeamTask[], _team: TeamConfig): Task[] {
	// First pass: create tasks with temporary dependency resolution
	const titleToId = new Map<string, string>();
	const tasks: Task[] = [];

	for (const tt of teamTasks) {
		const id = generateTaskId();
		titleToId.set(tt.title, id);
		titleToId.set(tt.assignee, id); // Also allow assignee as reference

		tasks.push({
			id,
			title: tt.title,
			description: tt.description,
			assignee: tt.assignee,
			status: "pending",
			dependsOn: [],
			startedAt: undefined,
			endedAt: undefined,
		});
	}

	// Second pass: resolve dependencies
	for (let i = 0; i < teamTasks.length; i++) {
		const tt = teamTasks[i];
		const task = tasks[i];

		if (tt.dependsOn) {
			for (const depRef of tt.dependsOn) {
				const depId = titleToId.get(depRef);
				if (depId && depId !== task.id) {
					task.dependsOn.push(depId);
				}
			}
		}
	}

	return tasks;
}

// =============================================================================
// Find Agent by Assignee
// =============================================================================

function findAgent(team: TeamConfig, assignee: string): AgentConfig | undefined {
	return team.members.find((m) => m.id === assignee || m.name === assignee || m.role === assignee);
}

// =============================================================================
// Team Executor
// =============================================================================

/**
 * Execute team tasks with DAG-based scheduling.
 * Runs tasks in waves based on dependency completion.
 */
export async function executeTeam(team: TeamConfig, teamTasks: TeamTask[], options: TeamOptions): Promise<TeamResult> {
	const startTime = Date.now();
	const concurrency = Math.min(Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY), MAX_CONCURRENCY);

	// Build task graph
	const graph = new TaskGraph();
	const tasks = convertTeamTasks(teamTasks, team);
	for (const task of tasks) {
		graph.addTask(task);
	}

	const results: AgentResult[] = [];
	const runningTasks = new Map<string, Promise<AgentResult>>();

	// Process tasks in waves
	while (!graph.isComplete()) {
		// Check for blocked tasks
		const blocked = graph.getBlockedTasks();
		for (const _task of blocked) {
			// Record blocked status
		}

		// Get ready tasks
		const ready = graph.getReadyTasks();
		if (ready.length === 0 && runningTasks.size === 0) {
			// No ready tasks and nothing running - we're stuck
			break;
		}

		// Start ready tasks up to concurrency limit
		const toStart = ready.slice(0, concurrency - runningTasks.size);

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

			const promise = spawnAgentSubprocess(
				agent,
				task.title,
				{
					cwd: options.cwd,
					signal: options.signal,
					timeout: options.timeout,
					onProgress: (progress) => {
						options.onProgress?.(task.id, progress);
					},
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
				options.onTaskComplete?.(task.id, result);

				return result;
			});

			runningTasks.set(task.id, promise);
		}

		// Wait for at least one task to complete
		if (runningTasks.size > 0) {
			await Promise.race(runningTasks.values());
		}
	}

	// Wait for remaining tasks
	const remainingResults = await Promise.all(runningTasks.values());
	results.push(...remainingResults);

	const totalDurationMs = Date.now() - startTime;
	const totalUsage = aggregateUsage(results);
	const allTasks = graph.getAllTasks();

	return {
		mode: "team",
		workflowId: `workflow-${Date.now()}`,
		results,
		completed: allTasks.filter((t) => t.status === "completed").length,
		failed: allTasks.filter((t) => t.status === "failed").length,
		blocked: allTasks.filter((t) => t.status === "blocked").length,
		totalDurationMs,
		totalUsage,
	};
}
