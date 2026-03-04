/**
 * Context generation for branched/spawn modes.
 */

import type { BranchedContext } from "../types.js";

// =============================================================================
// Context Options
// =============================================================================

export interface ContextOptions {
	/** Current working directory */
	cwd: string;
	/** Session manager access */
	sessionManager?: {
		getEntries(): Array<{
			type: string;
			message?: {
				role: string;
				content?: string | Array<{ type: string; text?: string }>;
			};
		}>;
	};
}

// =============================================================================
// Git Context Extraction
// =============================================================================

async function getGitBranch(cwd: string): Promise<string | undefined> {
	try {
		const { exec } = await import("node:child_process");
		return new Promise((resolve) => {
			exec("git branch --show-current", { cwd }, (error, stdout) => {
				if (error) resolve(undefined);
				else resolve(stdout.trim() || undefined);
			});
		});
	} catch {
		return undefined;
	}
}

async function getGitStatus(cwd: string): Promise<string | undefined> {
	try {
		const { exec } = await import("node:child_process");
		return new Promise((resolve) => {
			exec("git status --short", { cwd }, (error, stdout) => {
				if (error) resolve(undefined);
				else {
					const status = stdout.trim();
					resolve(status.length > 0 ? status : undefined);
				}
			});
		});
	} catch {
		return undefined;
	}
}

// =============================================================================
// Session Summary Extraction
// =============================================================================

function extractSessionSummary(
	entries: Array<{
		type: string;
		message?: {
			role: string;
			content?: string | Array<{ type: string; text?: string }>;
		};
	}>,
): {
	fileSummary: string;
	decisions: string[];
	openQuestions: string[];
	conversationSummary: string;
} {
	const filesRead: string[] = [];
	const filesEdited: string[] = [];
	const filesWritten: string[] = [];
	const decisions: string[] = [];
	const openQuestions: string[] = [];
	const conversationParts: string[] = [];

	for (const entry of entries) {
		if (entry.type !== "message" || !entry.message) continue;

		const content =
			typeof entry.message.content === "string"
				? entry.message.content
				: (entry.message.content
						?.filter((c) => c.type === "text")
						.map((c) => c.text ?? "")
						.join("\n") ?? "");

		// Extract file operations
		const readMatch = content.match(/read\s+["']?([^"'\s]+)["']?/gi);
		if (readMatch) {
			filesRead.push(...readMatch.map((m) => m.replace(/read\s+["']?/i, "")));
		}

		// Extract decisions (look for patterns like "decision:", "decided:", "chose:")
		const decisionMatch = content.match(/(?:decision|decided|chose):\s*(.+)/gi);
		if (decisionMatch) {
			decisions.push(...decisionMatch.map((m) => m.replace(/(?:decision|decided|chose):\s*/i, "")));
		}

		// Extract open questions
		const questionMatch = content.match(/\?[^?]*$/gm);
		if (questionMatch) {
			openQuestions.push(...questionMatch.map((q) => q.trim()));
		}

		// Build conversation summary (assistant messages only)
		if (entry.message.role === "assistant") {
			const summary = content.slice(0, 200);
			if (summary.length > 0) {
				conversationParts.push(summary);
			}
		}
	}

	// Build file summary
	const fileParts: string[] = [];
	if (filesRead.length > 0) {
		const unique = [...new Set(filesRead)].slice(0, 10);
		fileParts.push(`Read: ${unique.join(", ")}`);
	}
	if (filesEdited.length > 0) {
		const unique = [...new Set(filesEdited)].slice(0, 10);
		fileParts.push(`Edited: ${unique.join(", ")}`);
	}
	if (filesWritten.length > 0) {
		const unique = [...new Set(filesWritten)].slice(0, 10);
		fileParts.push(`Written: ${unique.join(", ")}`);
	}

	return {
		fileSummary: fileParts.join("\n"),
		decisions: decisions.slice(0, 5),
		openQuestions: openQuestions.slice(0, 5),
		conversationSummary: conversationParts.slice(-5).join("\n---\n"),
	};
}

// =============================================================================
// Build Branched Context
// =============================================================================

/**
 * Build a branched context from the current session state.
 * This provides a summary snapshot for subagents to "hit the ground running".
 */
export async function buildBranchedContext(options: ContextOptions): Promise<BranchedContext> {
	const context: BranchedContext = {};

	// Get git context
	context.gitBranch = await getGitBranch(options.cwd);
	context.gitStatus = await getGitStatus(options.cwd);

	// Get session summary
	if (options.sessionManager) {
		const entries = options.sessionManager.getEntries();
		const summary = extractSessionSummary(entries);

		context.fileSummary = summary.fileSummary;
		context.decisions = summary.decisions;
		context.openQuestions = summary.openQuestions;
		context.conversationSummary = summary.conversationSummary;
	}

	return context;
}

// =============================================================================
// Format Context for Prompt
// =============================================================================

export function formatContextForPrompt(context: BranchedContext): string {
	const parts: string[] = [];

	if (context.gitBranch) {
		parts.push(`Current branch: ${context.gitBranch}`);
	}

	if (context.gitStatus) {
		parts.push(`Git status:\n${context.gitStatus}`);
	}

	if (context.fileSummary) {
		parts.push(`Recent file activity:\n${context.fileSummary}`);
	}

	if (context.decisions && context.decisions.length > 0) {
		parts.push(`Key decisions:\n${context.decisions.map((d: string) => `- ${d}`).join("\n")}`);
	}

	if (context.openQuestions && context.openQuestions.length > 0) {
		parts.push(`Open questions:\n${context.openQuestions.map((q: string) => `- ${q}`).join("\n")}`);
	}

	if (context.conversationSummary) {
		parts.push(`Recent context:\n${context.conversationSummary}`);
	}

	return parts.join("\n\n");
}
