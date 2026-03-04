/**
 * Pi Orchestration Extension
 *
 * Provides multi-agent orchestration capabilities:
 * - Chain execution (sequential A→B→C)
 * - Parallel execution (concurrent independent tasks)
 * - Team execution (persistent specialists with DAG-based task scheduling)
 * - Monitor widget for visibility into agent activity
 *
 * Configuration (settings.json under "orchestration"):
 * {
 *   "orchestration": {
 *     "maxConcurrent": 4,
 *     "defaultTimeout": 600000,
 *     "widgetPinned": false
 *   }
 * }
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { checkSubagentDepth } from "./core/spawn/subprocess.js";
import { teamStore } from "./persistence/store.js";
import {
	executeOrchestration,
	formatOrchestrateResult,
	type OrchestrateParams,
	OrchestrateParamsSchema,
} from "./tools/orchestrate.js";
import { createMonitorWidget, type MonitorWidgetState, updateWidgetFromProgress } from "./tui/monitor-widget.js";

// =============================================================================
// Settings
// =============================================================================

interface OrchestrationSettings {
	maxConcurrent: number;
	defaultTimeout: number;
	widgetPinned: boolean;
}

const DEFAULT_SETTINGS: OrchestrationSettings = {
	maxConcurrent: 4,
	defaultTimeout: 600000,
	widgetPinned: false,
};

function resolveSettings(pi: ExtensionAPI): OrchestrationSettings {
	// Try to get settings from pi's settings manager
	try {
		const getSettings = (pi as unknown as { getSettings?: () => { orchestration?: Partial<OrchestrationSettings> } })
			.getSettings;
		if (getSettings) {
			const settings = getSettings();
			if (settings?.orchestration) {
				return { ...DEFAULT_SETTINGS, ...settings.orchestration };
			}
		}
	} catch {
		// Ignore if settings not available
	}
	return DEFAULT_SETTINGS;
}

// =============================================================================
// Widget State
// =============================================================================

let widgetState: MonitorWidgetState | null = null;
const widgetKey = "orchestration";

// =============================================================================
// Extension Entry Point
// =============================================================================

export default function (pi: ExtensionAPI) {
	// Resolve settings (used for timeout, concurrency, etc.)
	resolveSettings(pi);

	// Check recursion depth
	const depthCheck = checkSubagentDepth();
	if (depthCheck.blocked) {
		// Don't register tools if we're too deep in the recursion
		return;
	}

	// ==========================================================================
	// Register Tool
	// ==========================================================================

	pi.registerTool({
		name: "orchestrate",
		label: "Orchestrate Agents",
		description: `Execute multi-agent coordination.

Modes:
- chain: Sequential A→B→C where each step gets {previous} output
- parallel: Run independent tasks concurrently
- team: Persistent specialists with DAG-based task scheduling

Examples:
Chain: { mode: "chain", chain: [{ agent: "scout", task: "Map auth" }, { agent: "planner", task: "Plan based on: {previous}" }] }
Parallel: { mode: "parallel", tasks: [{ agent: "scout", task: "Scan API" }, { agent: "scout", task: "Scan DB" }] }
Team: { mode: "team", team: { tasks: [{ title: "Implement", assignee: "worker" }, { title: "Test", assignee: "tester", dependsOn: ["Implement"] }] } }`,
		parameters: OrchestrateParamsSchema,

		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			// Initialize widget state if needed
			if (!widgetState) {
				const { state } = createMonitorWidget();
				widgetState = state;
			}

			// Execute orchestration
			const result = await executeOrchestration(params as OrchestrateParams, {
				cwd: ctx.cwd,
				signal,
				sessionManager: ctx.sessionManager,
				onProgress: (progress) => {
					// Update widget
					updateWidgetFromProgress(widgetState!, progress);

					// Update TUI widget
					ctx.ui.setWidget(widgetKey, (_tui, _theme) => ({
						render: (_width: number) => {
							// Apply theme colors
							const lines: string[] = [];
							// Simple themed render
							for (const card of widgetState!.cards) {
								const icon = card.status === "running" ? "◆" : card.status === "completed" ? "✓" : "◇";
								const line = ` ${icon} ${card.agentName}: ${card.task.slice(0, 40)}...`;
								lines.push(line);
							}
							return lines;
						},
						invalidate: () => {},
					}));
				},
			});

			// Format result
			const formattedResult = formatOrchestrateResult(result);

			return {
				content: [{ type: "text", text: formattedResult }],
				details: { result },
			};
		},
	});

	// ==========================================================================
	// Register Commands
	// ==========================================================================

	// /teams - Toggle monitor widget
	pi.registerCommand("teams", {
		description: "Toggle the teams monitor widget",
		handler: async (_args, ctx) => {
			if (!widgetState) {
				const { state } = createMonitorWidget();
				widgetState = state;
			}

			widgetState.pinned = !widgetState.pinned;

			if (widgetState.pinned) {
				ctx.ui.setWidget(widgetKey, (_tui, theme) => ({
					render: (_width: number) => {
						const lines: string[] = [theme.fg("accent", "Teams Monitor (pinned)")];
						if (widgetState!.cards.length === 0) {
							lines.push(theme.fg("dim", "  No active agents"));
						} else {
							for (const card of widgetState!.cards) {
								const icon = card.status === "running" ? "◆" : "◇";
								lines.push(`  ${icon} ${card.agentName}: ${card.task.slice(0, 50)}`);
							}
						}
						lines.push(theme.fg("dim", "  /teams to unpin"));
						return lines;
					},
					invalidate: () => {},
				}));
				ctx.ui.notify("Teams monitor pinned", "info");
			} else {
				ctx.ui.setWidget(widgetKey, []);
				ctx.ui.notify("Teams monitor unpinned", "info");
			}
		},
	});

	// /teams-create - Create a new team
	pi.registerCommand("teams-create", {
		description: "Create a new specialist team",
		handler: async (_args, ctx) => {
			// TODO: Open interactive team builder
			ctx.ui.notify("Team builder coming soon! Use the orchestrate tool for now.", "info");
		},
	});

	// /teams-list - List saved teams
	pi.registerCommand("teams-list", {
		description: "List saved teams",
		handler: async (_args, ctx) => {
			const teams = await teamStore.list();
			if (teams.length === 0) {
				ctx.ui.notify("No saved teams", "info");
				return;
			}

			const lines = teams.map((t) => `${t.name} (${t.members.length} members)`);
			ctx.ui.notify(`Saved teams:\n${lines.join("\n")}`, "info");
		},
	});

	// ==========================================================================
	// System Prompt Injection
	// ==========================================================================

	pi.on("before_agent_start", async (event, _ctx) => {
		// Inject orchestration capabilities into system prompt
		const orchestrationPrompt = `

---
## Multi-Agent Orchestration

You can coordinate multiple AI agents for complex tasks using the \`orchestrate\` tool.

### Modes

**Chain** - Sequential pipeline:
\`\`\`json
{ "mode": "chain", "chain": [
  { "agent": "scout", "task": "Map the auth module" },
  { "agent": "planner", "task": "Create plan based on: {previous}" },
  { "agent": "worker", "task": "Implement: {previous}" }
]}
\`\`\`

**Parallel** - Concurrent independent tasks:
\`\`\`json
{ "mode": "parallel", "tasks": [
  { "agent": "scout", "task": "Scan API routes" },
  { "agent": "scout", "task": "Scan database schema" }
], "concurrency": 4 }
\`\`\`

**Team** - Persistent specialists with dependencies:
\`\`\`json
{ "mode": "team", "team": {
  "members": [
    { "id": "architect", "name": "Architect", "role": "planner", "model": "claude-sonnet-4-5" },
    { "id": "builder", "name": "Builder", "role": "worker", "model": "claude-sonnet-4-5" }
  ],
  "tasks": [
    { "title": "Design", "assignee": "architect" },
    { "title": "Implement", "assignee": "builder", "dependsOn": ["Design"] }
  ]
}}
\`\`\`

### Agent Names
Common agent names: scout (fast recon), planner (analysis), worker (implementation), reviewer (code review), researcher (web search).

### Tips
- Use scout/haiku for fast reconnaissance
- Use planner/sonnet for analysis and planning
- Use worker/sonnet for implementation
- Use {previous} in chains to pass output between steps
- Dependencies in team mode create a DAG - independent tasks run in parallel
`;

		return {
			systemPrompt: event.systemPrompt + orchestrationPrompt,
		};
	});

	// ==========================================================================
	// Session Shutdown Cleanup
	// ==========================================================================

	pi.on("session_shutdown", async () => {
		// Clear widget
		widgetState = null;
	});
}

// =============================================================================
// Exports
// =============================================================================

export { executeOrchestration, formatOrchestrateResult, OrchestrateParamsSchema };
export type { OrchestrateParams };
export { teamStore } from "./persistence/store.js";
export type { AgentCard, MonitorWidgetState } from "./tui/monitor-widget.js";
export { createMonitorWidget, updateWidgetFromProgress } from "./tui/monitor-widget.js";
