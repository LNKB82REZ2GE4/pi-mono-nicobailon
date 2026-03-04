# Pi Coding Agent Plugin Collections by Author

Research summary of npm packages from specific authors in the Pi ecosystem.

---

## @tmustier Collection (Thomas Mustier)

**Author Focus**: Productivity tools, workflow automation, agent teams, games, and presentation tools. Thomas builds polished, feature-rich extensions with strong documentation and video demos. Many packages are part of a monorepo at `github.com/tmustier/pi-extensions`.

**Style**: Professional UX, consulting-style outputs, well-documented commands, interactive widgets.

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| `@tmustier/pi-nes` | extension (pi-package) | NES emulator extension for Pi | Play NES games in terminal with joypad support, save states, Game Genie codes | `pngjs`, peer: `@mariozechner/pi-tui`, `@mariozechner/pi-coding-agent` | Full NES emulator with controller support; `/nes` command |
| `@tmustier/pi-files-widget` | extension (pi-package) | In-terminal file browser and viewer | Navigate files, view diffs, select code, send comments without leaving terminal | `bat`, `delta`, `glow` (external CLI tools), peer: pi-tui/coding-agent | Commands: `/readfiles`, `/review`, `/diff`. Rich keybindings for navigation |
| `@tmustier/pi-agent-teams` | extension + skill (pi-package) | Claude Code agent teams workflow | Spawn teammates, share task lists, coordinate work across sessions with auto-claim, DMs, broadcast | peer: pi-ai, pi-tui, pi-agent-core, pi-coding-agent, typebox | Complex team orchestration with worktrees, session branching, hooks. Commands: `/team spawn`, `/swarm`, `/tw` |
| `@tmustier/pi-ralph-wiggum` | extension + skill (pi-package) | Long-running agent loops | Iterative development loops that verify work, self-reflect at intervals, multiple parallel loops | peer: pi-tui, pi-coding-agent | Based on Geoffrey Huntley's ralph-loop. Commands: `/ralph start/resume/stop` |
| `@tmustier/pi-arcade` | extension (pi-package) | Arcade minigames | sPIce-invaders, picman, ping, tetris, mario-not platformer | peer: pi-tui, pi-coding-agent | Fun terminal games. Commands: `/spice-invaders`, `/picman`, `/ping`, `/tetris`, `/mario-not` |
| `@tmustier/pi-clean-slides` | skill (pi-package) | PowerPoint CLI skill | Generate consulting-style table slides from YAML, inspect/edit PPTX, render to PNG | Python + pip, pptx library | Opinionated slide builder focused on structured tables, not graphics. CLI: `pptx generate` |
| `@tmustier/pi-skill-creator` | skill (pi-package) | Skill-creation guidelines | Templates and guidelines for creating Pi skills in Agent Skills format | None | Meta-skill for building other skills |
| `@tmustier/extending-pi` | skill (pi-package) | Guide for extending Pi | Decide between skills, extensions, prompt templates, themes, context files, or custom models | None | Includes nested skill-creator sub-skill |

---

## @vaayne Collection (Vaayne)

**Author Focus**: Agent infrastructure and web tools. Vaayne builds foundational tools for agent orchestration, MCP integration, and web interactions. Part of monorepo at `github.com/vaayne/agent-kit`.

**Style**: Developer-focused, modular, MCP-heavy, includes subagent definitions.

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| `@vaayne/pi-subagent` | extension (pi-package) | Delegate tasks to specialized subagents | Spawn separate pi processes with isolated context; supports single, parallel, and chain modes | peer: pi-coding-agent, typebox | Discovers agents from `~/.pi/agent/agents/` and `.pi/agents/`. Includes librarian, oracle, ui-engineer, worker subagents |
| `@vaayne/pi-web-tools` | extension (pi-package) | Web fetching and search | `web-fetch` for URL content extraction, `web-search` via Exa AI | `jsdom`, `turndown`, optional `EXA_API_KEY` | Converts HTML to markdown, supports custom headers |
| `@vaayne/agent-kit` | pi-package (monorepo) | Reusable skills and extensions collection | 13 skills (changelog, docs, frontend, mcp tools), 4 extensions (mcp, subagent, notify, powerline-status), 4 subagents | peer: pi-coding-agent | Comprehensive kit for Pi, Claude Code, and Codex |

---

## @zenobius Collection (Zenobius Jiricek)

**Author Focus**: UI enhancements and context management. Zenobius builds polished UI components (footer, worktrees) and performance optimizations (context pruning).

**Style**: Type-safe, schema-driven, composable, extensible APIs.

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| `@zenobius/pi-footer` | extension (pi-package) | Customizable footer component | Template-based rendering with context providers (model, git, time, usage), transforms, API for custom providers | `nconf`, `envdir`, `typebox`, `emittery`, peer: pi-tui/coding-agent | JSON config in `~/.pi/agent/pi-footer.json`. Commands: `/pi-footer debug/reload/providers` |
| `@zenobius/pi-worktrees` | extension (pi-package) | Git worktrees management | Manage git worktrees from within Pi | `nconf`, `typebox`, peer: pi-tui/coding-agent | For isolated development branches |
| `@zenobius/pi-dcp` | extension (pi-package) | Dynamic Context Pruning | Intelligently removes obsolete messages to optimize tokens; deduplication, superseded writes, error purging | `bunfig`, peer: pi-agent-core, pi-coding-agent | Commands: `/dcp-debug`, `/dcp-stats`, `/dcp-toggle`. Runs automatically before each LLM call |

---

## @marcfargas Collection (Marc Fargas)

**Author Focus**: Testing infrastructure, agent utilities, and integrations. Marc builds foundational tools for testing extensions, non-blocking timers, persistent memory, and Google API integration.

**Style**: Well-tested, developer tooling, MIT licensed, comprehensive documentation.

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| `@marcfargas/go-easy` | skill (pi-package) | Google APIs made easy | Gmail, Drive, Calendar, Tasks wrappers for AI agents; CLI tools; safety gates for destructive ops | `@googleapis/drive`, `@googleapis/gmail`, `@googleapis/calendar`, `@googleapis/tasks`, `google-auth-library` | Own OAuth2 auth in `~/.go-easy/`. CLI: `go-gmail`, `go-drive`, `go-calendar`. Safety model: READ/WRITE/DESTRUCTIVE |
| `@marcfargas/pi-test-harness` | dev dependency | Test harness for pi extensions | Playbook-based model mocking, in-process session testing, sandbox install verification, mock pi CLI | peer: pi-ai, pi-agent-core, pi-coding-agent | Lets pi run for real, only mocks LLM. DSL: `when()`, `calls()`, `says()`. `createMockPi()` for subprocess testing |
| `@marcfargas/pi-heartbeat` | extension + skill (pi-package) | Non-blocking timers | `timer()` for one-shot wakeups, `heartbeat()` for periodic polling; replaces blocking `sleep` | peer: pi-coding-agent | Sleep interceptor blocks sleep-only commands. Commands: `/cancel-timer`. Range: 1-3600s |
| `@marcfargas/brainiac` | extension (pi-package) | Persistent knowledge store | FTS5 SQLite storage for agent learnings; auto-search before each turn; connections between facts | `better-sqlite3`, peer: pi-coding-agent | Tools: `brainiac_learn`, `brainiac_recall`, `brainiac_connect`, `brainiac_feedback`. Auto-injects relevant context |

---

## @yofriadi Collection (Yofriadi Yahya)

**Author Focus**: Developer workflow tools. Yofriadi builds practical tools for code editing, commits, and reviews. Part of monorepo at `github.com/yofriadi/pi-extensions`.

**Style**: Focused, practical, runtime-agnostic (Node/Bun compatible).

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| `@yofriadi/pi-fuzzy-match` | extension (pi-package) | Fuzzy matching utilities | Progressive matching strategies: exact, whitespace, comment-prefix, Unicode normalized, substring, Levenshtein | peer: pi-coding-agent | Used for edit tool operations when exact match fails. Threshold: 0.95 |
| `@yofriadi/pi-commit` | extension (pi-package) | AI-powered conventional commits | `/commit` with split-commit planning, hunk staging, changelog orchestration, secret redaction | peer: pi-ai, pi-coding-agent | Flags: `--push`, `--dry-run`, `--split`, `--allow-mixed-index`. Validates conventional commits |
| `@yofriadi/pi-review` | extension (pi-package) | Interactive code review | Branch comparison, uncommitted changes, specific commits; tools: `report_finding`, `submit_review` | peer: pi-coding-agent | Commands: `/review`, `/review-status`, `/review-reset`. Task-aware for parallel reviewers |

---

## @edmundmiller Collection (Edmund Miller)

**Author Focus**: Security, memory, and task management. Edmund maintains a dotfiles monorepo at `github.com/edmundmiller/dotfiles` with several pi packages. Some are forks/adaptations of others' work.

**Style**: Security-conscious, git-backed persistence, minimal dependencies.

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| `@edmundmiller/pi-dcp` | extension (pi-package) | Dynamic Context Pruning | Fork of @zenobius/pi-dcp; deduplication, superseded writes, error purging | `bunfig`, `typebox`, peer: pi-agent-core, pi-coding-agent | Same functionality as zenobius version |
| `@edmundmiller/pi-scurl` | extension (pi-package) | Secure web fetch | HTML-to-markdown via mdream, secret scanning (25+ patterns), prompt injection detection | `mdream`, `typebox`, peer: pi-coding-agent | Tool: `web_fetch`. Actions: warn/redact/tag. Detects AWS, GitHub, Slack, OpenAI keys |
| `@edmundmiller/pi-context-repo` | extension (pi-package) | Git-backed persistent memory | Memory as markdown files with YAML frontmatter in `.pi/memory/`; system/ pinned, others progressive | peer: pi-coding-agent | Inspired by Letta Code. Tools: `memory_write/delete/commit/search/log/backup`. Commands: `/memory`, `/remember` |
| `@edmundmiller/pi-beads` | extension (pi-package) | Beads (bd) task management | Fork of @soleone/pi-tasks, beads-only; supports blocked/deferred status | `bd` CLI in PATH, `.beads/` directory, peer: pi-coding-agent, pi-tui | Toggle: `ctrl+x` or `/tasks`. Keybindings for status, priority, type cycling |

---

## Summary by Category

### Extensions (Add Tools/Commands)
- **Games/Entertainment**: pi-nes, pi-arcade
- **File Navigation**: pi-files-widget
- **Agent Orchestration**: pi-agent-teams, pi-subagent
- **Automation Loops**: pi-ralph-wiggum
- **Web Tools**: pi-web-tools, pi-scurl
- **Context Management**: pi-dcp (zenobius/edmundmiller)
- **Memory/Knowledge**: brainiac, pi-context-repo
- **Git/Worktrees**: pi-worktrees
- **Timers**: pi-heartbeat
- **Commits/Reviews**: pi-commit, pi-review
- **Task Management**: pi-beads
- **Fuzzy Matching**: pi-fuzzy-match
- **Footer UI**: pi-footer

### Skills (Prompt Templates)
- **Presentations**: pi-clean-slides
- **Google APIs**: go-easy
- **Meta/Creation**: pi-skill-creator, extending-pi

### Development Tools
- **Testing**: pi-test-harness (comprehensive test framework)

---

## Quick Recommendations

| Need | Recommended Package |
|------|---------------------|
| Multi-agent coordination | `@tmustier/pi-agent-teams` |
| Long-running tasks | `@tmustier/pi-ralph-wiggum` |
| Web fetching (secure) | `@edmundmiller/pi-scurl` |
| Token optimization | `@zenobius/pi-dcp` |
| Persistent memory | `@marcfargas/brainiac` or `@edmundmiller/pi-context-repo` |
| Google API access | `@marcfargas/go-easy` |
| Testing extensions | `@marcfargas/pi-test-harness` |
| Better commits | `@yofriadi/pi-commit` |
| Code review | `@yofriadi/pi-review` |
| Custom footer | `@zenobius/pi-footer` |
| File browser | `@tmustier/pi-files-widget` |
| Task management | `@edmundmiller/pi-beads` |
| Non-blocking waits | `@marcfargas/pi-heartbeat` |

---

*Generated: 2026-02-27*
