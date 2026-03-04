# Pi Coding Agent Plugin Research: Categories F & G

**Git / Version Control and Session Management**

Research Date: 2026-02-26

---

## Category F - Git / Version Control

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **pi-gitnexus** | Git | Extension | GitNexus knowledge graph integration for pi - enriches searches with call chains, execution flows, and blast radius | - Auto-augments grep/find/bash/read tool results with call graph context<br>- Provides tools: `gitnexus_query`, `gitnexus_context`, `gitnexus_impact`, `gitnexus_detect_changes`<br>- Commands: `/gitnexus analyze`, `/gitnexus context <name>`, `/gitnexus impact <name>` | - `gitnexus` CLI tool on PATH (`npm i -g gitnexus`)<br>- `@mariozechner/pi-coding-agent`<br>- `@sinclair/typebox` | Requires running `/gitnexus analyze` to build knowledge graph; supports TypeScript/Python/Java; GitNexus itself is PolyForm Noncommercial licensed |
| **pi-shadow-git** | Git | Extension + Skill | Git-based orchestration logging for pi subagents with Mission Control dashboard | - Shadow git logging (commits workspace state after every turn)<br>- Mission Control TUI dashboard (`/mc`) for monitoring 100s of agents<br>- Audit trail in JSONL format<br>- Killswitch to disable logging | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-tui`<br>- Environment: `PI_WORKSPACE_ROOT`, `PI_AGENT_NAME` | Best for parallel agent orchestration; each agent gets isolated git repo; turn-level commits |
| **@mjakl/pi-git-research** | Git | Extension + Skill | Tools for researching and exploring Git repositories | - `git_repo` tool: Clone/update repos with shallow clones<br>- `git_repo_summary`: Get directory structure, README, latest commit<br>- `git_repo_versions`: List branches/tags<br>- `/explore-repo` skill for one-shot repo exploration | - `@mariozechner/pi-ai` >=0.37.0<br>- `@mariozechner/pi-coding-agent` >=0.37.0<br>- `@sinclair/typebox` >=0.34.0 | Configurable base dir via `settings.json` or CLI flag; uses `--depth 1` by default |
| **@yofriadi/pi-commit** | Git | Extension | AI-powered conventional commit generation for pi | - `/commit` command with flags: `--dry-run`, `--push`, `--split`, `--no-split`<br>- Automatic split-commit planning with dependency ordering<br>- Hunk-level staging for split commits<br>- Changelog orchestration for CHANGELOG.md | - `@mariozechner/pi-ai` ^0.52.10<br>- `@mariozechner/pi-coding-agent` ^0.52.10 | Sensitive path exclusion; supports both Node.js and Bun runtime |
| **checkpoint-pi** | Git | Extension | Git-based checkpoint extension - creates checkpoints at each turn for code state restoration | - Saves full worktree (tracked + untracked) at turn start<br>- Stores snapshots as Git refs under `refs/pi-checkpoints/`<br>- Restore options: files + conversation, conversation only, files only<br>- Smart filtering: excludes node_modules, large files (>10MB) | - Git repository<br>- Node.js 18+ | Same functionality as `pi-hooks/checkpoint` but standalone package |
| **pi-fork-from-first** | Session | Extension | Fork the current Pi session from its first user message and switch immediately | - `/fork-from-first` command<br>- Useful with pi-session-ask and handoff/pickup patterns<br>- Integrates with pi-rewind-hook for "keep current files" option | - `@mariozechner/pi-coding-agent` >=0.51.0 | Part of dot314 package collection |
| **@zenobius/pi-dcp** | Context | Extension | Dynamic Context Pruning - intelligently removes obsolete messages to optimize token usage | - Deduplication: removes duplicate tool outputs<br>- Superseded Writes: removes older file writes<br>- Error Purging: removes resolved errors<br>- Recency Protection: always preserves recent messages<br>- Commands: `/dcp-debug`, `/dcp-stats`, `/dcp-toggle` | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-agent-core`<br>- `bunfig` | Runs automatically on every LLM call; configurable rules; extensible custom rules |
| **@edmundmiller/pi-dcp** | Context | Extension | Fork of @zenobius/pi-dcp with same functionality | Same as @zenobius/pi-dcp | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-agent-core`<br>- `bunfig`, `@sinclair/typebox` | Edmund Miller's fork from his dotfiles monorepo |
| **pi-dcp** | Context | Extension | Another fork of pi-dcp | Same as @zenobius/pi-dcp | Same dependencies | Latest version (0.2.0) from Edmund Miller |
| **@edmundmiller/pi-scurl** | Web | Extension | Secure web fetch for pi - HTML-to-markdown via mdream, secret scanning, prompt injection detection | - `web_fetch` tool with HTML-to-markdown conversion<br>- Secret scanning: blocks requests with API keys/tokens<br>- Prompt injection detection with configurable actions (warn/redact/tag)<br>- Output truncation for pi context limits | - `@mariozechner/pi-coding-agent`<br>- `mdream` ^0.16.0<br>- `@sinclair/typebox` | Inspired by sibyllinesoft/scurl; detects 25+ secret formats |

---

## Category G - Session Management

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **pi-session-ask** | Session | Extension | Ask questions about session history without loading it into current context | - `session_ask({ question, sessionPath? })` tool<br>- `session_lineage({ sessionPath?, maxDepth? })` tool<br>- `/session-ask ...` slash command<br>- Queries pre-compaction history via subagent | - `@mariozechner/pi-coding-agent` >=0.51.0<br>- `@mariozechner/pi-tui`<br>- `@sinclair/typebox`<br>- `just-bash` | Keeps current context clean; can query parent/forked sessions |
| **pi-session-investigator** | Session | Skill | Forensic tools for Pi sessions - file recovery, subagent tracing, timeline reconstruction | - File recovery from session archives<br>- Subagent chain tracing<br>- Session content analysis<br>- Chronology reconstruction<br>- Mode investigation (single vs multi-agent) | - Python 3.8+<br>- Pi session history in `~/.pi/agent/sessions/` | Includes helper scripts: `list_sessions.py`, `find_file_in_sessions.py`, `extract_file.py` |
| **pi-smart-sessions** | Session | Extension | Auto-names Pi sessions with AI-generated summaries | - Detects `/skill:name your prompt` pattern<br>- Sets temporary name (first 60 chars)<br>- Calls cheap model to summarize prompt in 5-10 words<br>- Updates session name with skill prefix + summary | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-ai` | Uses Codex mini -> Haiku -> current model for summarization; background operation |
| **@kaiserlich-dev/pi-session-search** | Session | Extension | Full-text search across pi sessions with FTS5 index and overlay UI | - FTS5 SQLite index (sub-100ms queries)<br>- Browse recent sessions without typing<br>- `Ctrl+F` or `/search` to open<br>- Preview with highlighted terms<br>- Resume, Summarize & inject, New session with context | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-tui`<br>- `better-sqlite3` ^11.8.1 | Index at `~/.pi-session-search/index.db`; uses OpenRouter/Gemini Flash for summaries |
| **pi-conversation-retro** | Session | Extension | Automated postmortem reviews on coding agent conversations | - `/conversation-retro` command<br>- Discovers recent sessions for current repo<br>- Spawns reviewer subagents per session<br>- Generates per-session markdown summaries<br>- Synthesizes workflow improvement report | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-ai`<br>- `@mariozechner/pi-tui`<br>- `@sinclair/typebox` | Flags: `--days`, `--concurrency`, `--timeout`, `--output`; outputs to `.pi/reports/conversation-retro/` |
| **pi-rewind-hook** | Session | Extension | Rewind file changes with git-based checkpoints and conversation branching | - Creates git refs at session start and each turn<br>- `/rewind` to browse and restore checkpoints<br>- Options: files + conversation, conversation only, files only<br>- Auto-saves current state before restoring | - Pi agent v0.35.0+<br>- Git repository<br>- Node.js | Checkpoints stored as git refs under `refs/pi-checkpoints/`; 100-checkpoint limit per session |
| **@jasonish/pi-prompt-history** | Session | Extension | Search user prompt history across all sessions | - `Ctrl+Alt+R` to open search<br>- Fuzzy filter (fzf-style)<br>- Recency ordering (newest first)<br>- Load selected prompt into editor | - `@mariozechner/pi-coding-agent` | No slash commands; cache-based indexing with live merge of current session |
| **pi-prompt-stash** | Session | Extension | Git-stash for your train of thought - save/restore prompt drafts | - `Ctrl+S` to stash prompt draft<br>- `Ctrl+Shift+S` to pop stash<br>- `/stash` command with pop/drop/clear subcommands<br>- Interactive picker for restore/view/edit/delete | - `@mariozechner/pi-coding-agent` | Stashes stored in `~/.pi/agent/prompt-stash.json`; persists across sessions |
| **@kaiserlich-dev/pi-queue-picker** | Session | Extension | Pick between steering and follow-up when queuing messages | - Interactive picker when agent is busy<br>- **Steer**: interrupt and redirect<br>- **Follow-up**: queue for after current task<br>- `Ctrl+J` or `/edit-queue` to edit queued messages<br>- Reorder, toggle mode, delete queued items | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-tui` | Auto-disabled over SSH; remembers last chosen mode as default |
| **@askjo/pi-reflect** | Session | Extension | Self-improving behavioral files for pi coding agents | - `/reflect ./AGENTS.md` to run reflection<br>- Analyzes session transcripts for correction patterns<br>- Makes surgical edits to target file<br>- Auto-commits to git for version history<br>- Tracks correction rate and rule recidivism | - `@mariozechner/pi-coding-agent`<br>- `@mariozechner/pi-ai` | Works on any markdown file (AGENTS.md, MEMORY.md, SOUL.md); configurable data sources |

---

## Patterns and Observations

### Git Integration Patterns

1. **Knowledge Graph Enrichment**: `pi-gitnexus` stands out as the only package providing code intelligence (call graphs, execution flows, blast radius). It requires the separate GitNexus tool but provides deep semantic understanding of codebases.

2. **Checkpoint/Rewind Systems**: Multiple packages implement git-based checkpoints:
   - `checkpoint-pi` and `pi-rewind-hook` have similar functionality (both use git refs)
   - These enable time-travel through conversation + code state
   - Useful for experimentation without fear of losing work

3. **Subagent Orchestration**: `pi-shadow-git` targets a different use case - running many agents in parallel with isolated git repos and centralized monitoring via Mission Control dashboard.

### Session Management Patterns

1. **Context Preservation vs. Optimization**: Two opposing approaches:
   - **Preservation**: `pi-session-ask`, `@kaiserlich-dev/pi-session-search` help access historical context
   - **Optimization**: `pi-dcp` variants prune context to save tokens

2. **Retrospective Analysis**: Several packages focus on learning from past sessions:
   - `pi-conversation-retro`: Postmortem reviews to identify failure patterns
   - `@askjo/pi-reflect`: Self-improving behavioral files that evolve over time

3. **UX Enhancements**: Quality-of-life improvements:
   - `pi-smart-sessions`: Auto-naming sessions with AI summaries
   - `@jasonish/pi-prompt-history`: Searchable prompt history
   - `pi-prompt-stash`: Draft stashing
   - `@kaiserlich-dev/pi-queue-picker`: Choose steer vs follow-up

### Dependency Patterns

1. **Core Dependencies**: Almost all packages depend on:
   - `@mariozechner/pi-coding-agent` (the core agent)
   - Many also need `@mariozechner/pi-tui` (terminal UI components)
   - `@mariozechner/pi-ai` (LLM API abstraction)

2. **Common Utilities**:
   - `@sinclair/typebox` for schema validation
   - `better-sqlite3` for local indexing/search

3. **Runtime**: Most packages work with both Node.js and Bun, with some explicitly supporting both.

### Notable Features Across Packages

- **Background Operation**: Many extensions work transparently without user interaction (`pi-dcp`, `pi-smart-sessions`)
- **Subagent Spawning**: Several packages spawn subagents for isolation (`pi-session-ask`, `pi-conversation-retro`, `@askjo/pi-reflect`)
- **Git Integration**: Heavy use of git refs for persistence and versioning
- **Configurable**: Most packages support settings.json configuration

### Package Ecosystem Health

- All packages are actively maintained (recent 2026 releases)
- Most are MIT licensed
- Authors range from individual developers to small teams
- The `awesome-pi-agent` GitHub repo serves as a central discovery point
