/**
 * Subprocess spawning for agents.
 *
 * Spawns isolated pi subprocesses for agent execution.
 * Inspired by pi-subagent and pi-interactive-shell patterns.
 */

import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentConfig, AgentProgress, AgentResult, BranchedContext, Usage } from "../types.js";
import { MAX_OUTPUT_BYTES, MAX_OUTPUT_LINES } from "../types.js";

// =============================================================================
// Subprocess Options
// =============================================================================

export interface SubprocessOptions {
	/** Working directory */
	cwd: string;
	/** Abort signal for cancellation */
	signal?: AbortSignal;
	/** Timeout in milliseconds */
	timeout?: number;
	/** Progress callback */
	onProgress?: (progress: AgentProgress) => void;
	/** Environment variables to pass */
	env?: Record<string, string>;
}

// =============================================================================
// Output Truncation
// =============================================================================

interface TruncationResult {
	text: string;
	truncated: boolean;
	originalBytes: number;
	originalLines: number;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function truncateOutput(output: string): TruncationResult {
	const lines = output.split("\n");
	const bytes = Buffer.byteLength(output, "utf-8");

	if (bytes <= MAX_OUTPUT_BYTES && lines.length <= MAX_OUTPUT_LINES) {
		return { text: output, truncated: false, originalBytes: bytes, originalLines: lines.length };
	}

	// Truncate to limits
	const truncatedLines = lines.slice(0, MAX_OUTPUT_LINES);
	let result = truncatedLines.join("\n");

	// Further truncate by bytes if needed
	if (Buffer.byteLength(result, "utf-8") > MAX_OUTPUT_BYTES) {
		let low = 0;
		let high = result.length;
		while (low < high) {
			const mid = Math.floor((low + high + 1) / 2);
			if (Buffer.byteLength(result.slice(0, mid), "utf-8") <= MAX_OUTPUT_BYTES) {
				low = mid;
			} else {
				high = mid - 1;
			}
		}
		result = result.slice(0, low);
	}

	const keptLines = result.split("\n").length;
	const marker = `[TRUNCATED: ${keptLines} of ${lines.length} lines, ${formatBytes(Buffer.byteLength(result))} of ${formatBytes(bytes)}]\n`;

	return {
		text: marker + result,
		truncated: true,
		originalBytes: bytes,
		originalLines: lines.length,
	};
}

// =============================================================================
// Context Generation
// =============================================================================

function buildFreshContext(task: string): string {
	return `Task: ${task}`;
}

function buildBranchedContext(task: string, context: BranchedContext): string {
	const parts: string[] = [];

	parts.push("=== Session Context ===\n");

	if (context.gitBranch) {
		parts.push(`Git Branch: ${context.gitBranch}`);
	}
	if (context.gitStatus) {
		parts.push(`Git Status:\n${context.gitStatus}`);
	}
	if (context.fileSummary) {
		parts.push(`\nRecent Files:\n${context.fileSummary}`);
	}
	if (context.decisions && context.decisions.length > 0) {
		parts.push(`\nKey Decisions:\n${context.decisions.map((d) => `- ${d}`).join("\n")}`);
	}
	if (context.openQuestions && context.openQuestions.length > 0) {
		parts.push(`\nOpen Questions:\n${context.openQuestions.map((q) => `- ${q}`).join("\n")}`);
	}
	if (context.conversationSummary) {
		parts.push(`\nConversation Summary:\n${context.conversationSummary}`);
	}

	parts.push(`\n=== Task ===\n${task}`);

	return parts.join("\n");
}

// =============================================================================
// Usage Parsing
// =============================================================================

function parseUsage(output: string): Usage {
	const usage: Usage = {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		cost: 0,
		turns: 0,
	};

	// Try to extract usage from JSON output if available
	// Look for patterns like: "usage": {"input": 123, "output": 456, ...}
	const usageMatch = output.match(/"usage":\s*\{[^}]+\}/);
	if (usageMatch) {
		try {
			const parsed = JSON.parse(`{${usageMatch[0]}}`);
			if (parsed.usage) {
				usage.input = parsed.usage.input ?? 0;
				usage.output = parsed.usage.output ?? 0;
				usage.cacheRead = parsed.usage.cacheRead ?? 0;
				usage.cacheWrite = parsed.usage.cacheWrite ?? 0;
				usage.cost = parsed.usage.cost ?? 0;
				usage.turns = parsed.usage.turns ?? 1;
			}
		} catch {
			// Ignore parse errors
		}
	}

	return usage;
}

// =============================================================================
// Progress Tracking
// =============================================================================

function createInitialProgress(agentId: string, agentName: string, task: string): AgentProgress {
	return {
		agentId,
		agentName,
		status: "running",
		task,
		recentTools: [],
		recentOutput: [],
		toolCount: 0,
		tokens: 0,
		durationMs: 0,
	};
}

function parseProgressFromOutput(output: string, progress: AgentProgress): void {
	const lines = output.split("\n").slice(-20); // Last 20 lines

	for (const line of lines) {
		// Look for tool calls
		const toolMatch = line.match(/Tool call:\s*(\w+)/);
		if (toolMatch) {
			progress.currentTool = toolMatch[1];
			progress.toolCount++;
			progress.recentTools.push({
				tool: toolMatch[1],
				args: "",
				timestamp: new Date().toISOString(),
			});
			if (progress.recentTools.length > 5) {
				progress.recentTools.shift();
			}
		}

		// Look for token usage
		const tokenMatch = line.match(/(\d+)\s*tokens/);
		if (tokenMatch) {
			progress.tokens = parseInt(tokenMatch[1], 10);
		}
	}

	// Update recent output
	progress.recentOutput = lines.slice(-5).filter((l) => l.trim().length > 0);
}

// =============================================================================
// Subprocess Spawner
// =============================================================================

/**
 * Spawn an agent as a subprocess.
 */
export async function spawnAgentSubprocess(
	agent: AgentConfig,
	task: string,
	options: SubprocessOptions,
	branchContext?: BranchedContext,
): Promise<AgentResult> {
	const startTime = Date.now();
	const progress = createInitialProgress(agent.id, agent.name, task);

	// Build the prompt based on context mode
	const prompt =
		agent.contextMode === "branched" && branchContext
			? buildBranchedContext(task, branchContext)
			: buildFreshContext(task);

	// Build command arguments
	const args: string[] = ["--print"]; // Print mode for non-interactive

	// Model selection
	if (agent.provider) {
		args.push("--model", `${agent.provider}/${agent.model}`);
	} else {
		args.push("--model", agent.model);
	}

	// Thinking level
	if (agent.thinking) {
		args.push("--thinking", agent.thinking);
	}

	// Tools restriction
	if (agent.tools && agent.tools.length > 0) {
		args.push("--no-tools");
		for (const tool of agent.tools) {
			args.push("--tool", tool);
		}
	}

	// Extensions
	if (agent.extensions && agent.extensions.length > 0) {
		args.push("--no-extensions");
		for (const ext of agent.extensions) {
			args.push("--extension", ext);
		}
	} else {
		// By default, subagents run without extensions for isolation
		args.push("--no-extensions");
	}

	// Add offline mode to skip network operations at startup
	const env: Record<string, string> = {
		...process.env,
		...options.env,
		PI_OFFLINE: "1",
		PI_SUBAGENT_DEPTH: String(Number(process.env.PI_SUBAGENT_DEPTH ?? "0") + 1),
		PI_SUBAGENT_MAX_DEPTH: process.env.PI_SUBAGENT_MAX_DEPTH ?? "2",
	};

	// Add system prompt if provided
	if (agent.systemPrompt) {
		// Create temp file for system prompt
		const tmpDir = path.join(os.tmpdir(), "pi-orchestration");
		if (!fs.existsSync(tmpDir)) {
			fs.mkdirSync(tmpDir, { recursive: true });
		}
		const promptFile = path.join(tmpDir, `prompt-${agent.id}-${Date.now()}.md`);
		fs.writeFileSync(promptFile, agent.systemPrompt);
		args.push("--system-prompt", promptFile);
	}

	return new Promise((resolve, _reject) => {
		let stdout = "";
		let stderr = "";
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let killed = false;

		const child = child_process.spawn("pi", [...args, prompt], {
			cwd: options.cwd,
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});

		// Timeout handling
		const timeout = options.timeout ?? 600000; // 10 min default
		timeoutId = setTimeout(() => {
			killed = true;
			child.kill("SIGTERM");
			const durationMs = Date.now() - startTime;

			options.onProgress?.({
				...progress,
				status: "failed",
				error: "Timeout exceeded",
				durationMs,
			});

			resolve({
				agentId: agent.id,
				agentName: agent.name,
				task,
				exitCode: 1,
				output: truncateOutput(stdout).text,
				truncated: true,
				durationMs,
				usage: parseUsage(stdout),
				error: "Timeout exceeded",
			});
		}, timeout);

		// Abort signal handling
		if (options.signal) {
			options.signal.addEventListener("abort", () => {
				if (timeoutId) clearTimeout(timeoutId);
				killed = true;
				child.kill("SIGTERM");
			});
		}

		// stdout collection
		child.stdout?.on("data", (data: Buffer) => {
			stdout += data.toString();

			// Update progress periodically
			progress.durationMs = Date.now() - startTime;
			parseProgressFromOutput(stdout, progress);
			options.onProgress?.(progress);
		});

		// stderr collection
		child.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		// Handle completion
		child.on("close", (code) => {
			if (timeoutId) clearTimeout(timeoutId);
			if (killed) return;

			const durationMs = Date.now() - startTime;
			const truncation = truncateOutput(stdout);
			const usage = parseUsage(stdout);

			const result: AgentResult = {
				agentId: agent.id,
				agentName: agent.name,
				task,
				exitCode: code ?? 1,
				output: truncation.text,
				truncated: truncation.truncated,
				durationMs,
				usage,
			};

			if (code !== 0) {
				result.error = stderr || `Process exited with code ${code}`;
			}

			options.onProgress?.({
				...progress,
				status: code === 0 ? "completed" : "failed",
				error: result.error,
				durationMs,
			});

			resolve(result);
		});

		// Handle errors
		child.on("error", (err) => {
			if (timeoutId) clearTimeout(timeoutId);
			if (killed) return;

			const durationMs = Date.now() - startTime;

			resolve({
				agentId: agent.id,
				agentName: agent.name,
				task,
				exitCode: 1,
				output: truncateOutput(stdout).text,
				truncated: false,
				durationMs,
				usage: parseUsage(stdout),
				error: err.message,
			});
		});
	});
}

// =============================================================================
// Recursion Depth Guard
// =============================================================================

const DEFAULT_MAX_DEPTH = 2;

export function checkSubagentDepth(): { blocked: boolean; depth: number; maxDepth: number } {
	const depth = Number(process.env.PI_SUBAGENT_DEPTH ?? "0");
	const maxDepth = Number(process.env.PI_SUBAGENT_MAX_DEPTH ?? String(DEFAULT_MAX_DEPTH));
	const blocked = Number.isFinite(depth) && Number.isFinite(maxDepth) && depth >= maxDepth;
	return { blocked, depth, maxDepth };
}
