# @mariozechner/pi-orchestration

Multi-agent orchestration for [pi](https://github.com/badlogic/pi-mono) - chains, parallel agents, and specialist teams with a pinnable monitor widget.

## Features

- **Chain Execution** - Sequential A→B→C pipelines where each step receives `{previous}` output
- **Parallel Execution** - Run independent tasks concurrently with configurable concurrency
- **Team Execution** - Persistent specialists with DAG-based task scheduling and dependencies
- **Monitor Widget** - Pinnable TUI widget showing agent status and activity
- **Workflow Resumability** - Pause/resume workflows with checkpoints
- **Optional Persistence** - Save teams to disk for reuse across sessions
- **Context Modes** - Fresh (minimal) or branched (summary snapshot) context for subagents
- **Per-Agent Models** - Assign different models to different agents

## Installation

```bash
pi install npm:@mariozechner/pi-orchestration
```

Or add to `~/.pi/agent/settings.json`:

```json
{
  "packages": ["npm:@mariozechner/pi-orchestration"]
}
```

## Quick Start

### Chain Execution

Sequential pipeline where each step gets the previous output:

```json
{
  "mode": "chain",
  "chain": [
    { "agent": "scout", "task": "Map the authentication module" },
    { "agent": "planner", "task": "Create an implementation plan based on: {previous}" },
    { "agent": "worker", "task": "Implement the plan: {previous}" },
    { "agent": "reviewer", "task": "Review the implementation" }
  ]
}
```

### Parallel Execution

Run independent tasks concurrently:

```json
{
  "mode": "parallel",
  "tasks": [
    { "agent": "scout", "task": "Scan API routes" },
    { "agent": "scout", "task": "Scan database schema" },
    { "agent": "scout", "task": "Scan configuration files" }
  ],
  "concurrency": 3
}
```

### Team Execution

Persistent specialists with task dependencies:

```json
{
  "mode": "team",
  "team": {
    "members": [
      { "id": "arch", "name": "Architect", "role": "planner", "model": "claude-sonnet-4-5" },
      { "id": "dev1", "name": "Developer 1", "role": "worker", "model": "claude-sonnet-4-5" },
      { "id": "dev2", "name": "Developer 2", "role": "worker", "model": "claude-haiku-4-5" },
      { "id": "qa", "name": "QA", "role": "reviewer", "model": "claude-sonnet-4-5" }
    ],
    "tasks": [
      { "title": "Design API", "assignee": "arch" },
      { "title": "Implement endpoints", "assignee": "dev1", "dependsOn": ["Design API"] },
      { "title": "Write tests", "assignee": "dev2", "dependsOn": ["Design API"] },
      { "title": "Review implementation", "assignee": "qa", "dependsOn": ["Implement endpoints", "Write tests"] }
    ]
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/teams` | Toggle the monitor widget (pin/unpin) |
| `/teams-create` | Create a new specialist team |
| `/teams-list` | List saved teams |

## Monitor Widget

The monitor widget shows all active agents:

```
┌──────────────────────────────────────────────────────────────────┐
│ 📌 Teams (2 running · 1 done)                                    │
│ ◆ scout       running   · Scanning auth module                   │
│ ◆ planner     running   · Creating implementation plan           │
│ ◇ worker      idle       · Waiting for planner                   │
│ ✓ reviewer    completed  · Review done                           │
│ ─────────────────────────────────────────────────────────────── │
│ Total: 12.4k tokens                                              │
│ [Enter] expand  [p] pin  [q] close                              │
└──────────────────────────────────────────────────────────────────┘
```

## Built-in Agents

| Agent | Description | Default Model |
|-------|-------------|---------------|
| `scout` | Fast codebase reconnaissance | claude-haiku-4-5 |
| `planner` | Analysis and planning | claude-sonnet-4-5 |
| `worker` | Implementation specialist | claude-sonnet-4-5 |
| `reviewer` | Code review | claude-sonnet-4-5 |
| `researcher` | Web research | claude-sonnet-4-5 |

## Configuration

Add to `~/.pi/agent/settings.json`:

```json
{
  "orchestration": {
    "maxConcurrent": 4,
    "defaultTimeout": 600000,
    "widgetPinned": false
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `maxConcurrent` | 4 | Maximum concurrent agents |
| `defaultTimeout` | 600000 | Per-task timeout in ms (10 min) |
| `widgetPinned` | false | Start with widget pinned |

## Context Modes

### Fresh (default)
Subagent receives only the task prompt. Best for isolated, reproducible work.

### Branched
Subagent receives a summary snapshot of the parent session:
- Git branch and status
- Recent file operations
- Key decisions made
- Open questions
- Condensed conversation summary

Use branched context when the task depends on understanding the current state of work.

## Agent Templates

Agents are defined as Markdown files with YAML frontmatter:

```markdown
---
name: my-agent
description: What this agent does
model: claude-sonnet-4-5
thinking: high
tools: read, grep, find
---

You are a specialized agent. Your job is to...
```

Place custom agents in:
- `~/.pi/agent/agents/` - User-level agents
- `.pi/agents/` - Project-level agents

## Technical Details

### Spawn Modes

- **subprocess** (default) - Spawns a new `pi` process. Full isolation, works with any model.
- **rpc** - Spawns an RPC session in-process. Faster for lightweight tasks, shared state.

### Recursion Guard

Agents cannot spawn subagents beyond depth 2 by default. Configure with:

```bash
pi --subagent-max-depth 3
```

Or set `PI_SUBAGENT_MAX_DEPTH=3` environment variable.

## License

MIT
