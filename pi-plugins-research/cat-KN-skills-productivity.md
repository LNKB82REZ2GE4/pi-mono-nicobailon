# Pi Coding Agent Package Research: Categories K & N

**Research Date:** 2026-02-27

This document catalogs npm packages for the Pi coding agent in Category K (Skills/Extension Collections/Bundles) and Category N (Productivity/Shell).

---

## Category K - Skills / Extension Collections / Bundles

| Package | Category | Type | Description | Key Functionality | Sub-components (if collection) | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|-------------------------------|---------------------------|-------|
| **@ferologics/pi-skills** | K | Skill Collection | Custom skills for Pi coding agent | Web search, code review, code simplification, image/video compression, markdown conversion, context packing, session analysis | brave-search, code-review, code-simplifier, context-packer, image-compress, markdown-converter, multi-review, pr-context-packer, session-analyzer, video-compress, youtube-transcript | BRAVE_API_KEY, tokencount (cargo), ffmpeg, yt-dlp, jq, sips (macOS) | Mix of original and ported skills from anthropics/claude-plugins-official and steipete/agent-scripts |
| **@indiekitai/pi-skills** | K | Skill Collection | Developer tools for PostgreSQL, rate limiting, and terminal styling | Database health, schema inspection, TypeScript type generation, rate limiting, env auditing, LLM context estimation | pg-health, pg-inspect, pg-diff, pg-top, pg2ts, env-audit, throttled, llm-context, just, glamour, lipgloss | PostgreSQL access for pg-* skills | Each tool also has CLI and MCP server variants under @indiekitai/ scope |
| **@tmustier/extending-pi** | K | Skill | Guide for extending Pi | Decision guide for skills vs extensions vs prompt templates vs themes vs packages | skill-creator (nested sub-skill) | None | Educational/documentation skill |
| **pi-extensions** | K | Extension Collection | Personal extensions for Pi coding agent | File browser, tab status, task runner, minigames, usage stats, code actions, agent guidance | Extensions: files-widget, tab-status, ralph-wiggum, agent-guidance, usage-extension, raw-paste, code-actions, control, review, relaunch, ready-status, arcade (spice-invaders, picman, ping, tetris, mario-not); Skills: extending-pi, skill-creator, ralph-wiggum | agent-guidance requires setup.sh | Arcade games playable while tests run |
| **pi-superpowers** | K | Skill Collection + Extension | Structured workflow skills adapted from Superpowers | Brainstorming, planning, TDD, debugging, code review, finishing workflows | Skills: brainstorming, writing-plans, executing-plans, subagent-driven-development, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, receiving-code-review, dispatching-parallel-agents, using-git-worktrees, finishing-a-development-branch, writing-skills; Extension: plan-tracker | @sinclair/typebox, pi-ai, pi-tui, pi-coding-agent (peer) | Subagent dispatch requires separate extension installation |
| **pi-superpowers-plus** | K | Skill Collection + Extensions | Superpowers with active runtime enforcement | Same 12 skills + workflow monitor (TDD/debug/verification enforcement), subagent tool, plan tracker | Same skills as pi-superpowers; Extensions: workflow-monitor, subagent, plan-tracker; Agents: implementer, worker, code-reviewer, spec-reviewer | @sinclair/typebox, pi-ai, pi-tui, pi-coding-agent (peer) | Adds runtime warnings for TDD violations, debug escalation, verification gating. Drop-in upgrade from pi-superpowers |
| **@hyperprior/pi-bundle** | K | Extension Bundle (Meta-package) | Meta package installing all Hyperprior plugins | Installs 11 Hyperprior extensions as dependencies | @hyperprior/pi-commit, pi-review, pi-ask, pi-todo, pi-subagent, pi-model-roles, pi-safety, pi-python, pi-web, pi-ssh, pi-browser | @mariozechner/pi-coding-agent (peer) | Convenient way to install all Hyperprior extensions at once |
| **@vaayne/agent-kit** | K | Skill + Extension Collection | Reusable skills and extensions for Pi, Claude Code, Codex | MCP integration, subagent dispatch, notifications, frontend design, documentation, Python scripting | Skills (13): changelog-automation, document-writer, frontend-design, mcp-context7-docs, mcp-exa-search, mcp-grep-code, mcp-jetbrains-ide, mcp-skill-gen, python-script, react-best-practices, specs-dev, ui-skills, web-fetch; Extensions (4): mcp, subagent, notify, powerline-status; Agents (4): librarian, oracle, ui-engineer, worker | @mariozechner/pi-coding-agent (peer) | Works with multiple AI agents (Pi, Claude Code, Codex, Amp) |
| **pi-init** | K | Skill | Initialize or update AGENTS.md context files | Analyzes project structure, tech stack, coding conventions to generate comprehensive AGENTS.md | None | None | Similar to claude code /init functionality |
| **pi-rtk** | K | Extension | Token reduction extension (60-90% savings) | Filters tool output: source code comments, build noise, test aggregation, git compaction, search grouping | None | @mariozechner/pi-coding-agent (peer) | Based on RTK (Rust Token Killer) spec. Commands: /rtk-stats, /rtk-toggle, /rtk-clear |

---

## Category N - Productivity / Shell

| Package | Category | Type | Description | Key Functionality | Sub-components (if collection) | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|-------------------------------|---------------------------|-------|
| **pi-interactive-shell** | N | Extension | Run AI coding agents as foreground subagents in TUI overlays | Interactive PTY control, hands-free monitoring, dispatch mode for subagent delegation | None | node-pty, @xterm/headless, @xterm/addon-serialize, build tools (Xcode CLI on macOS) | Three modes: interactive (blocking), hands-free (polling), dispatch (notification). Supports vim, htop, psql, ssh, docker logs, etc. |
| **pi-fzf** | N | Extension | Fuzzy finding extension for Pi | Define commands that list candidates from shell commands, perform actions on selection | None | fzf (npm), @mariozechner/pi-tui, pi-coding-agent (peer) | Actions: editor, send, bash. Supports keyboard shortcuts. Config in ~/.pi/agent/fzf.json |
| **@4meta5/pi-shell-cli** | N | CLI Tool | CLI for generating reproducible pi project instances | Create new pi instances from pinned profile + allowlist manifests | None | @4meta5/pi-shell-base, @4meta5/pi-shell-core | Command: pi-shell up [targetPath] --profile ./profile.json |
| **@yofriadi/pi-fuzzy-match** | N | Extension | Fuzzy matching utilities for edit operations | Progressive matching strategies: exact, whitespace-stripped, unicode-normalized, substring, Levenshtein similarity | None | @mariozechner/pi-coding-agent ^0.52.10 (peer) | Used for edit tool operations. Functions: findMatch, seekSequence, findContextLine, similarity |
| **pi-bash-confirm** | N | Extension | Confirmation dialog before bash execution | Interactive approval, edit mode, blocked/safe patterns, Telegram notifications | None | @mariozechner/pi-coding-agent >=0.50.0 (peer) | Commands: /bash-confirm test-notify, /bash-confirm debug. Config via settings.json or env vars |
| **repeat-pi** | N | Extension | Repeat past tool calls from current branch | Picker for previous bash/edit/write tool calls, reload into editor | None | None | Uses $VISUAL or $EDITOR. Command: /repeat |
| **@netandreus/pi-auto** | N | Skill + MCP Server | Usage-aware model switching and load-balancing | Get usage per backend, suggest/switch provider, load-balancing or high-availability strategies | Skills: pi-auto; MCP tools: pi_get_usage, pi_suggest_provider, pi_set_provider, pi_get_provider, pi_get_strategy, pi_set_strategy, pi_get_priority, pi_set_priority | @ccusage/pi (global), pi-mcp-adapter, @modelcontextprotocol/sdk, zod | Integrates with Cursor Agent too. Supports claude-code, codex, cursorai backends |
| **pi-repoprompt-cli** | N | Extension | Integrates RepoPrompt with Pi via rp-cli | Bind RepoPrompt windows, execute rp-cli commands, read caching for token savings | None | rp-cli (external), diff, just-bash, @mariozechner/pi-tui, pi-coding-agent (peer) | Optional delta integration for diffs. Commands: /rpbind, /rpcli-readcache-status, /rpcli-readcache-refresh |
| **pi-non-interactive** | N | Extension | Prevent agent hangs on interactive commands | Injects env vars: GIT_EDITOR=true, PAGER=cat, LESS=-FX, etc. | None | @mariozechner/pi-coding-agent (peer) | Simple but essential for preventing hangs on git rebase, git log, etc. |

---

## Summary of Patterns

### Common Themes

1. **Skill Collections Dominate**: Most Category K packages are skill collections (bundles of multiple skills), often with 8-15 skills per package. The most comprehensive (pi-superpowers-plus, @vaayne/agent-kit) include both skills AND extensions.

2. **Workflow Skills are Popular**: Multiple packages (pi-superpowers, pi-superpowers-plus) provide structured development workflows: brainstorm -> plan -> execute -> verify -> review -> finish.

3. **Subagent Support**: Several packages (@vaayne/agent-kit, pi-superpowers-plus, pi-interactive-shell) provide subagent dispatch capabilities for parallel task execution.

4. **MCP Integration**: Many packages integrate with MCP (Model Context Protocol) servers, either as skills that use MCP tools or as MCP servers themselves (@netandreus/pi-auto).

5. **Shell/Command Safety**: Category N shows strong focus on safety: confirmation dialogs (pi-bash-confirm), non-interactive env injection (pi-non-interactive), and fuzzy matching for safer edits (@yofriadi/pi-fuzzy-match).

### Package Quality Indicators

- **Well-documented**: Most packages have comprehensive READMEs with usage examples
- **Peer dependencies**: Nearly all require @mariozechner/pi-coding-agent as a peer dependency
- **Active development**: Most packages were updated within the last month (Feb 2026)
- **License**: All packages use MIT license

### Notable Specializations

- **Database tools**: @indiekitai/pi-skills focuses on PostgreSQL
- **Token optimization**: pi-rtk provides 60-90% token reduction
- **Terminal UI**: pi-interactive-shell provides full PTY control
- **Notifications**: pi-bash-confirm includes Telegram integration
- **RepoPrompt**: pi-repoprompt-cli bridges to external RepoPrompt app

### Installation Patterns

Most packages support two installation methods:
1. `pi install npm:<package-name>` - from npm registry
2. `pi install git:github.com/<user>/<repo>` - from git (always latest)

Some also support filtered installation to load only specific extensions/skills from a monorepo package.
