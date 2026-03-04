/**
 * Monitor Widget - pinnable TUI component showing office structure and runtime status.
 */

import { truncateToWidth } from "@mariozechner/pi-tui";
import type { AgentProgress, OfficeConfig, OfficeTeam } from "../core/types.js";

export interface AgentCard {
	agentId: string;
	agentName: string;
	status: "idle" | "running" | "completed" | "failed";
	task: string;
	currentTool?: string;
	tokens: number;
	durationMs: number;
	progress?: AgentProgress;
	updatedAt: string;
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
	office?: OfficeConfig;
	plannedSessions: Record<string, string[]>;
}

const STATUS_ICON: Record<AgentCard["status"], string> = {
	idle: "◇",
	running: "◆",
	completed: "✓",
	failed: "✗",
};

function normalizeName(name: string): string {
	return name.toLowerCase().trim();
}

function cardBelongsToRole(card: AgentCard, roleId: string, roleName: string): boolean {
	const roleIdNorm = normalizeName(roleId);
	const roleNameNorm = normalizeName(roleName);
	const cardIdNorm = normalizeName(card.agentId);
	const cardNameNorm = normalizeName(card.agentName.replace(/\s*\[[^\]]+\]\s*$/, ""));
	return cardIdNorm === roleIdNorm || cardNameNorm === roleNameNorm || cardIdNorm.includes(roleIdNorm);
}

function statusPriority(status: AgentCard["status"]): number {
	switch (status) {
		case "running":
			return 4;
		case "failed":
			return 3;
		case "completed":
			return 2;
		default:
			return 1;
	}
}

function mergeStatus(cards: AgentCard[]): AgentCard["status"] {
	let merged: AgentCard["status"] = "idle";
	for (const card of cards) {
		if (statusPriority(card.status) > statusPriority(merged)) {
			merged = card.status;
		}
	}
	return merged;
}

function sortByUpdated(cards: AgentCard[]): AgentCard[] {
	return [...cards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

interface RoleSnapshot {
	status: AgentCard["status"];
	activeInstances: number;
	currentSession?: string;
	lastSession?: string;
}

function getRoleSnapshot(
	state: MonitorWidgetState,
	roleId: string,
	roleName: string,
	fallbackSession?: string,
): RoleSnapshot {
	const matchingCards = state.cards.filter((card) => cardBelongsToRole(card, roleId, roleName));
	const sortedCards = sortByUpdated(matchingCards);
	const runningCards = sortedCards.filter((card) => card.status === "running");
	const latestFinishedCard = sortedCards.find((card) => card.status === "completed" || card.status === "failed");

	return {
		status: matchingCards.length === 0 ? "idle" : mergeStatus(matchingCards),
		activeInstances: runningCards.length,
		currentSession: runningCards[0]?.task ?? fallbackSession,
		lastSession: latestFinishedCard?.task,
	};
}

function renderTeamCard(cardWidth: number, state: MonitorWidgetState, team: OfficeTeam): string[] {
	const lines: string[] = [];
	const leadSession = state.plannedSessions[team.lead.role]?.[0];
	const leadSnapshot = getRoleSnapshot(state, team.lead.agentId, team.lead.name, leadSession);
	const specialists = team.members.filter((member) => member.id !== team.lead.agentId);

	const specialistSnapshots = specialists.map((specialist) => {
		const plannedSession = state.plannedSessions[specialist.role]?.[0];
		return getRoleSnapshot(state, specialist.id, specialist.name, plannedSession);
	});

	const activeSpecialists = specialistSnapshots.reduce((sum, snapshot) => sum + snapshot.activeInstances, 0);
	const specialistFailures = specialistSnapshots.filter((snapshot) => snapshot.status === "failed").length;
	const topBorderFill = "─".repeat(Math.max(0, cardWidth - team.name.length - 5));
	const cardTop = truncateToWidth(`╭ ${team.name} ${topBorderFill}`, cardWidth);
	const leadLine = truncateToWidth(`│ ${STATUS_ICON[leadSnapshot.status]} lead:${team.lead.role}`, cardWidth);
	const specialistLine = truncateToWidth(
		`│ specialists:${specialists.length} active:${activeSpecialists} fail:${specialistFailures}`,
		cardWidth,
	);
	const sessionSummary = leadSnapshot.currentSession ?? leadSnapshot.lastSession ?? "-";
	const sessionLine = truncateToWidth(`│ session:${sessionSummary}`, cardWidth);
	const cardBottom = truncateToWidth(`╰${"─".repeat(Math.max(0, cardWidth - 1))}`, cardWidth);

	lines.push(cardTop, leadLine, specialistLine, sessionLine, cardBottom);
	return lines;
}

function combineCardRows(
	width: number,
	left: string[],
	right: string[] | undefined,
	leftWidth: number,
	rightWidth: number,
): string[] {
	const rows: string[] = [];
	const rowCount = Math.max(left.length, right?.length ?? 0);
	for (let i = 0; i < rowCount; i++) {
		const leftRow = truncateToWidth((left[i] ?? "").padEnd(leftWidth, " "), leftWidth);
		if (!right) {
			rows.push(truncateToWidth(leftRow, width));
			continue;
		}
		const rightRow = truncateToWidth(right[i] ?? "", rightWidth);
		rows.push(truncateToWidth(`${leftRow}  ${rightRow}`, width));
	}
	return rows;
}

export function renderOfficeMonitor(width: number, state: MonitorWidgetState): string[] {
	const lines: string[] = [];
	const office = state.office;
	const running = state.runningCount;
	const completed = state.completedCount;
	const failed = state.failedCount;
	const headerStats = `${running} running · ${completed} done · ${failed} failed`;
	lines.push(truncateToWidth(`The Office Monitor (${headerStats})`, width));

	if (!office || office.teams.length === 0) {
		lines.push(truncateToWidth("No teams configured. Use /office-dashboard.", width));
		lines.push(truncateToWidth("/office to unpin", width));
		return lines;
	}

	lines.push(truncateToWidth(`Manager: ${office.officeManager.name} · Teams: ${office.teams.length}`, width));
	const useTwoColumns = width >= 120;
	if (!useTwoColumns) {
		const cardWidth = Math.max(30, width - 1);
		for (const team of office.teams) {
			lines.push(...renderTeamCard(cardWidth, state, team));
		}
	} else {
		const leftWidth = Math.max(30, Math.floor((width - 2) / 2));
		const rightWidth = Math.max(30, width - leftWidth - 2);
		for (let i = 0; i < office.teams.length; i += 2) {
			const leftCard = renderTeamCard(leftWidth, state, office.teams[i]!);
			const rightCard = office.teams[i + 1] ? renderTeamCard(rightWidth, state, office.teams[i + 1]!) : undefined;
			lines.push(...combineCardRows(width, leftCard, rightCard, leftWidth, rightWidth));
		}
	}
	lines.push(truncateToWidth("/office to unpin", width));
	return lines;
}

export function createMonitorWidget(): { state: MonitorWidgetState } {
	const state: MonitorWidgetState = {
		cards: [],
		pinned: false,
		selectedIndex: 0,
		totalTokens: 0,
		totalDurationMs: 0,
		runningCount: 0,
		completedCount: 0,
		failedCount: 0,
		office: undefined,
		plannedSessions: {},
	};

	return { state };
}

export function setWidgetOffice(state: MonitorWidgetState, office: OfficeConfig): void {
	state.office = office;
}

export function notePlannedSession(state: MonitorWidgetState, role: string, sessionName: string): void {
	const existing = state.plannedSessions[role] ?? [];
	if (!existing.includes(sessionName)) {
		state.plannedSessions[role] = [...existing, sessionName].slice(-8);
	}
}

export function updateWidgetFromProgress(state: MonitorWidgetState, progress: AgentProgress): void {
	const existingIndex = state.cards.findIndex(
		(card) => card.agentId === progress.agentId && card.task === progress.task && card.status === "running",
	);

	const card: AgentCard = {
		agentId: progress.agentId,
		agentName: progress.agentName,
		status: progress.status === "pending" ? "idle" : progress.status,
		task: progress.task,
		currentTool: progress.currentTool,
		tokens: progress.tokens,
		durationMs: progress.durationMs,
		progress,
		updatedAt: new Date().toISOString(),
	};

	if (existingIndex >= 0) {
		state.cards[existingIndex] = card;
	} else {
		state.cards.push(card);
	}

	state.cards = sortByUpdated(state.cards).slice(0, 200);
	recalculateTotals(state);
}

export function recalculateTotals(state: MonitorWidgetState): void {
	state.totalTokens = state.cards.reduce((sum, card) => sum + card.tokens, 0);
	state.runningCount = state.cards.filter((card) => card.status === "running").length;
	state.completedCount = state.cards.filter((card) => card.status === "completed").length;
	state.failedCount = state.cards.filter((card) => card.status === "failed").length;
}
