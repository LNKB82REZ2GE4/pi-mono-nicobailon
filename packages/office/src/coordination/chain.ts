/**
 * Chain execution - sequential A→B→C where each step gets prior output.
 */

import { spawnAgentSubprocess } from "../core/spawn/subprocess.js";
import type {
	AgentConfig,
	AgentProgress,
	AgentResult,
	BranchedContext,
	ChainResult,
	ChainStep,
	Usage,
} from "../core/types.js";

// =============================================================================
// Chain Options
// =============================================================================

export interface ChainOptions {
	/** Working directory */
	cwd: string;
	/** Abort signal for cancellation */
	signal?: AbortSignal;
	/** Timeout per step in milliseconds */
	timeout?: number;
	/** Progress callback */
	onProgress?: (stepIndex: number, totalSteps: number, progress: AgentProgress) => void;
	/** Step completion callback */
	onStepComplete?: (stepIndex: number, result: AgentResult) => void;
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
// Task Interpolation
// =============================================================================

function interpolateTask(task: string, previousOutput: string | null): string {
	if (!previousOutput) return task;

	// Replace {previous} with the previous step's output
	return task.replace(/\{previous\}/g, previousOutput);
}

// =============================================================================
// Agent Resolution
// =============================================================================

function resolveAgent(step: ChainStep, index: number): AgentConfig {
	return {
		id: `chain-agent-${index}`,
		name: step.agent,
		role: step.agent,
		model: step.model ?? "claude-sonnet-4-5",
		thinking: step.thinking,
		spawnMode: "subprocess",
		contextMode: "fresh",
	};
}

// =============================================================================
// Chain Executor
// =============================================================================

/**
 * Execute a chain of agents sequentially.
 * Each step receives the output of the previous step via {previous} placeholder.
 */
export async function executeChain(steps: ChainStep[], options: ChainOptions): Promise<ChainResult> {
	const startTime = Date.now();
	const results: AgentResult[] = [];
	let previousOutput: string | null = null;

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const agent = resolveAgent(step, i);

		// Interpolate {previous} in task
		const task = interpolateTask(step.task, previousOutput);

		// Execute this step
		const result = await spawnAgentSubprocess(
			agent,
			task,
			{
				cwd: options.cwd,
				signal: options.signal,
				timeout: options.timeout,
				onProgress: (progress) => {
					options.onProgress?.(i, steps.length, progress);
				},
			},
			options.branchContext,
		);

		results.push(result);

		// Notify step completion
		options.onStepComplete?.(i, result);

		// Store output for next step
		previousOutput = result.output;

		// If step failed, stop the chain
		if (result.exitCode !== 0) {
			break;
		}
	}

	const totalDurationMs = Date.now() - startTime;
	const totalUsage = aggregateUsage(results);

	return {
		mode: "chain",
		steps: results,
		totalDurationMs,
		totalUsage,
	};
}
