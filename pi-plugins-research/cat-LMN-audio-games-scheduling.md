# Pi Coding Agent Package Research - Categories L, M, N (Part 2)

**Research Date:** 2026-02-27

## Category L - Audio / TTS / Voice

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **@swairshah/pi-talk** | Audio/TTS | Extension | Text-to-speech extension using Loqui | Gives Pi a voice with `<voice>` tags, 7 voice options, central playback via Loqui broker | Loqui.app (macOS menubar app), brew install swairshah/tap/loqui | Local TTS, no cloud APIs, uses Pocket TTS by Kyutai Labs |
| **@jay-zod/speakturbo** | Audio/TTS | Skill | Ultra-fast TTS with ~90ms latency | 8 built-in voices, Apple Silicon optimized via MLX, daemon architecture | Python + MLX, Rust CLI (speakturbo-cli), pip install pocket-tts | ~90ms to first sound, 4x faster than real-time, local/private |
| **pi-voice-of-god** | Audio/Prompt | Extension | User-controlled message insertion into system prompt | Mid-session editing of persistent "operator instruction" before `# Project Context` section | Pi coding agent | Commands: `/vog`, `/vog on/off`, `/vog <message>` - NOT a TTS package, named confusingly |

## Category M - Fun / Games / Demo

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **@tmustier/pi-nes** | Games | Extension | NES emulator in terminal | Full NES emulation with Kitty graphics, ROM library browser, save states | @mariozechner/pi-tui, pngjs, Kitty-compatible terminal | Controls: WASD/arrows, Z/X for A/B, Enter/Space for Start, Tab for Select. Detach with Ctrl+Q |
| **pi-doom** | Games | Extension | Play DOOM in terminal | DOOM via WebAssembly (doomgeneric), half-block character rendering with 24-bit color | @mariozechner/pi-tui | Bundles shareware WAD, GPL-2.0 licensed. Controls: WASD/arrows, F/Ctrl=fire, Space=use, 1-7=weapons |
| **@tmustier/pi-arcade** | Games | Extension | Arcade minigames collection | 5 games: sPIce-invaders, picman, ping (pong), tetris, mario-not (platformer) | Pi coding agent | Type `clawd` in spice-invaders for special challenge mode |
| **@tmustier/pi-ralph-wiggum** | Automation/Games | Extension+Skill | Long-running agent loops for iterative development | Self-starting loops with checklist, multi-parallel loops, optional self-reflection intervals | Pi coding agent | Based on Geoffrey Huntley's ralph-loop. Commands: `/ralph start/resume/stop/status`. Agent tool: `ralph_start()` |
| **@rhobot-dev/rho** | Agent/Memory | Extension+Skill | Always-on AI operator with persistent memory | Heartbeat check-ins, brain memory (JSONL), knowledge vault, Telegram/Email channels, web UI | hono, grammy, @hono/node-server, @hono/node-ws | Runs on macOS, Linux, Android (Termux), iOS (via SSH). Local-first state, no hosted backend |
| **@rhobot-dev/pi-ralph** | Automation | Extension | Manage ralph loops from within pi TUI | Status widget, `/ralph` overlay, `ralph_loop()` tool for PTY embedding | pi-interactive-shell, ralph CLI on PATH | Integrates with external `ralph` CLI tool (separate from rho) |
| **ralph-loop-pi-extension** | Automation | N/A | **NOT FOUND** on npm registry | N/A | N/A | Package does not exist - may be confused with @tmustier/pi-ralph-wiggum or @rhobot-dev/pi-ralph |
| **wallhaven-random-pi-extension** | Fun/Wallpaper | Extension | Random wallpapers from wallhaven.cc | `get_random_wallpaper` tool, thinking-time widget, static/rotate effects with fade | @silvia-odwyer/photon-node, optional WALLHAVEN_API_KEY | Supports image terminals (Kitty/Ghostty/WezTerm/iTerm2), config layering (global + project) |
| **@tmustier/pi-clean-slides** | Productivity | Skill | PowerPoint CLI for AI agents | Generate consulting-style table slides from YAML, inspect/edit PPTX, render to PNG | Python package (pip install), pptx CLI | Opinionated: text tables only, no charts/graphics. Bundles example template. BYO template support |

## Category N (Part 2) - Scheduling / Automation

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **pi-schedule-prompt** | Scheduling | Extension | "Heartbeat" prompt scheduling | Natural language scheduling, cron expressions, intervals, one-shot timers | croner, nanoid, @sinclair/typebox | Tool: `schedule_prompt`. Widget auto-hides when empty. Infinite loop prevention built-in. Commands: `/schedule-prompt` |
| **@e9n/pi-cron** | Scheduling | Extension | Cron scheduler running prompts as isolated subprocesses | Jobs in `~/.pi/agent/pi-cron.tab`, live reload, disabled by default, lock file | Pi coding agent | Tool: `cron` (add/remove/list/enable/disable/run). Commands: `/cron on/off`. Uses `pi -p` subprocesses |
| **@e9n/pi-jobs** | Telemetry | Extension | Agent run telemetry and cost tracking | Token usage, estimated cost per model/provider, tool stats, channel tracking | better-sqlite3, optional pi-kysely | Tool: `jobs` (stats/recent/cost_report/models/tools). Web dashboard at `/jobs`. Commands: `/jobs [channel]` |
| **@e9n/pi-workon** | Project Management | Extension+Skill | Project context switching and initialization | Switch projects, detect tech stacks, scaffold AGENTS.md, load git status | Pi coding agent | Tools: `workon` (switch/status/list), `project_init` (detect/init/batch). Scans `~/Dev` by default |
| **@e9n/pi-calendar** | Scheduling | Extension | Calendar with web dashboard and reminders | Full CRUD, recurrence (daily/weekly/monthly/yearly), REST API at `/api/calendar` | better-sqlite3, pi-webserver (for UI), pi-channels (for reminders) | Tool: `calendar` (list/today/upcoming/create/update/delete). Web UI at `/calendar` |
| **@e9n/pi-td** | Task Management | Extension | Task management with workflow enforcement | Full lifecycle (create/start/log/handoff/review/approve/close), web dashboard | better-sqlite3, td CLI, pi-webserver (for UI) | Tool: `td`. Workflow enforcement via system prompt. Cross-project view. Web at `/tasks` |
| **@e9n/pi-projects** | Project Tracking | Extension+Skill | Auto-discover git repos with status | Branch name, dirty file count, ahead/behind remote, hide/unhide projects | better-sqlite3, pi-webserver (for UI) | Tool: `projects` (list/scan/hide/unhide/sources). Command: `/projects [search]`. Web at `/projects` |

---

## Summary of Patterns

### Package Type Distribution
- **Extensions:** 16 packages (dominant type)
- **Skills:** 4 packages (speakturbo, pi-clean-slides, pi-ralph-wiggum, pi-workon, pi-projects)
- **Extension+Skill combos:** 4 packages (pi-ralph-wiggum, rho, pi-workon, pi-projects)

### Authorship Clusters
1. **@tmustier (Thomas Mustier):** 4 packages (pi-nes, pi-arcade, pi-ralph-wiggum, pi-clean-slides) - games, automation, productivity
2. **@e9n (Espen Nilsen):** 6 packages (pi-cron, pi-jobs, pi-workon, pi-calendar, pi-td, pi-projects) - comprehensive productivity suite with shared architecture
3. **@rhobot-dev (mobrienv):** 2 packages (rho, pi-ralph) - always-on agent platform

### Technical Patterns

**Storage/Database:**
- SQLite (better-sqlite3) is the standard for @e9n's suite (pi-jobs, pi-calendar, pi-td, pi-projects)
- JSONL for memory/brain storage (rho)
- Plain text files for cron tabs (pi-cron: `pi-cron.tab`)

**Web UI Pattern:**
- All @e9n extensions with persistence offer web dashboards via pi-webserver
- rho has its own built-in web server (Hono-based, no bundler)
- Dashboard routes follow pattern: `/jobs`, `/calendar`, `/tasks`, `/projects`

**Scheduling Approaches:**
- **pi-schedule-prompt:** In-process scheduling with croner library, sends prompts as user messages
- **@e9n/pi-cron:** Spawns isolated `pi -p` subprocesses, file-based tab format
- **rho:** Heartbeat check-ins on configurable interval (default 30m)

**TTS Architecture:**
- **pi-talk:** Requires external Loqui.app (macOS menubar), central broker queue at 127.0.0.1:18081
- **speakturbo:** Daemon architecture (Python+MLX) with Rust CLI, HTTP on :7125

### Missing/Unavailable Packages
- **ralph-loop-pi-extension:** Does not exist on npm registry - likely confused with pi-ralph-wiggum or pi-ralph

### Notable Features
- **Ralph Wiggum pattern:** Multiple implementations of "long-running agent loops" exist (tmustier's, rhobot's) - different from each other
- **Workflow enforcement:** pi-td injects system prompt to require tasks and feature branches for code changes
- **Cross-project awareness:** pi-projects and pi-workon both scan directory trees for git repos
- **Channel tracking:** pi-jobs distinguishes between `tui`, `cron`, `heartbeat`, and `subagent` run sources
