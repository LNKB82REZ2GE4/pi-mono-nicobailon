# Category B: UI/Display + Category P: Monitoring/Logging

Research date: 2026-02-26

## Package Research Summary

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **@marckrenn/pi-sub-bar** | Extension | Usage widget extension for pi-coding-agent | Displays realtime usage quotas for multiple AI providers (Anthropic, GitHub Copilot, Google Gemini, OpenAI Codex, etc.) with visual progress bars, rate limit windows, and status indicators from provider status pages. Theme save/share/import. | Requires `sub-core` (bundled); Credentials from `~/.pi/agent/auth.json` or provider-specific locations | Commands: `sub-bar:settings`, `Ctrl+Alt+P` to cycle providers; stores settings in `~/.pi/agent/pi-sub-bar-settings.json` |
| **pi-powerline-footer** | Extension | Powerline-style status bar and welcome header extension for pi | Welcome overlay splash screen on startup; rounded box status bar with thinking level indicator (rainbow for high/xhigh), git integration, context awareness warnings at 70%/90%, token intelligence with subscription detection | None (standalone); Optional Nerd Fonts for enhanced display | Toggle with `/powerline`; presets: default, minimal, compact, full, nerd, ascii; Env: `POWERLINE_NERD_FONTS=1/0` |
| **@juanibiapina/pi-powerbar** | Extension | Persistent powerline-style status bar with left/right segments | Event-driven architecture - any extension can update via `powerbar:update` event; built-in segments for git-branch, tokens, context-usage, provider, model, sub-hourly/weekly; configurable placement (above/below editor) | `pi-extension-settings` (must load AFTER it); Optional: `pi-sub-core` for subscription segments | Load order critical: after pi-extension-settings, before segment emitters; Settings via `/extension-settings` |
| **@zenobius/pi-footer** | Extension | Footer/status extension (limited info available) | Status display extension - npm page was inaccessible | Unknown | Could not retrieve detailed information |
| **@tmustier/pi-files-widget** | Extension | In-terminal file browser and diff viewer widget | Navigate files, view diffs, select code, send comments to agent; git status tracking (3s refresh); changed-only view; line selection mode for commenting | Required: `bat` (syntax highlighting), `git-delta` (diffs), `glow` (markdown); Optional: `tuicr` for `/review`, `bun` for `/diff` | Commands: `/readfiles` (browser), `/review` (tuicr), `/diff` (critique); Full keyboard navigation |
| **pi-usage-bars** | Extension | Usage display extension (limited info available) | Usage bars for monitoring - npm page was inaccessible | Unknown | Could not retrieve detailed information; may be similar to pi-sub-bar |
| **@jademind/pi-visual** | Extension | Visual extension (limited info available) | Visual display functionality - npm page was inaccessible | Unknown | Could not retrieve detailed information |
| **visual-explainer** | Skill | Agent skill that turns terminal output into styled HTML pages | Generates self-contained HTML with Mermaid diagrams, Chart.js dashboards, dark/light themes; 6 prompt templates: `/generate-web-diagram`, `/generate-slides`, `/diff-review`, `/plan-review`, `/project-recap`, `/fact-check`; auto-triggers for complex tables (4+ rows/3+ columns) | Browser for viewing; Optional: `surf-cli` for Gemini image generation | Output to `~/.agent/diagrams/`; `--slides` flag for slide deck generation; MIT license |
| **pi-agui** | Scaffold/CLI | Scaffold tool for AG-UI + Pi app template | Creates ready-to-use AG-UI + Pi application from template | Node.js | Usage: `npx pi-agui@latest my-agui-app`; then `./dev.sh`; Options: `--no-install`, `-h`, `-v` |
| **pi-beads** | Extension | Pi extension for beads (bd) task management | Fork of @soleone/pi-tasks stripped to beads-only; supports `blocked` and `deferred` status; list view with priority (0-4), type cycling, task editing; send task to prompt or insert ref | `bd` CLI in PATH; `.beads/` directory (run `bd init`) | Toggle: `ctrl+x` or `/tasks`; Keybindings: w/s navigate, space cycle status, e edit, c create, f filter |
| **@edmundmiller/pi-beads** | Extension | Fork of pi-beads with minor version difference | Same as pi-beads - beads-only task management with bd 0.55+ support | `bd` CLI, `.beads/` directory | Nearly identical to pi-beads 0.2.0 (this is 0.1.1) |
| **@aliou/pi-processes** | Extension | Manage background processes from Pi | Tool `processes` with actions: start, list, output, logs, kill, clear; interactive `/processes` panel; auto-cleanup on session exit; file-based logging; notification preferences (notifyOnSuccess/notifyOnFailure/notifyOnKill) | None standalone | Usage: `processes start "pnpm dev" name="backend-dev"`; Panel keys: j/k select, J/K scroll logs, x kill, c clear |
| **@agentlogs/pi** | Extension | Automatic transcript capture and upload for AgentLogs | Uploads conversation transcripts on session end (Ctrl+D); git commit tracking with transcript links; branch-aware transcripts for pi's `/tree` branching | `agentlogs` CLI (bundled via npx) | Config: `AGENTLOGS_CLI_PATH` env var; Repository allowlist via `agentlogs allow/deny`; Debug logs to `/tmp/agentlogs.log` |
| **@e9n/pi-telemetry** | Extension | Local-only telemetry for pi | Privacy-safe event recording (no prompts/completions/file contents); per-day JSONL files to `~/.pi/agent/telemetry/`; events: session_start/end, model_call, tool_call, config_change | None | Config in settings.json: `{"telemetry": {"mode": "on/off", "level": "INFO"}}`; Command: `/telemetry [on/off] [LEVEL]` |
| **claudemon** | Unknown | Package information not accessible | NPM page was forbidden; web search did not find relevant results | Unknown | Could not retrieve detailed information; may not be a pi-specific package |

---

## Summary of Patterns

### Common Themes Across UI/Display Extensions

1. **Status Bar Ecosystem**: Multiple powerline-style extensions exist (pi-powerline-footer, pi-powerbar) with different philosophies:
   - `pi-powerline-footer`: Self-contained, preset-based, welcome overlay
   - `pi-powerbar`: Event-driven, extensible via `powerbar:update` events, allows other extensions to contribute segments

2. **Usage Monitoring**: Strong focus on tracking AI provider quotas:
   - `@marckrenn/pi-sub-bar` is the most comprehensive, supporting 7+ providers
   - Common pattern: progress bars, rate limit windows, status indicators

3. **Event-Driven Architecture**: Extensions like `pi-powerbar` use pi's event system (`pi.events.emit`) for decoupled communication between extensions

4. **Settings Management**: Two patterns:
   - Settings via `pi-extension-settings` (pi-powerbar approach)
   - Dedicated settings commands (`sub-bar:settings`, `sub-core:settings`)

### Common Themes Across Monitoring/Logging Extensions

1. **Privacy-First Telemetry**: `@e9n/pi-telemetry` explicitly avoids storing user content - only numeric/enum/hashed fields

2. **Session Tracking**: `@agentlogs/pi` focuses on preserving conversation history with git integration

3. **Background Process Management**: `@aliou/pi-processes` enables non-blocking long-running commands

### Dependencies Patterns

1. **External CLI Tools**: Several extensions require external tools:
   - `@tmustier/pi-files-widget`: bat, git-delta, glow
   - `pi-beads`: bd CLI
   - `visual-explainer`: browser (optional: surf-cli)

2. **Extension Dependencies**: Some extensions depend on other pi extensions:
   - `pi-powerbar` requires `pi-extension-settings`
   - `@marckrenn/pi-sub-bar` bundles `sub-core`

3. **Provider Credentials**: Extensions accessing provider APIs read credentials from:
   - `~/.pi/agent/auth.json`
   - Provider-specific locations (`~/.codex/auth.json`, `~/.gemini/oauth_creds.json`)
   - Environment variables
   - macOS Keychain

### Notable Features

- **Thinking Level Indicators**: pi-powerline-footer shows thinking levels with rainbow effects for high/xhigh
- **Branch-Aware Sessions**: @agentlogs/pi handles pi's conversation branching
- **Theme Systems**: Several extensions support theming with import/export
- **Keyboard-First Design**: All TUI extensions prioritize keyboard navigation

### Information Gaps

Could not retrieve detailed information for:
- `@zenobius/pi-footer` (npm page forbidden)
- `pi-usage-bars` (npm page forbidden)
- `@jademind/pi-visual` (npm page forbidden)
- `claudemon` (npm page forbidden, no search results)
