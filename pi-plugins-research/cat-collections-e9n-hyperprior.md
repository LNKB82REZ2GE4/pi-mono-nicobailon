# Pi Coding Agent Plugin Collections Research

> Research date: 2026-02-27

## @e9n Collection

**Author:** Espen Nilsen (hi@e9n.dev)
**GitHub:** https://github.com/espennilsen/pi
**Type:** Comprehensive workflow automation suite

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **@e9n/pi-channels** | Extension | Two-way channel extension for routing messages between agents and external platforms | Telegram adapter (bidirectional, voice transcription), Slack adapter (Socket Mode), Webhook adapter, Chat bridge for incoming/outgoing messages, Event API (`channel:send`, `channel:receive`) | `@slack/socket-mode`, `@slack/web-api`, `@sinclair/typebox`, pi-ai, pi-coding-agent | Core messaging infrastructure - other extensions use this for notifications |
| **@e9n/pi-subagent** | Extension | Parallel task delegation - spawn isolated pi subprocesses | Single/Parallel/Chain/Orchestrator/Pool modes, Agent discovery from `~/.pi/agent/agents/*.md`, Extension isolation (`--no-extensions` default), System prompt injection | pi-ai, pi-coding-agent | Default blocks: pi-webserver, pi-cron, pi-channels, pi-web-dashboard, pi-telemetry, pi-subagent (self) |
| **@e9n/pi-cron** | Extension | Cron scheduler for recurring prompts | No database (plain text `pi-cron.tab`), Live reload via file watcher, Lock file for single-instance, Event API for inter-extension | pi-ai, pi-coding-agent | Disabled by default - use `--cron` flag or `/cron on` |
| **@e9n/pi-calendar** | Extension | Calendar tool with web UI and reminders | CRUD for events, Web UI at `/calendar`, REST API at `/api/calendar`, Recurring events (daily/weekly/monthly/yearly), Reminders via pi-channels | pi-webserver (for UI), SQLite or pi-kysely | Checks for upcoming events every 60s |
| **@e9n/pi-webserver** | Extension | Shared HTTP server for all extensions | Single port (default 4100), Basic auth + API bearer tokens, Cookie session auth, Prefix routing, Event bus mounting system, Built-in dashboard at `/` | None (standalone) | Foundation for all web UIs - other extensions mount via `web:mount` event |
| **@e9n/pi-td** | Extension | Task management with workflow enforcement | Full task lifecycle (create/start/log/handoff/review/approve/close), Web dashboard at `/tasks`, Cross-project view, REST API at `/api/td/*` | `td` CLI in `$PATH`, pi-webserver (for UI) | System prompt injection enforces every code change has a task + feature branch |
| **@e9n/pi-telemetry** | Extension | Local-only telemetry recording | Session/model/tool call events, Privacy-safe (no prompts/content), Per-day JSONL files in `~/.pi/agent/telemetry/` | None | Records: session_start/end, model_call, tool_call, config_change |
| **@e9n/pi-gmail** | Extension | Full Gmail integration via API | Read/search/compose/reply/manage emails, Attachments download, Background polling notifications, Web UI for OAuth flow | Google OAuth credentials, pi-webserver (for OAuth UI) | Requires Gmail API enabled in Google Cloud Console |
| **@e9n/pi-npm** | Extension | NPM package management lifecycle | 15 actions: init/install/uninstall/update/outdated/run/test/build/publish/pack/version/info/list/audit/link | npm CLI | Safe dry-run mode for publish/pack/version |
| **@e9n/pi-myfinance** | Extension | Personal finance tracking | Accounts, transactions, budgets, goals, recurring expenses, Reports & insights, Bank statement import (DNB, SAS, Amex), Web dashboard at `/finance` | SQLite or pi-kysely, pi-webserver (for UI), pi-channels (for notifications) | Auto-processes recurring transactions daily |
| **@e9n/pi-memory** | Extension | Persistent memory system | Long-term memory in `MEMORY.md`, Daily logs in `memory/YYYY-MM-DD.md`, Full-text search, Auto-injected into every agent turn | None | Includes bundled skill with usage conventions |
| **@e9n/pi-workon** | Extension | Project context switching | Switch project context (loads AGENTS.md, git status, td issues), Auto-discovery from `~/Dev`, Tech stack detection, Scaffold AGENTS.md/.pi/td configs | td CLI (optional) | Includes `workon` skill for prompt templates |
| **@e9n/pi-vault** | Extension | Obsidian vault integration | Read/write/append/patch/search notes, Daily notes & templates, Frontmatter support, Dataview queries, Web dashboard at `/vault` | Obsidian Local REST API plugin (optional, falls back to filesystem), pi-webserver (for UI) | Deep links open notes directly in Obsidian |
| **@e9n/pi-supabase** | Extension | Supabase database integration | Query/describe/count/rpc actions, Realtime subscriptions via pi-channels, Dual key support (anon/service role), Query audit log via pi-kysely | Supabase project URL + keys, pi-channels (for realtime notifications) | RPC allow-list for security |
| **@e9n/pi-kysely** | Extension | Shared Kysely database registry | Multi-driver (SQLite/PostgreSQL/MySQL), Table-level RBAC, Migration system with checksum integrity, Event bus API | `better-sqlite3`, `pg`, or `mysql2` (bundled) | Foundation for other extensions needing persistence |
| **@e9n/pi-github** | Extension | GitHub integration via `gh` CLI | PR/issue management, CI status, Automated PR review fix flow (fetch threads -> fix -> resolve), Create/merge PRs | `gh` CLI installed and authenticated | Both `/gh-*` and `/github-*` command variants |
| **@e9n/pi-jobs** | Extension | Agent run telemetry and cost tracking | Auto-tracking all agent runs, Token usage & cost per model/provider, Tool stats (counts, errors, duration), Channel tracking (tui/cron/heartbeat/subagent), Web dashboard at `/jobs` | SQLite or pi-kysely, pi-webserver (for UI) | Query via `jobs` tool: stats/recent/cost_report/models/tools |
| **@e9n/pi-context** | Extension | Visual context window usage | Colored hexagon grid, Category breakdown (system/tools/agents/skills/messages), Per-item token counts, Autocompact buffer display | None | Inspired by Claude Code's `/context` command |
| **@e9n/pi-projects** | Extension | Project tracking dashboard | Auto-discovery of git repos, Live git status (branch/dirty/ahead-behind), Hide/unhide projects, Web dashboard at `/projects` | SQLite or pi-kysely, pi-webserver (for UI) | Includes `git-project-status` skill |
| **@e9n/pi-web-dashboard** | Extension | Live agent dashboard with SSE streaming | Real-time event feed (start/end/turns/tool calls), Browser prompt submission (rate-limited), Status endpoint | pi-webserver | SSE events: connected, agent_start/end, turn_start/end, tool_start/end |
| **@e9n/pi-webnav** | Extension | Unified navigation shell | Auto-discovery of mounts, Iframe layout with nav bar, Hash-based routing (#/tasks, #/calendar), Live refresh | pi-webserver >= 0.1.0 | Mounts at `/` - longest-prefix matching preserves specific mounts |

### @e9n Collection Summary

**Overall Purpose:** A comprehensive productivity and automation suite that transforms pi from a coding assistant into a full personal/work operating system. The collection covers messaging, scheduling, task management, finance, knowledge management, and observability.

**Design Philosophy:**
- **Event-driven architecture:** Extensions communicate via `pi.events` (e.g., `web:mount`, `channel:send`, `kysely:ready`)
- **Shared infrastructure:** `pi-webserver` provides a single HTTP server; `pi-kysely` provides shared database; `pi-channels` provides messaging
- **Web UIs everywhere:** Most extensions mount dashboards accessible via browser
- **Privacy-first:** Telemetry is local-only, no external data collection
- **Plain text where possible:** Cron jobs in `.tab` files, memory in Markdown, settings in JSON

**Key Integration Points:**
1. `pi-webserver` is the foundation - most UIs require it
2. `pi-channels` enables cross-extension notifications and external messaging
3. `pi-kysely` provides shared database for extensions needing persistence
4. `pi-subagent` enables parallel agent workflows

---

## @hyperprior Collection

**Author:** hyperprior (hyperprior@aither.computer)
**GitHub:** Not publicly linked (likely private monorepo)
**Type:** Power-user utility bundle

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **@hyperprior/pi-bundle** | Meta-package | Installs all Hyperprior plugins as one dependency | Depends on: pi-commit, pi-review, pi-ask, pi-todo, pi-subagent, pi-model-roles, pi-safety, pi-python, pi-web, pi-ssh, pi-browser | All @hyperprior/* packages | Convenience package for installing everything |
| **@hyperprior/pi-model-roles** | Extension | Model role selector utility | `/hyper-role` command | pi-coding-agent | Quick model switching |
| **@hyperprior/pi-browser** | Extension | Lightweight page fetch + extraction | `hyperpi_browser` tool: open/navigate/snapshot/extract/links/close actions | pi-coding-agent | No headless browser - deterministic CLI workflow |
| **@hyperprior/pi-safety** | Extension | Safety guardrails | Blocks dangerous commands, Protected paths | pi-coding-agent | Prevents destructive operations |
| **@hyperprior/pi-subagent** | Extension | Isolated subagent runs | `hyperpi_subagent` tool with single/parallel/chain modes, Per-task model/tool/cwd overrides, `/subagent <task>` quick command | pi-coding-agent | Simpler alternative to @e9n/pi-subagent |
| **@hyperprior/pi-review** | Extension | Structured code review findings | `report_finding` tool with P0-P3 priority, confidence score, file + line range, Branch-scoped tracking, `/hyper-review` command | pi-coding-agent | Findings grouped by priority |
| **@hyperprior/pi-todo** | Extension | Branch-safe todo list | `hyperpi_todos` tool, `/hyper-todos` command | pi-coding-agent | Todos scoped to current branch |
| **@hyperprior/pi-ask** | Extension | Interactive multi-question tool | `hyperpi_ask` tool for asking user multiple questions | pi-coding-agent | Interactive clarification |
| **@hyperprior/pi-commit** | Extension | Git commit helpers | `hyperpi_commit` tool, `/hyper-commit` command | pi-coding-agent | Streamlined commit workflow |
| **@hyperprior/pi-python** | Extension | Python code execution | `hyperpi_python` tool, `/hyper-python` command | pi-coding-agent, Python | Run Python code/files |
| **@hyperprior/pi-web** | Extension | Simple web search and fetch | `hyperpi_web` tool | pi-coding-agent | Basic web operations |
| **@hyperprior/pi-ssh** | Extension | Remote command runner | `hyperpi_ssh` tool for SSH commands | pi-coding-agent, SSH access | Execute commands on remote servers |

### @hyperprior Collection Summary

**Overall Purpose:** A focused toolkit for power users who want streamlined workflows for common development tasks - code review, commits, todos, subagents, and remote execution. Minimal but practical.

**Design Philosophy:**
- **Tool-focused:** Each package provides a single, well-scoped tool + command
- **Branch-aware:** Review findings and todos are scoped to git branches
- **No external dependencies:** Lightweight implementations without heavy infrastructure
- **Consistent naming:** All tools prefixed with `hyperpi_`, all commands with `/hyper-`
- **Quick commands:** Most packages include a `/hyper-*` command for rapid access

**Key Differences from @e9n:**
- Much smaller scope - no web dashboards, no external integrations
- Focus on developer workflow vs. full productivity suite
- Lighter weight - no shared infrastructure requirements
- More opinionated naming conventions

---

## Quick Comparison

| Aspect | @e9n Collection | @hyperprior Collection |
|--------|-----------------|------------------------|
| **Scope** | Full productivity OS | Developer utilities |
| **Size** | 21 packages | 12 packages |
| **Web UIs** | Extensive (dashboards for most) | None |
| **External integrations** | Telegram, Slack, Gmail, Supabase, Obsidian | None |
| **Infrastructure** | Shared webserver, database, messaging | Standalone tools |
| **Complexity** | Higher (many interdependencies) | Lower (self-contained) |
| **Best for** | Teams/power users wanting automation | Individual developers wanting quick tools |
