# Pi Coding Agent Plugin Ecosystem - Master Research Table

**Research Date:** 2026-02-26
**Total Packages Researched:** 171 npm packages
**Packages Found & Documented:** ~120+
**Categories:** 17 functional groups

---

## Quick Navigation

1. [Multi-Agent / Orchestration](#1-multi-agent--orchestration)
2. [Memory / Context Management](#2-memory--context-management)
3. [Web / Browser Access](#3-web--browser-access)
4. [MCP / Service Integration](#4-mcp--service-integration)
5. [Git / Version Control](#5-git--version-control)
6. [Session Management](#6-session-management)
7. [UI / Display / Widgets](#7-ui--display--widgets)
8. [Notifications / Alerts](#8-notifications--alerts)
9. [Planning / Review / Analysis](#9-planning--review--analysis)
10. [Model / Provider Management](#10-model--provider-management)
11. [Skills Collections / Bundles](#11-skills-collections--bundles)
12. [Productivity / Shell / Workflow](#12-productivity--shell--workflow)
13. [Audio / TTS / Voice](#13-audio--tts--voice)
14. [Safety / Guardrails](#14-safety--guardrails)
15. [Fun / Games / Demos](#15-fun--games--demos)
16. [Scheduling / Automation](#16-scheduling--automation)
17. [Miscellaneous / Specialized](#17-miscellaneous--specialized)
18. [Author Collections](#18-author-collections)

---

## 1. Multi-Agent / Orchestration

Packages for spawning, coordinating, and managing multiple AI agents.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-subagents** | Extension | Most feature-rich subagent system | `/run`, `/chain`, `/parallel`, TUI overlay (Ctrl+Shift+A), chain files, MCP support, pool agents | pi-mcp-adapter optional |
| **@e9n/pi-subagent** | Extension | Parallel task delegation | Single/parallel/chain/orchestrator/pool modes, agent discovery, extension isolation | None |
| **@tmustier/pi-agent-teams** | Extension | Full team coordination | TaskCreate/TaskUpdate/TaskList, SendMessage, git worktrees, session branching, auto-claim | None |
| **@e9n/pi-channels** | Extension | External platform bridge | Telegram, Slack, webhooks, bidirectional chat, typing indicators | None |
| **pi-supervisor** | Extension | Agent oversight | Supervises agent, injects guidance when drifting, sensitivity levels | None |
| **pi-handoff** | Extension | Session continuity | `/handoff` generates notes, creates linked sessions | None |
| **pi-peon-ping** | Extension | Audio lifecycle events | 10 sound packs, SSH/devcontainer detection, desktop notifications | Audio player |

**Recommendations:**
- Comprehensive subagent work: `pi-subagents`
- Team coordination: `@tmustier/pi-agent-teams`
- External messaging: `@e9n/pi-channels`

---

## 2. Memory / Context Management

Packages for persistent memory, context optimization, and knowledge storage.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-memory-md** | Extension | GitHub-backed memory | memory_init/sync/read/write/search, YAML frontmatter, Letta-style | GitHub repo |
| **pi-memory** | Extension | Memory + optional semantic search | memory_write/read/search, scratchpad, selective injection | qmd optional |
| **@askjo/pi-mem** | Extension | Daily memory system | Daily logs, scratchpad, auto-injection of MEMORY.md | None |
| **pi-episodic-memory** | Extension | Semantic search over conversations | Local vector embeddings, sqlite-vec, privacy-focused | Transformers.js, sqlite-vec |
| **@edmundmiller/pi-context-repo** | Extension | Git-backed memory filesystem | Full git integration, memory_commit/backup/log | None |
| **@e9n/pi-context** | Extension/Skill | Visual context usage | `/context` shows token breakdown by category | None |
| **pi-context-filter** | Extension | gitignore-style context control | Exclude/include files via `.pi/.context` | None |
| **@aaronmaturen/pi-context7** | Extension | Library docs integration | Fetch up-to-date docs from Context7 API | None |

**Recommendations:**
- Simple: `@askjo/pi-mem`
- Version control: `pi-memory-md` or `@edmundmiller/pi-context-repo`
- Semantic search: `pi-episodic-memory`
- Debug context: `@e9n/pi-context`

---

## 3. Web / Browser Access

Packages for web search, content fetching, and browser automation.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-web-access** | Extension | Most comprehensive | Zero-config Chrome, video understanding, GitHub cloning, fallback chains | Chrome (macOS), ffmpeg optional |
| **pi-web-tools** | Extension | Exa-based search | web_search, fetch_content, GitHub cloning | EXA_API_KEY |
| **pi-surf** | Extension | Scout subagent pattern | Filters noise via lightweight scout agent | BRAVE_API_KEY optional |
| **pi-agent-browser** | Extension | Real browser automation | Chromium, screenshots for vision models | agent-browser (auto-installed) |
| **@benvargas/pi-firecrawl** | Extension | Enterprise scraping | JS rendering, map/search/scrape tools | Firecrawl API key |
| **pi-web-utils** | Extension | Most configurable | SearXNG, custom engines, ripgrep repo search | rg optional |
| **@hyperprior/pi-browser** | Extension | Lightweight fetch | HTTP-only, no real browser, zero deps | None |
| **pi-parallel-web-search** | Extension | Parallel AI search | Single-purpose, $80 free credits | PARALLEL_API_KEY |

**Recommendations:**
- Zero setup: `pi-web-access`
- Video/YouTube: `pi-web-access`
- Real browser: `pi-agent-browser`
- Privacy/self-hosted: `pi-web-utils`
- Enterprise scraping: `@benvargas/pi-firecrawl`

---

## 4. MCP / Service Integration

Packages for MCP server integration and external service bridges.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-mcp-adapter** | Extension | MCP proxy (solves token bloat) | Single proxy tool (~200 tokens), lazy loading, metadata cache | None |
| **pi-tidy-mcp-adapter** | Extension | Alternative MCP adapter | Same core approach, different lifecycle modes | None |
| **@jademind/pi-bridge** | Extension | File-based inbox | Status bar integration, mobile clients | None |
| **pi-messenger-bridge** | Extension | Multi-messenger | Telegram, WhatsApp, Slack, Discord | Provider credentials |
| **pi-messenger** | Extension | Inter-agent coordination | Crew task orchestration | None |
| **@e9n/pi-supabase** | Extension | Supabase integration | Database queries, realtime subscriptions | Supabase project |
| **@e9n/pi-kysely** | Extension | Kysely SQL builder | Type-safe queries, shared DB registry | Database |
| **@e9n/pi-github** | Extension | GitHub via gh CLI | PR review fix workflow, issues, repos | gh CLI |
| **@e9n/pi-gmail** | Extension | Gmail API integration | Full email access, send/receive | Google credentials |
| **@e9n/pi-npm** | Extension | NPM package lifecycle | Publish, version, manage packages | npm credentials |
| **@e9n/pi-vault** | Extension | Obsidian integration | Read/write vault notes | Obsidian vault |
| **kimicodeprovider** | Extension | Kimi/Moonshot provider | Coding-optimized models | Kimi API key |

---

## 5. Git / Version Control

Packages for git workflows, checkpoints, and version control integration.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-gitnexus** | Extension | Knowledge graph integration | Call chains, blast radius analysis | None |
| **pi-shadow-git** | Extension | Subagent orchestration | Mission Control dashboard | None |
| **@mjakl/pi-git-research** | Extension | Repository exploration | Deep repo analysis tools | None |
| **@yofriadi/pi-commit** | Extension | AI conventional commits | Split planning, commit generation | None |
| **checkpoint-pi** | Extension | Git-based checkpoints | Restore code to saved states | None |
| **pi-fork-from-first** | Extension | Session forking | Branch from first message | None |
| **pi-dcp** / **@zenobius/pi-dcp** / **@edmundmiller/pi-dcp** | Extension | Dynamic context pruning | Token optimization via git refs | None |
| **@edmundmiller/pi-scurl** | Extension | Secure web fetch | Secret scanning, injection detection | None |

---

## 6. Session Management

Packages for session history, search, and management.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-session-ask** | Extension | Query session history | Subagent-based search | None |
| **pi-session-investigator** | Extension | Forensic analysis | File recovery, conversation analysis | None |
| **pi-smart-sessions** | Extension | AI-generated names | Automatic session naming | None |
| **@kaiserlich-dev/pi-session-search** | Extension | Full-text search | FTS5 SQLite, fast queries | None |
| **pi-conversation-retro** | Extension | Postmortem reviews | Analyze past conversations | None |
| **pi-rewind-hook** | Extension | Git checkpoints | Conversation branching | None |
| **@jasonish/pi-prompt-history** | Extension | Searchable history | Browse past prompts | None |
| **pi-prompt-stash** | Extension | Draft stashing | Like git stash for prompts | None |
| **@kaiserlich-dev/pi-queue-picker** | Extension | Message picker | Choose steer vs follow-up | None |
| **@askjo/pi-reflect** | Extension | Self-improving behavior | Generates behavioral files | None |

---

## 7. UI / Display / Widgets

Packages for status bars, footers, and visual widgets.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **@marckrenn/pi-sub-bar** | Extension | Usage tracking widget | 7+ AI provider quotas, progress bars | None |
| **pi-powerline-footer** | Extension | Powerline-style bar | Welcome overlay, thinking indicators, git | None |
| **@juanibiapina/pi-powerbar** | Extension | Event-driven status bar | Extensions contribute via events | None |
| **@zenobius/pi-footer** | Extension | Customizable footer | Template-based rendering | None |
| **@tmustier/pi-files-widget** | Extension | In-terminal file browser | Git integration, diff viewer | bat/delta/glow |
| **pi-usage-bars** | Extension | Usage visualization | Token/cost progress bars | None |
| **@jademind/pi-visual** | Extension | Visual rendering | Graphical output support | None |
| **visual-explainer** | Skill | HTML/Mermaid diagrams | 6 prompt templates, Chart.js | None |
| **pi-beads** / **@edmundmiller/pi-beads** | Extension | Task management | Beads CLI integration | bd CLI |
| **pi-agui** | Extension | AG-UI scaffold | Create AG-UI applications | None |
| **@e9n/pi-web-dashboard** | Extension | Live agent dashboard | SSE streaming, browser prompts | pi-webserver |

---

## 8. Notifications / Alerts

Packages for desktop, audio, and custom notifications.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-notify** | Extension | OSC desktop notifications | Ghostty, iTerm2, WezTerm, Kitty, tmux, Windows | Terminal support |
| **@rbright/pi-notify-desktop** | Extension | Desktop notifications | OSC 777/99, zellij support | None |
| **@rbright/pi-notify-koko** | Extension | Voice notifications | Koko TTS CLI integration | Koko CLI |
| **pi-poly-notify** | Extension | Multi-channel | macOS desktop, sound, Pushover | Pushover optional |
| **@marcfargas/pi-heartbeat** | Extension | Non-blocking timers | Replace `sleep` with timers | None |
| **pi-caffeinate** | Extension | Keep-awake | Cross-platform, prevents sleep | None |

---

## 9. Planning / Review / Analysis

Packages for code review, planning modes, and analysis tools.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **@devkade/pi-plan** | Extension | Feature-complete plan mode | `/todos`, approval gates, explicit phases | None |
| **@juanibiapina/pi-plan** | Extension | Simple plan toggle | Lightweight plan mode | None |
| **pi-critique** | Extension | Code critique | Structured feedback | None |
| **pi-deep-review** | Extension | Deep PR analysis | Uses OpenAI Responses API | OpenAI API key |
| **@hyperprior/pi-review** | Extension | Structured findings | P0-P3 priority levels | None |
| **@yofriadi/pi-review** | Extension | Interactive review | Finding tools, inline comments | None |
| **@hyperprior/pi-todo** | Extension | Branch-scoped todos | Task tracking per branch | None |
| **pi-search-agent** | Extension | Semantic code search | Real-time search | None |
| **@marcfargas/brainiac** | Extension | Persistent knowledge | SQLite + FTS5, survives sessions | None |
| **pi-evalset-lab** | Extension | Evaluation tooling | Prompt comparison, datasets | None |
| **@marcfargas/pi-test-harness** | Dev Dependency | Testing framework | Mock LLM boundary | None |
| **pi-interview** | Extension | Structured input | Forms, multi-select | None |
| **pi-annotate** | Extension | Visual annotation | Image annotation | None |

---

## 10. Model / Provider Management

Packages for model switching, provider integration, and model-specific features.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-model-switch** | Extension | Agent-controlled switching | Switch models mid-session | None |
| **pi-kimi-coder** | Extension | Kimi K2 provider | OAuth, subscription support | Kimi account |
| **@jasonish/pi-default-model** | Extension | Save/restore model | Remember preferences | None |
| **pi-model-sysprompt-appendix** | Extension | Per-model sysprompt | Customize system prompts | None |
| **pi-model-aware-compaction** | Extension | Per-model thresholds | Optimize context per model | None |
| **@hyperprior/pi-model-roles** | Extension | Role-based switching | Quick model profiles | None |
| **pi-codex-profile** | Extension | Codex-specific | Profile injection, apply_patch | None |
| **pi-moonshot** | Extension | Moonshot AI provider | Pay-per-token API | Moonshot API key |
| **pi-nvidia-nim** | Extension | NVIDIA NIM provider | 100+ models, free preview | NVIDIA account |
| **pi-prompt-template-model** | Extension | Template with model | Model/skill/thinking frontmatter | None |
| **pi-pai-lite** | Extension | Structured thinking | Council, red_team, first_principles modes | None |

---

## 11. Skills Collections / Bundles

Meta-packages containing multiple skills and extensions.

| Package | Type | TL;DR | Sub-components | Dependencies |
|---------|------|-------|----------------|--------------|
| **pi-superpowers** | Skills | Workflow skills | 12 skills: brainstorm→finish workflow | None |
| **pi-superpowers-plus** | Skills | Active enforcement | Same 12 + enforcement hooks | None |
| **@ferologics/pi-skills** | Skills | 11 utility skills | brave-search, code-review, context-packer, video-compress | Various API keys |
| **@indiekitai/pi-skills** | Skills | PostgreSQL tools | pg-health, pg-inspect, pg2ts, rate limiting | PostgreSQL |
| **@vaayne/agent-kit** | Bundle | Comprehensive kit | 13 skills + 4 extensions + 4 subagents | Various |
| **@hyperprior/pi-bundle** | Bundle | Meta-package | Installs 11 Hyperprior extensions | None |
| **pi-extensions** | Bundle | @tmustier collection | Arcade games, file browser, usage stats | None |
| **pi-init** | Skill | AGENTS.md generator | Like Claude Code's /init | None |
| **pi-rtk** | Extension | Token reduction | 60-90% savings via optimization | None |

---

## 12. Productivity / Shell / Workflow

Packages for shell integration, file operations, and workflow tools.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-interactive-shell** | Extension | Full PTY control | Run vim, htop, psql interactively | None |
| **pi-fzf** | Extension | Fuzzy finder | Configurable commands and actions | None |
| **pi-bash-confirm** | Extension | Confirmation dialogs | Telegram notifications | None |
| **@netandreus/pi-auto** | Extension | Usage-aware switching | Load-balancing across models | None |
| **pi-repoprompt-cli** | Extension | RepoPrompt bridge | Integration with RepoPrompt app | RepoPrompt |
| **pi-non-interactive** | Extension | Prevent hangs | Block interactive commands | None |
| **repeat-pi** | Extension | Repeat tool calls | Replay past operations | None |
| **@yofriadi/pi-fuzzy-match** | Extension | Fuzzy editing | Progressive matching for edits | None |
| **@4meta5/pi-shell-cli** | Extension | Project scaffolding | Manifest-based generation | None |
| **pi-read-many** | Extension | Batch file reading | Adaptive packing | None |
| **pi-ask-user** | Extension | Interactive input | Multi-select, freeform | None |
| **pi-ask-tool-extension** | Extension | Tab-based input | Inline note editing | None |

---

## 13. Audio / TTS / Voice

Packages for text-to-speech and voice features.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **@swairshah/pi-talk** | Extension | Loqui TTS | macOS text-to-speech | Loqui app |
| **@jay-zod/speakturbo** | Extension | Ultra-fast TTS | ~90ms latency, Apple Silicon | MLX |
| **pi-voice-of-god** | Extension | System prompt injection | NOT TTS - custom messages | None |

---

## 14. Safety / Guardrails

Packages for command confirmation and safety features.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **@aliou/pi-guardrails** | Extension | Comprehensive security | Env file protection, dangerous command confirmation | None |
| **@hyperprior/pi-safety** | Extension | Confirmation layer | git/bash/edit/write confirmations | None |
| **pi-mdc-rules** | Extension | Markdown rules | Frontmatter triggers (always_on, glob, model_decision) | None |
| **@yevhen.b/bo-pi** | Extension | Tool preflight | Plain-language approval rules | None |

---

## 15. Fun / Games / Demos

Entertainment and demonstration packages.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **@tmustier/pi-nes** | Extension | NES emulator | Full emulation, Kitty graphics | Kitty terminal |
| **pi-doom** | Extension | DOOM via WASM | Half-block rendering | None |
| **@tmustier/pi-arcade** | Extension | 5 arcade games | Tetris, Pac-Man, Pong, Space Invaders, Mario | None |
| **@tmustier/pi-ralph-wiggum** | Extension | Long-running loops | Iterative development, self-reflection | None |
| **@rhobot-dev/rho** | Extension | Always-on AI | Memory, web UI, Telegram, email | Various |
| **@rhobot-dev/pi-ralph** | Extension | TUI for ralph | Dashboard integration | rho |
| **wallhaven-random-pi-extension** | Extension | Random wallpapers | Thinking-time widget | None |
| **@tmustier/pi-clean-slides** | Extension | PowerPoint from YAML | Consulting-style slides | None |

---

## 16. Scheduling / Automation

Packages for cron jobs, scheduled tasks, and automation.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **pi-schedule-prompt** | Extension | In-process cron | Interval/cron scheduling, widget | None |
| **@e9n/pi-cron** | Extension | Cron with subprocesses | Isolated subprocess spawning | None |
| **@e9n/pi-jobs** | Extension | Telemetry/cost tracking | Web dashboard for runs | pi-webserver |
| **@e9n/pi-workon** | Extension | Project switching | AGENTS.md scaffolding | None |
| **@e9n/pi-calendar** | Extension | Full calendar | Recurring events, reminders, web UI | pi-webserver |
| **@e9n/pi-td** | Extension | Task management | Mandatory workflow enforcement | pi-webserver |
| **@e9n/pi-projects** | Extension | Git repo discovery | Multi-project status dashboard | None |

---

## 17. Miscellaneous / Specialized

Other useful packages that don't fit other categories.

| Package | Type | TL;DR | Key Features | Dependencies |
|---------|------|-------|--------------|--------------|
| **@ogulcancelik/pi-sketch** | Extension | Browser sketch pad | Visual communication | None |
| **@benvargas/pi-antigravity-image-gen** | Extension | Image generation | Gemini 3 Pro Image | Gemini API key |
| **pi-powerpoint** | Extension | PowerPoint via MCP | Create/edit presentations | MCP server |
| **@e9n/pi-myfinance** | Extension | Personal finance | Bank import, web dashboard | pi-webserver |
| **@marcfargas/go-easy** | Extension | Google APIs | Gmail, Drive, Calendar, Tasks | Google credentials |
| **@tryinget/pi-extensions-template_copier** | Template | Extension scaffold | Copier template for new extensions | copier |
| **@juanibiapina/pi-extension-settings** | Extension | Settings management | Centralized settings UI | None |
| **@benvargas/pi-ancestor-discovery** | Extension | Resource discovery | Recursive ancestor discovery | None |
| **@tmustier/pi-skill-creator** | Extension | Skill guidelines | Creation help | None |
| **pi-package-test** | Extension | Reference implementation | Shows package features | None |
| **claudemon** | Extension | - | (not found) | - |

---

## 18. Author Collections

Notable authors with multiple packages.

### @e9n (Espen Nilsen) - 21 packages
**Philosophy:** Full productivity suite with web dashboards, SQLite storage, shared infrastructure.
**Key packages:** pi-webserver, pi-subagent, pi-channels, pi-memory, pi-calendar, pi-td, pi-gmail, pi-github, pi-supabase, pi-vault, pi-web-dashboard

### @hyperprior - 12 packages
**Philosophy:** Lightweight developer toolkit with minimal dependencies.
**Key packages:** pi-bundle, pi-review, pi-todo, pi-safety, pi-browser, pi-model-roles

### @tmustier (Thomas Mustier) - 8 packages
**Philosophy:** Polished productivity tools and fun demos.
**Key packages:** pi-nes, pi-arcade, pi-files-widget, pi-agent-teams, pi-ralph-wiggum, pi-clean-slides

### @vaayne - 3 packages
**Philosophy:** Agent infrastructure and multi-platform support.
**Key packages:** agent-kit (13 skills + 4 extensions + 4 subagents)

### @edmundmiller - 4 packages
**Philosophy:** Security-focused with git integration.
**Key packages:** pi-dcp, pi-scurl, pi-context-repo, pi-beads

### @marcfargas - 4 packages
**Philosophy:** Testing utilities and Google integration.
**Key packages:** go-easy, pi-test-harness, pi-heartbeat, brainiac

### @yofriadi - 3 packages
**Philosophy:** Developer workflow tools.
**Key packages:** pi-commit, pi-review, pi-fuzzy-match

---

## Quick Decision Guide

| I want to... | Recommended Package(s) |
|--------------|------------------------|
| Spawn subagents | pi-subagents, @e9n/pi-subagent |
| Add memory | @askjo/pi-mem, pi-memory-md |
| Search the web | pi-web-access, pi-surf |
| Automate a browser | pi-agent-browser |
| Get desktop notifications | pi-notify, pi-poly-notify |
| Add a status bar | @marckrenn/pi-sub-bar, pi-powerline-footer |
| Use MCP servers | pi-mcp-adapter |
| Manage tasks | @hyperprior/pi-todo, @e9n/pi-td |
| Review code | @hyperprior/pi-review, pi-deep-review |
| Switch models | pi-model-switch, @hyperprior/pi-model-roles |
| Protect against accidents | @aliou/pi-guardrails, @hyperprior/pi-safety |
| Run scheduled tasks | @e9n/pi-cron, pi-schedule-prompt |
| Add TTS | @swairshah/pi-talk, @jay-zod/speakturbo |
| Get a bundle of everything | @hyperprior/pi-bundle, @vaayne/agent-kit |

---

## Files Generated

All detailed research saved to:
- `cat-A-multiagent.md` - Multi-Agent / Orchestration
- `cat-B-ui-monitoring.md` - UI / Display + Monitoring
- `cat-C-memory.md` - Memory / Context
- `cat-D-web.md` - Web / Browser
- `cat-E-mcp-integration.md` - MCP / Service Integration
- `cat-FG-git-session.md` - Git + Session Management
- `cat-HOJ-notify-safety-model.md` - Notifications + Safety + Model Management
- `cat-I-planning-review.md` - Planning / Review / Analysis
- `cat-KN-skills-productivity.md` - Skills Collections + Shell Productivity
- `cat-LMN-audio-games-scheduling.md` - Audio + Games + Scheduling
- `cat-Q-misc.md` - Miscellaneous / Specialized
- `cat-collections-e9n-hyperprior.md` - @e9n + @hyperprior collections
- `cat-collections-authors.md` - Other author collections
