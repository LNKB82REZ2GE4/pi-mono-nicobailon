/**
 * Context generation for branched/spawn modes.
 */

import { exec } from "node:child_process";
import type { BranchedContext } from "../types.js";

export interface ContextOptions {
	cwd: string;
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

function execText(command: string, cwd: string): Promise<string | undefined> {
	return new Promise((resolve) => {
		exec(command, { cwd }, (error, stdout) => {
			if (error) {
				resolve(undefined);
				return;
			}
			const value = stdout.trim();
			resolve(value.length > 0 ? value : undefined);
		});
	});
}

async function getGitBranch(cwd: string): Promise<string | undefined> {
	return execText("git branch --show-current", cwd);
}

async function getGitStatus(cwd: string): Promise<string | undefined> {
	return execText("git status --short", cwd);
}

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

		const readMatch = content.match(/read\s+["']?([^"'\s]+)["']?/gi);
		if (readMatch) {
			filesRead.push(...readMatch.map((m) => m.replace(/read\s+["']?/i, "")));
		}

		const editMatch = content.match(/edit\s+["']?([^"'\s]+)["']?/gi);
		if (editMatch) {
			filesEdited.push(...editMatch.map((m) => m.replace(/edit\s+["']?/i, "")));
		}

		const writeMatch = content.match(/write\s+["']?([^"'\s]+)["']?/gi);
		if (writeMatch) {
			filesWritten.push(...writeMatch.map((m) => m.replace(/write\s+["']?/i, "")));
		}

		const decisionMatch = content.match(/(?:decision|decided|chose):\s*(.+)/gi);
		if (decisionMatch) {
			decisions.push(...decisionMatch.map((m) => m.replace(/(?:decision|decided|chose):\s*/i, "")));
		}

		const questionMatch = content.match(/\?[^?]*$/gm);
		if (questionMatch) {
			openQuestions.push(...questionMatch.map((q) => q.trim()));
		}

		if (entry.message.role === "assistant") {
			const summary = content.slice(0, 200);
			if (summary.length > 0) conversationParts.push(summary);
		}
	}

	const fileParts: string[] = [];
	if (filesRead.length > 0) fileParts.push(`Read: ${[...new Set(filesRead)].slice(0, 10).join(", ")}`);
	if (filesEdited.length > 0) fileParts.push(`Edited: ${[...new Set(filesEdited)].slice(0, 10).join(", ")}`);
	if (filesWritten.length > 0) fileParts.push(`Written: ${[...new Set(filesWritten)].slice(0, 10).join(", ")}`);

	return {
		fileSummary: fileParts.join("\n"),
		decisions: decisions.slice(0, 5),
		openQuestions: openQuestions.slice(0, 5),
		conversationSummary: conversationParts.slice(-5).join("\n---\n"),
	};
}

export async function buildBranchedContext(options: ContextOptions): Promise<BranchedContext> {
	const context: BranchedContext = {};
	context.gitBranch = await getGitBranch(options.cwd);
	context.gitStatus = await getGitStatus(options.cwd);

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

export function formatContextForPrompt(context: BranchedContext): string {
	const parts: string[] = [];
	if (context.gitBranch) parts.push(`Current branch: ${context.gitBranch}`);
	if (context.gitStatus) parts.push(`Git status:\n${context.gitStatus}`);
	if (context.fileSummary) parts.push(`Recent file activity:\n${context.fileSummary}`);
	if (context.decisions && context.decisions.length > 0)
		parts.push(`Key decisions:\n${context.decisions.map((d: string) => `- ${d}`).join("\n")}`);
	if (context.openQuestions && context.openQuestions.length > 0)
		parts.push(`Open questions:\n${context.openQuestions.map((q: string) => `- ${q}`).join("\n")}`);
	if (context.conversationSummary) parts.push(`Recent context:\n${context.conversationSummary}`);
	return parts.join("\n\n");
}
