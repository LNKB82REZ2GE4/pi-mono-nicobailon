/**
 * Parallel execution - run independent tasks concurrently.
 */

import { spawnAgentSubprocess } from "../core/spawn/subprocess.js";
import type {
	AgentConfig,
	AgentProgress,
	AgentResult,
	BranchedContext,
	ParallelResult,
	ParallelTask,
	Usage,
} from "../core/types.js";
import { DEFAULT_CONCURRENCY, MAX_CONCURRENCY } from "../core/types.js";

// =============================================================================
// Parallel Options
// =============================================================================

export interface ParallelOptions {
	/** Working directory */
	cwd: string;
	/** Abort signal for cancellation */
	signal?: AbortSignal;
	/** Timeout per task in milliseconds */
	timeout?: number;
	/** Maximum concurrent tasks */
	concurrency?: number;
	/** Progress callback */
	onProgress?: (taskIndex: number, totalTasks: number, progress: AgentProgress) => void;
	/** Task completion callback */
	onTaskComplete?: (taskIndex: number, result: AgentResult) => void;
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
			cacheWrite: acc.cacheWrite + r.usage.cacheWrite,
			cost: acc.cost + r.usage.cost,
			turns: acc.turns + r.usage.turns,
		}),
		{ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 },
	);
}

// =============================================================================
// Agent Resolution
// =============================================================================

function resolveAgent(task: ParallelTask, index: number): AgentConfig {
	return {
		id: `parallel-agent-${index}`,
		name: task.name ?? task.agent,
		role: task.agent,
		model: task.model ?? "claude-sonnet-4-5",
		thinking: task.thinking,
		spawnMode: "subprocess",
		contextMode: "fresh",
	};
}

// =============================================================================
// Concurrency Limiter
// =============================================================================

async function runWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let nextIndex = 0;

	async function worker(): Promise<void> {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await fn(items[index], index);
		}
	}

	const workers = Array(Math.min(concurrency, items.length))
		.fill(null)
		.map(() => worker());

	await Promise.all(workers);
	return results;
}

// =============================================================================
// Parallel Executor
// =============================================================================

/**
 * Execute parallel tasks concurrently with a concurrency limit.
 */
export async function executeParallel(tasks: ParallelTask[], options: ParallelOptions): Promise<ParallelResult> {
	const startTime = Date.now();
	const concurrency = Math.min(Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY), MAX_CONCURRENCY);

	const results = await runWithConcurrency(tasks, concurrency, async (task, index) => {
		const agent = resolveAgent(task, index);

		return spawnAgentSubprocess(
			agent,
			task.task,
			{
				cwd: options.cwd,
				signal: options.signal,
				timeout: options.timeout,
				onProgress: (progress) => {
					options.onProgress?.(index, tasks.length, progress);
				},
			},
			options.branchContext,
		);
	});

	// Notify completions
	results.forEach((result, index) => {
		options.onTaskComplete?.(index, result);
	});

	const totalDurationMs = Date.now() - startTime;
	const totalUsage = aggregateUsage(results);
	const succeeded = results.filter((r) => r.exitCode === 0).length;
	const failed = results.filter((r) => r.exitCode !== 0).length;

	return {
		mode: "parallel",
		results,
		succeeded,
		failed,
		totalDurationMs,
		totalUsage,
	};
}
