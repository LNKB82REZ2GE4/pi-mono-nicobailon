/**
 * Monitor Widget - pinnable TUI component showing agent status.
 */

import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import type { AgentProgress } from "../core/types.js";

// =============================================================================
// Widget State
// =============================================================================

export interface AgentCard {
	agentId: string;
	agentName: string;
	status: "idle" | "running" | "completed" | "failed";
	task: string;
	currentTool?: string;
	tokens: number;
	durationMs: number;
	progress?: AgentProgress;
}

export interface MonitorWidgetState {
	cards: AgentCard[];
	pinned: boolean;
	selectedIndex: number;
	totalTokens: number;
	totalDurationMs: number;
	runningCount: number;
	completedCount: number;
	failedCount: number;
}

// =============================================================================
// Status Icons & Colors
// =============================================================================

const STATUS_ICON: Record<string, string> = {
	idle: "◇",
	running: "◆",
	completed: "✓",
	failed: "✗",
};

const STATUS_COLOR: Record<string, "dim" | "success" | "warning" | "error"> = {
	idle: "dim",
	running: "success",
	completed: "success",
	failed: "error",
};

// =============================================================================
// Formatting Utilities
// =============================================================================

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	return `${(ms / 60000).toFixed(1)}m`;
}

function formatTokens(tokens: number): string {
	if (tokens < 1000) return String(tokens);
	if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
	return `${(tokens / 1000000).toFixed(1)}M`;
}

function padRight(text: string, width: number): string {
	const visible = visibleWidth(text);
	if (visible >= width) return text;
	return text + " ".repeat(width - visible);
}

// =============================================================================
// Monitor Widget Component
// =============================================================================

export class MonitorWidget implements Component {
	private state: MonitorWidgetState;
	private expanded: boolean = false;

	constructor(state: MonitorWidgetState) {
		this.state = state;
	}

	updateState(state: Partial<MonitorWidgetState>): void {
		this.state = { ...this.state, ...state };
	}

	toggleExpanded(): void {
		this.expanded = !this.expanded;
	}

	isExpanded(): boolean {
		return this.expanded;
	}

	render(width: number): string[] {
		const lines: string[] = [];
		const { cards, pinned, selectedIndex, totalTokens, runningCount, completedCount, failedCount } = this.state;

		// Header line
		const header = this.renderHeader(width, pinned, runningCount, completedCount, failedCount);
		lines.push(header);

		// Agent cards
		if (cards.length === 0) {
			lines.push(truncateToWidth(`  ${this.themeDim("(no active agents)")}`, width));
		} else {
			for (let i = 0; i < cards.length; i++) {
				const card = cards[i];
				const isSelected = i === selectedIndex && this.expanded;
				const cardLine = this.renderCard(card, width, isSelected);
				lines.push(...cardLine);
			}
		}

		// Total line
		if (cards.length > 1) {
			const totalLines = this.renderTotal(width, totalTokens);
			lines.push(...totalLines);
		}

		// Hints line
		const hints = this.renderHints(width);
		lines.push(hints);

		return lines;
	}

	private renderHeader(width: number, pinned: boolean, running: number, completed: number, failed: number): string {
		const pinIcon = pinned ? "📌 " : "";
		let header = ` ${pinIcon}${this.themeBold(this.themeAccent("Teams"))}`;

		const stats: string[] = [];
		if (running > 0) stats.push(`${running} running`);
		if (completed > 0) stats.push(`${completed} done`);
		if (failed > 0) stats.push(`${failed} failed`);

		if (stats.length > 0) {
			header += ` ${this.themeDim(`(${stats.join(" · ")})`)}`;
		}

		return truncateToWidth(header, width);
	}

	private renderCard(card: AgentCard, width: number, isSelected: boolean): string[] {
		const lines: string[] = [];
		const icon = STATUS_ICON[card.status];
		const iconColor = STATUS_COLOR[card.status];

		// Card line
		const selector = isSelected ? ">" : " ";
		const styledIcon = this.themeColor(iconColor, icon);
		const name = this.themeBold(card.agentName);
		const statusLabel = this.themeColor(iconColor, card.status.padEnd(8));
		const task = truncateToWidth(card.task, width - 35);
		const tokens = this.themeDim(`${formatTokens(card.tokens)} tok`);
		const duration = this.themeDim(formatDuration(card.durationMs));

		const line = `${selector} ${styledIcon} ${padRight(name, 12)} ${statusLabel} ${task} ${tokens} ${duration}`;
		lines.push(truncateToWidth(line, width));

		// Current tool (if running)
		if (card.status === "running" && card.currentTool) {
			const toolLine = `      ${this.themeDim(`↳ ${card.currentTool}`)}`;
			lines.push(truncateToWidth(toolLine, width));
		}

		// Expanded details
		if (isSelected && card.progress) {
			const details = this.renderExpandedDetails(card.progress, width);
			lines.push(...details);
		}

		return lines;
	}

	private renderExpandedDetails(progress: AgentProgress, width: number): string[] {
		const lines: string[] = [];

		// Recent tools
		if (progress.recentTools.length > 0) {
			lines.push(this.themeDim("    Recent tools:"));
			for (const tool of progress.recentTools.slice(-3)) {
				const toolLine = `      ${this.themeDim("-")} ${tool.tool}`;
				lines.push(truncateToWidth(toolLine, width));
			}
		}

		// Recent output
		if (progress.recentOutput.length > 0) {
			lines.push(this.themeDim("    Recent output:"));
			for (const output of progress.recentOutput.slice(-2)) {
				const outputLine = `      ${this.themeDim(output.slice(0, width - 8))}`;
				lines.push(truncateToWidth(outputLine, width));
			}
		}

		return lines;
	}

	private renderTotal(width: number, totalTokens: number): string[] {
		const separator = this.themeDim("─".repeat(Math.max(0, width - 2)));
		const total = `${this.themeBold("Total")} ${this.themeSuccess(formatTokens(totalTokens))} tokens`;
		return [separator, `  ${total}`];
	}

	private renderHints(width: number): string {
		const hints = [this.themeDim("[Enter] expand"), this.themeDim("[p] pin"), this.themeDim("[q] close")];
		return truncateToWidth(`  ${hints.join("  ")}`, width);
	}

	// Theme helpers (these will be replaced with actual theme when rendering)
	private themeBold(text: string): string {
		return `\x1b[1m${text}\x1b[22m`;
	}

	private themeDim(text: string): string {
		return `\x1b[2m${text}\x1b[22m`;
	}

	private themeAccent(text: string): string {
		return `\x1b[36m${text}\x1b[39m`; // cyan
	}

	private themeSuccess(text: string): string {
		return `\x1b[32m${text}\x1b[39m`;
	}

	private themeWarning(text: string): string {
		return `\x1b[33m${text}\x1b[39m`;
	}

	private themeError(text: string): string {
		return `\x1b[31m${text}\x1b[39m`;
	}

	private themeColor(color: string, text: string): string {
		switch (color) {
			case "success":
				return this.themeSuccess(text);
			case "warning":
				return this.themeWarning(text);
			case "error":
				return this.themeError(text);
			default:
				return this.themeDim(text);
		}
	}

	invalidate(): void {
		// Clear any cached state
	}
}

// =============================================================================
// Widget Factory
// =============================================================================

export function createMonitorWidget(): { widget: MonitorWidget; state: MonitorWidgetState } {
	const state: MonitorWidgetState = {
		cards: [],
		pinned: false,
		selectedIndex: 0,
		totalTokens: 0,
		totalDurationMs: 0,
		runningCount: 0,
		completedCount: 0,
		failedCount: 0,
	};

	const widget = new MonitorWidget(state);

	return { widget, state };
}

// =============================================================================
// State Update Helpers
// =============================================================================

export function updateWidgetFromProgress(state: MonitorWidgetState, progress: AgentProgress): void {
	const existingIndex = state.cards.findIndex((c) => c.agentId === progress.agentId);

	const card: AgentCard = {
		agentId: progress.agentId,
		agentName: progress.agentName,
		status: progress.status === "pending" ? "idle" : progress.status,
		task: progress.task,
		currentTool: progress.currentTool,
		tokens: progress.tokens,
		durationMs: progress.durationMs,
		progress,
	};

	if (existingIndex >= 0) {
		state.cards[existingIndex] = card;
	} else {
		state.cards.push(card);
	}

	// Update totals
	recalculateTotals(state);
}

export function recalculateTotals(state: MonitorWidgetState): void {
	state.totalTokens = state.cards.reduce((sum, c) => sum + c.tokens, 0);
	state.runningCount = state.cards.filter((c) => c.status === "running").length;
	state.completedCount = state.cards.filter((c) => c.status === "completed").length;
	state.failedCount = state.cards.filter((c) => c.status === "failed").length;
}
