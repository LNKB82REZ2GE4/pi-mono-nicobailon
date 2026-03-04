/**
 * Subprocess spawning for agents.
 */

import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentConfig, AgentProgress, AgentResult, BranchedContext, ModelFallbackChoice, Usage } from "../types.js";
import { MAX_OUTPUT_BYTES, MAX_OUTPUT_LINES } from "../types.js";

export interface SubprocessOptions {
	cwd: string;
	signal?: AbortSignal;
	timeout?: number;
	onProgress?: (progress: AgentProgress) => void;
	env?: Record<string, string>;
}

interface TruncationResult {
	text: string;
	truncated: boolean;
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
		return { text: output, truncated: false };
	}

	const truncatedLines = lines.slice(0, MAX_OUTPUT_LINES);
	let result = truncatedLines.join("\n");

	if (Buffer.byteLength(result, "utf-8") > MAX_OUTPUT_BYTES) {
		let low = 0;
		let high = result.length;
		while (low < high) {
			const mid = Math.floor((low + high + 1) / 2);
			if (Buffer.byteLength(result.slice(0, mid), "utf-8") <= MAX_OUTPUT_BYTES) low = mid;
			else high = mid - 1;
		}
		result = result.slice(0, low);
	}

	const marker = `[TRUNCATED: ${result.split("\n").length} of ${lines.length} lines, ${formatBytes(Buffer.byteLength(result))} of ${formatBytes(bytes)}]\n`;
	return { text: marker + result, truncated: true };
}

function buildFreshContext(task: string): string {
	return `Task: ${task}`;
}

function buildBranchedContext(task: string, context: BranchedContext): string {
	const parts: string[] = [];
	parts.push("=== Session Context ===\n");
	if (context.gitBranch) parts.push(`Git Branch: ${context.gitBranch}`);
	if (context.gitStatus) parts.push(`Git Status:\n${context.gitStatus}`);
	if (context.fileSummary) parts.push(`\nRecent Files:\n${context.fileSummary}`);
	if (context.decisions && context.decisions.length > 0)
		parts.push(`\nKey Decisions:\n${context.decisions.map((d) => `- ${d}`).join("\n")}`);
	if (context.openQuestions && context.openQuestions.length > 0)
		parts.push(`\nOpen Questions:\n${context.openQuestions.map((q) => `- ${q}`).join("\n")}`);
	if (context.conversationSummary) parts.push(`\nConversation Summary:\n${context.conversationSummary}`);
	parts.push(`\n=== Task ===\n${task}`);
	return parts.join("\n");
}

function parseUsage(_output: string): Usage {
	return {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		cost: 0,
		turns: 0,
	};
}

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

function buildFallbackCandidates(agent: AgentConfig): ModelFallbackChoice[] {
	const base: ModelFallbackChoice = {
		provider: agent.provider,
		model: agent.model,
		thinking: agent.thinking,
	};
	const seen = new Set<string>();
	const candidates: ModelFallbackChoice[] = [];
	for (const candidate of [base, ...(agent.routingPolicy ?? [])]) {
		const key = `${candidate.provider ?? ""}/${candidate.model}:${candidate.thinking ?? ""}`;
		if (seen.has(key)) continue;
		seen.add(key);
		candidates.push(candidate);
	}
	return candidates;
}

function isQuotaLikeError(stderr: string, stdout: string): boolean {
	const combined = `${stderr}\n${stdout}`.toLowerCase();
	return (
		combined.includes("quota") ||
		combined.includes("rate limit") ||
		combined.includes("429") ||
		combined.includes("insufficient") ||
		combined.includes("billing")
	);
}

function parseProgressFromOutput(output: string, progress: AgentProgress): void {
	const lines = output.split("\n").slice(-20);
	for (const line of lines) {
		const toolMatch = line.match(/Tool call:\s*(\w+)/);
		if (toolMatch) {
			progress.currentTool = toolMatch[1];
			progress.toolCount++;
			progress.recentTools.push({ tool: toolMatch[1], args: "", timestamp: new Date().toISOString() });
			if (progress.recentTools.length > 5) progress.recentTools.shift();
		}
		const tokenMatch = line.match(/(\d+)\s*tokens/);
		if (tokenMatch) progress.tokens = Number.parseInt(tokenMatch[1], 10);
	}
	progress.recentOutput = lines.slice(-5).filter((line) => line.trim().length > 0);
}

export async function spawnAgentSubprocess(
	agent: AgentConfig,
	task: string,
	options: SubprocessOptions,
	branchContext?: BranchedContext,
): Promise<AgentResult> {
	const prompt =
		agent.contextMode === "branched" && branchContext
			? buildBranchedContext(task, branchContext)
			: buildFreshContext(task);
	const fallbackCandidates = buildFallbackCandidates(agent);

	for (let i = 0; i < fallbackCandidates.length; i++) {
		const candidate = fallbackCandidates[i];
		const startTime = Date.now();
		const progress = createInitialProgress(agent.id, agent.name, task);
		progress.currentToolArgs = `${candidate.provider ?? "default"}/${candidate.model}`;

		const args: string[] = ["--print"];
		args.push("--model", candidate.provider ? `${candidate.provider}/${candidate.model}` : candidate.model);
		if (candidate.thinking) args.push("--thinking", candidate.thinking);
		if (agent.tools && agent.tools.length > 0) args.push("--tools", agent.tools.join(","));
		if (agent.extensions && agent.extensions.length > 0) {
			for (const ext of agent.extensions) args.push("--extension", ext);
		} else {
			args.push("--no-extensions");
		}

		const env: Record<string, string | undefined> = {
			...process.env,
			...options.env,
			PI_OFFLINE: "1",
			PI_SUBAGENT_DEPTH: String(Number(process.env.PI_SUBAGENT_DEPTH ?? "0") + 1),
			PI_SUBAGENT_MAX_DEPTH: process.env.PI_SUBAGENT_MAX_DEPTH ?? "2",
		};

		let promptFile: string | undefined;
		if (agent.systemPrompt?.trim()) {
			const tmpDir = path.join(os.tmpdir(), "pi-the-office");
			if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
			promptFile = path.join(tmpDir, `prompt-${agent.id}-${Date.now()}.md`);
			fs.writeFileSync(promptFile, agent.systemPrompt, "utf-8");
			args.push("--system-prompt", promptFile);
		}

		const result = await new Promise<AgentResult>((resolve) => {
			let stdout = "";
			let stderr = "";
			let timeoutId: ReturnType<typeof setTimeout> | null = null;
			let killed = false;

			const child = childProcess.spawn("pi", [...args, prompt], {
				cwd: options.cwd,
				env,
				stdio: ["ignore", "pipe", "pipe"],
			});

			const timeout = options.timeout ?? 600000;
			timeoutId = setTimeout(() => {
				killed = true;
				child.kill("SIGTERM");
				const durationMs = Date.now() - startTime;
				options.onProgress?.({ ...progress, status: "failed", error: "Timeout exceeded", durationMs });
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

			if (options.signal) {
				options.signal.addEventListener(
					"abort",
					() => {
						if (timeoutId) clearTimeout(timeoutId);
						killed = true;
						child.kill("SIGTERM");
					},
					{ once: true },
				);
			}

			child.stdout?.on("data", (data: Buffer) => {
				stdout += data.toString();
				progress.durationMs = Date.now() - startTime;
				parseProgressFromOutput(stdout, progress);
				options.onProgress?.(progress);
			});

			child.stderr?.on("data", (data: Buffer) => {
				stderr += data.toString();
			});

			child.on("close", (code) => {
				if (timeoutId) clearTimeout(timeoutId);
				if (promptFile && fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
				if (killed) return;
				const durationMs = Date.now() - startTime;
				const truncation = truncateOutput(stdout);
				const agentName =
					fallbackCandidates.length > 1
						? `${agent.name} [${candidate.provider ?? "default"}/${candidate.model}]`
						: agent.name;
				const runResult: AgentResult = {
					agentId: agent.id,
					agentName,
					task,
					exitCode: code ?? 1,
					output: truncation.text,
					truncated: truncation.truncated,
					durationMs,
					usage: parseUsage(stdout),
				};
				if ((code ?? 1) !== 0) runResult.error = stderr || `Process exited with code ${code}`;
				options.onProgress?.({
					...progress,
					status: (code ?? 1) === 0 ? "completed" : "failed",
					error: runResult.error,
					durationMs,
				});
				resolve(runResult);
			});

			child.on("error", (err) => {
				if (timeoutId) clearTimeout(timeoutId);
				if (promptFile && fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
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

		if (result.exitCode === 0) return result;
		if (i < fallbackCandidates.length - 1 && isQuotaLikeError(result.error ?? "", result.output)) {
			continue;
		}
		return result;
	}

	return {
		agentId: agent.id,
		agentName: agent.name,
		task,
		exitCode: 1,
		output: "",
		truncated: false,
		durationMs: 0,
		usage: parseUsage(""),
		error: "No fallback candidates available",
	};
}

const DEFAULT_MAX_DEPTH = 2;

export function checkSubagentDepth(): { blocked: boolean; depth: number; maxDepth: number } {
	const depth = Number(process.env.PI_SUBAGENT_DEPTH ?? "0");
	const maxDepth = Number(process.env.PI_SUBAGENT_MAX_DEPTH ?? String(DEFAULT_MAX_DEPTH));
	const blocked = Number.isFinite(depth) && Number.isFinite(maxDepth) && depth >= maxDepth;
	return { blocked, depth, maxDepth };
}
