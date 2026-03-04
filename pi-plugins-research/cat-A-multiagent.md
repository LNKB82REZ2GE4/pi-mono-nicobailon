# Pi Coding Agent Ecosystem Research
## Category: Multi-Agent / Orchestration

**Research Date:** 2026-02-26

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **pi-subagents** | Extension | Pi extension for delegating tasks to subagents with chains, parallel execution, TUI clarification, and async support | `/run`, `/chain`, `/parallel` commands; Agents Manager overlay (Ctrl+Shift+A); Chain files (.chain.md); Multi-select & parallel execution; Agent discovery from `~/.pi/agent/agents/*.md` and `.pi/agents/*.md`; Thinking level support; MCP tools via `mcp:` prefix; Extension sandboxing; Skill injection; Parallel-in-chain fan-out/fan-in; Async execution with status tracking | pi-mcp-adapter for MCP tools; Agent definitions as markdown files with YAML frontmatter | Most feature-rich subagent extension. Supports orchestrator patterns, pool-based persistent agents, and depth guards to prevent unbounded recursion |
| **pi-teams** | - | Not found on npm | - | - | No dedicated npm package found. Team functionality is built into Claude Code natively via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| **pi-mesh** | - | Not found on npm | - | - | No npm package found. Likely conceptual or planned feature |
| **pi-parallel-agents** | - | Not found on npm | - | - | No npm package found. Parallel execution is available via pi-subagents |
| **pi-threads** | - | Not found on npm | - | - | No npm package found |
| **pi-replicant** | - | Not found on npm | - | - | No npm package found |
| **pi-handoff** | Extension | Handoff command extension for pi - generates concise handoff notes and creates linked sessions | `/handoff <task>` command; Generates handoff note from current session context; Creates new session linked to current; Sends handoff context plus task into new session immediately | pi coding agent with extension loading enabled | By default-anton. Useful for task continuity across sessions. Apache-2.0 license |
| **pi-supervisor** | Extension | Supervises coding agent and steers toward defined outcomes (like a tech lead watching over a dev's shoulder) | `/supervise <goal>`, `/supervise stop`, `/supervise status`, `/supervise widget`, `/supervise model`, `/supervise sensitivity`; Runs in separate in-memory session; Doesn't modify main agent's context; Sensitivity levels (low/medium/high) | pi coding agent | By tintinweb. MIT license. Observes conversation turns and injects guiding messages when agent drifts |
| **pi-peon-ping** | Extension | Sound notifications for pi coding agent lifecycle events using OpenPeon sound packs | `/peon` settings panel; `/peon install` downloads 10 sound packs; Events: session start, task acknowledge, tool error, rapid prompts, task complete; Desktop notifications; Auto-detects SSH/devcontainers/Codespaces with relay support | pi>=0.50.0; Audio player (afplay/pw-play/paplay/ffplay/mpv/play/aplay); PowerShell MediaPlayer on WSL | By joshuadavidthomas. MIT license. Works with existing Claude Code peon-ping packs from `~/.claude/hooks/peon-ping/` |
| **@tmustier/pi-agent-teams** | Extension (experimental/MVP) | Brings Claude Code agent teams to Pi - spawn teammates, share task list, coordinate work across multiple sessions | TeamCreate/TaskCreate/TaskList/TaskUpdate for coordination; SendMessage for DM/broadcast; Shared task list with dependency tracking; Auto-claim for idle teammates; Direct messages/broadcast; Git worktrees support; Session branching; Built-in styles (normal, soviet, pirate) | pi coding agent; Config via `PI_TEAMS_STYLE` env var or `/team style` command | Teammates go idle after each turn; Messages auto-delivered; Config stored in `~/.claude/teams/{team-name}/` |
| **@baochunli/pi-collaborating-agents** | - | Not found on npm | - | - | Search returned no relevant results for pi ecosystem |
| **@mjakl/pi-subagent** | - | Not found on npm | - | - | Search returned no relevant results for pi ecosystem |
| **@vaayne/pi-subagent** | - | Not found on npm | - | - | Search returned no relevant results for pi ecosystem |
| **@hyperprior/pi-subagent** | - | Not found on npm | - | - | Search returned no relevant results for pi ecosystem |
| **@e9n/pi-subagent** | Extension | Parallel task delegation extension for pi - spawn isolated pi subprocesses for single, parallel, chain, orchestrator, and pool-based workflows | **Single**: `{ agent, task }`; **Parallel**: `{ tasks: [...] }`; **Chain**: `{ chain: [...] }` with `{previous}` variable; **Orchestrator**: hierarchical agent trees; **Pool**: `{ action: "spawn/send/list/kill", id, agent, task }` for persistent agents; Agent discovery; Extension isolation; System prompt injection; Bundled skill definitions | Configurable via `~/.pi/agent/settings.json`: maxConcurrent (4), maxTotal (8), timeoutMs (600000), model, extensions, blockedExtensions | MIT license. Blocks dangerous extensions by default (pi-webserver, pi-cron, pi-heartbeat, pi-channels, pi-web-dashboard, pi-telemetry). Events: subagent:start, subagent:complete |
| **@e9n/pi-channels** | Extension | Two-way channel extension for pi - route messages between agents and Telegram, Slack, webhooks, or custom adapters | **Telegram adapter**: bidirectional via Bot API, polling, voice transcription; **Slack adapter**: Socket Mode + Web API; **Webhook adapter**: outgoing HTTP POST; **Chat bridge**: incoming messages routed to agent, responses sent back; **Event API**: channel:send/receive/register; Custom adapters at runtime | Config via settings.json with `env:VAR_NAME` for secrets; Chat bridge modes: persistent (RPC with memory) or stateless | MIT license. 2 dependencies. `/chat-bridge` command for status/control. Supports typing indicators, idle timeouts, max queue per sender |
| **@zenobius/pi-worktrees** | - | Not found on npm | - | - | No dedicated npm package found. Git worktree support is built into @tmustier/pi-agent-teams |
| **compound-engineering-pi** | - | Not found on npm | - | - | This is a Claude Code plugin, not a pi package. See EveryInc/compound-engineering-plugin on GitHub. Philosophy: each unit of work should make subsequent units easier. Plan->Work->Assess->Codify workflow |

---

## Summary of Patterns

### Existing Packages (8 found)

1. **pi-subagents** - The most comprehensive subagent extension with chain/parallel execution, TUI management, MCP support, and async capabilities.

2. **@e9n/pi-subagent** - Alternative subagent implementation with orchestrator and pool modes for persistent agents.

3. **@e9n/pi-channels** - Communication bridge for connecting agents to external platforms (Telegram, Slack, webhooks).

4. **@tmustier/pi-agent-teams** - Full team coordination with shared task lists, messaging, and git worktree support.

5. **pi-handoff** - Simple session handoff for task continuity.

6. **pi-supervisor** - Oversight/guidance layer that steers agents toward goals.

7. **pi-peon-ping** - Audio feedback for agent lifecycle events.

### Key Observations

1. **Multiple Subagent Implementations**: There are at least two major subagent extensions (pi-subagents and @e9n/pi-subagent) with overlapping but different feature sets. pi-subagents appears more feature-complete with TUI management and chain files.

2. **Orchestration Patterns Vary**: The ecosystem supports multiple orchestration patterns:
   - Sequential chains (with `{previous}` variable for output passing)
   - Parallel execution (with concurrency limits)
   - Orchestrator/hierarchical (agents spawning agents)
   - Pool-based (persistent agents with follow-up messages)

3. **Communication Bridges**: @e9n/pi-channels provides external platform integration, essential for production deployments.

4. **Missing Packages**: Many packages from the original list (pi-teams, pi-mesh, pi-parallel-agents, pi-threads, pi-replicant, @zenobius/pi-worktrees, etc.) don't exist as separate npm packages. Some functionality may be:
   - Built into core pi
   - Part of other extensions
   - Planned but not yet published
   - Claude Code features (not pi-specific)

5. **MCP Integration**: Extensions can use MCP tools via the `mcp:` prefix when pi-mcp-adapter is installed, but pi's philosophy favors letting agents write their own capabilities.

6. **Configuration Patterns**: Most extensions use `~/.pi/agent/settings.json` for configuration with `env:VAR_NAME` pattern for sensitive values.

7. **Extension Isolation**: Subagent extensions typically run with `--no-extensions` by default and require explicit whitelisting for security.

### Recommendations

- For **subagent delegation**: Use `pi-subagents` for comprehensive features or `@e9n/pi-subagent` for orchestrator/pool patterns
- For **team coordination**: Use `@tmustier/pi-agent-teams`
- For **external communication**: Use `@e9n/pi-channels`
- For **session continuity**: Use `pi-handoff`
- For **agent oversight**: Use `pi-supervisor`
