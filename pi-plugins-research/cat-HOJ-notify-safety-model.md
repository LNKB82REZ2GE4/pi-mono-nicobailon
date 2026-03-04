# Pi Coding Agent Plugins Research - Categories H, O, J

**Research Date:** 2026-02-26

This document covers notifications/alerts, safety/guardrails, and model/provider management plugins for the Pi coding agent.

---

## Category H - Notifications / Alerts

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **pi-notify** | Notifications | extension | Desktop notifications for Pi agent via OSC 777/99/9 and Windows toast | Sends native desktop notification when agent finishes and is waiting for input. Supports Ghostty (OSC 777), iTerm2 (OSC 9), WezTerm (OSC 777), Kitty (OSC 99), tmux (passthrough), Windows Terminal (PowerShell toast). Optional custom sound via `PI_NOTIFY_SOUND_CMD` env var. | pi-coding-agent | By ferologics. Click notification to focus terminal. tmux requires `set -g allow-passthrough on`. No Terminal.app or Alacritty support. |
| **@rbright/pi-notify-desktop** | Notifications | extension | OSC desktop notifications for Pi agent turn completion | Triggers on final assistant `message_end` (non-tool stop reasons). Falls back to `agent_end` if message-based completion missed. Writes OSC to `/dev/tty` first, then stdout. Auto-selects protocol: iTerm2/WezTerm -> OSC 9, Ghostty -> OSC 777. Supports zellij. | @mariozechner/pi-coding-agent | By Ryan Bright. No config required. Supports tmux with passthrough. Zellij works with parent terminal context. |
| **@rbright/pi-notify-koko** | Notifications | extension | Koko voice notifications for Pi agent turn completion | Uses Koko TTS CLI to speak the last assistant response text when agent completes. Strips markdown/link formatting, wrapper symbols, and emojis before speaking. Per-agent dedupe. | @mariozechner/pi-coding-agent, @rbright/pi-notify-core, koko CLI | By Ryan Bright. Requires koko CLI installed. Configurable via env vars: `PI_NOTIFY_KOKO_ENABLED`, `PI_NOTIFY_KOKO_VOICE`, `PI_NOTIFY_KOKO_COMMAND`, etc. |
| **pi-poly-notify** | Notifications | extension | Highly configurable desktop/sound/Pushover notifications when Pi agent turn finishes | Sends notifications when agent turn finishes and took longer than configurable threshold. Supports macOS desktop popups (osascript), sounds (afplay), and Pushover notifications (for Apple Watch/iOS). Config file at `~/.pi/agent/extensions/poly-notify/notify.json`. | @mariozechner/pi-coding-agent, @mariozechner/pi-tui | By w-winter. macOS-only out of box. Has `/notify` command and `Alt+N` shortcut. Pushover requires `curl` + userKey/apiToken in config. |
| **@marcfargas/pi-heartbeat** | Notifications | extension | Non-blocking timers and heartbeats for Pi agents - stop using sleep | Provides `timer` tool (one-shot wake-up after N seconds) and `heartbeat` tool (periodic wake-up every N seconds). Also intercepts blocking `sleep` commands. Includes `/cancel-timer` command. | @mariozechner/pi-coding-agent >=0.50.0 | Timer range: 1-3600 seconds. Heartbeat interval: 10-3600 seconds. Only one heartbeat at a time. Sleep interceptor blocks when sleep is only/last command. |
| **pi-caffeinate** | Notifications | extension | Keeps machine awake while agent is working (macOS, Linux, Windows) | Prevents idle sleep while agent is actively running. Uses platform-specific mechanisms: macOS (caffeinate -i), Linux (systemd-inhibit), Windows (SetThreadExecutionState). Display sleep and lid-close unaffected. | @mariozechner/pi-coding-agent | By georgebashi. Cross-platform. Linux requires systemd-inhibit (silently no-ops if unavailable). Only affects idle sleep, not display/lid sleep. |

---

## Category O - Safety / Guardrails

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **@aliou/pi-guardrails** | Safety | extension | Security hooks to prevent potentially dangerous operations | Two main features: (1) `protect-env-files` - blocks access to `.env` files except `.example`/`.sample`/`.test`; (2) `permission-gate` - prompts for confirmation on dangerous commands (rm -rf, sudo, dd, mkfs, chmod -R 777, etc.). Uses structural shell parsing via `@aliou/sh` to avoid false positives. Config at `~/.pi/agent/extensions/guardrails.json` or `.pi/extensions/guardrails.json`. | pi-coding-agent | By aliou. Has `/guardrails:settings` command for interactive config UI. Patterns support glob or regex. Emits `guardrails:blocked` events. Migrated `preventBrew`, `preventPython`, `enforcePackageManager` to separate `@aliou/pi-toolchain` extension. |
| **@hyperprior/pi-safety** | Safety | extension | Confirmation and protection layer for dangerous git/bash/edit/write actions | Safety guardrails for dangerous commands and protected paths. | @mariozechner/pi-coding-agent, @sinclair/typebox, @hyperprior/pi-shared | By hyperprior. Part of @hyperprior monorepo. Minimal docs available. |
| **pi-mdc-rules** | Safety | extension | MDC rules extension - loads and enforces rules from Markdown files | Loads rules from `.agents/rules/*.md` with YAML frontmatter. Three trigger types: `always_on` (injected every turn), `glob` (blocks read/write/edit until rule read), `model_decision` (listed as available guidance). Has `/mdc` command to create rules interactively with AI assistance. | @mariozechner/pi-coding-agent | By mlevif. Rules re-read from disk every turn. Glob trigger uses frontmatter `globs` field (supports comma-separated or YAML array). Good for project-specific coding conventions. |

---

## Category J - Model / Provider Management

| Package | Category | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|----------|------|-------------|-------------------|---------------------------|-------|
| **pi-model-switch** | Model Mgmt | extension | Model switching extension - gives agent ability to list, search, and switch models on its own | Provides `switch_model` tool with actions: list, search, switch. Agent can respond to requests like "switch to a cheaper model" or "use Claude for this task". Supports model aliases via `aliases.json` config (string value or fallback chain array). | pi-coding-agent | By nicopreme. Search matches by provider, id, or name. Supports AGENTS.md preferences. Alias example: `"cheap": ["openai/gpt-5-mini", "google/gemini-2.5-flash"]`. |
| **pi-kimi-coder** | Provider | extension | Pi extension for Kimi K2 Coding Plan - OAuth-based provider with kimi-for-coding model | Adds "kimi-coder" provider for Moonshot AI's subscription-based Coding Plan (unlimited fair-use). OAuth device flow via `/login kimi-coder`. Auto-imports credentials from kimi-cli (`~/.kimi/credentials/`). Auto token refresh every 10 min. Models: `kimi-for-coding` (K2.5, 262K context), `kimi-k2.5`. | @mariozechner/pi-coding-agent, @mariozechner/pi-ai | By picassio. Uses `zai` thinking format. 262K context, 32K max output. Costs show as $0 (subscription). Shares credentials bidirectionally with kimi-cli. Different from pi-moonshot (pay-per-token). |
| **@jasonish/pi-default-model** | Model Mgmt | extension | Set a real default model - saves current model + thinking level as startup default | Commands: `/set-default-model` (global), `/set-project-default-model` (project). Stores `startupModel` in settings with model and thinkingLevel. Also has `/startup-model [show\|clear]` command. | @mariozechner/pi-coding-agent, @mariozechner/pi-ai | By Jason Ish. Settings stored in `~/.pi/agent/settings.json` (global) or `.pi/settings.json` (project). Reads legacy string form too. |
| **pi-model-sysprompt-appendix** | Model Mgmt | extension | Append model-specific content to Pi system prompt before Project Context | Config at `~/.pi/agent/extensions/model-sysprompt-appendix/model-sysprompt-appendix.json`. Fields: `includeModelLine`, `default` (for non-matched models), `exact` (map of provider/model-id to content). Useful for model-specific calibration/identity steering. | @mariozechner/pi-coding-agent | By w-winter. Commands: `/model-sysprompt-appendix reload`, `/model-sysprompt-appendix status`. Appendix injected on `before_agent_start`. Default only used when no exact match. |
| **pi-model-aware-compaction** | Model Mgmt | extension | Per-model context-usage thresholds for Pi's built-in auto-compaction | Different models have different context windows and performance profiles near limits. Config with `global` threshold and `models` overrides (supports `*` wildcards). Triggers Pi's native compaction pipeline at right time. | @mariozechner/pi-coding-agent >=0.51.0 | By w-winter. Requires `compaction.enabled: true` in settings. May need to lower `reserveTokens` to let model-aware thresholds take priority. Preserves native compaction UX. |
| **@hyperprior/pi-model-roles** | Model Mgmt | extension | Role-based model switching utility | Provides `/hyper-role` command for model role selection. | @mariozechner/pi-coding-agent, @mariozechner/pi-ai, @sinclair/typebox | By hyperprior. Part of @hyperprior monorepo. Minimal docs. |
| **pi-codex-profile** | Model Mgmt | extension | Codex profile extension - Codex model presets + apply_patch tool | Auto-injects Codex operating profile to system prompt when Codex model active. Includes tool-first behavior, autonomy, cleaner editing workflow, safer behavior guidance. Also adds `apply_patch` tool for Codex-style patches (Add/Update/Delete File). | pi-coding-agent, TypeScript | By Graffioh. Works only when current model recognized as Codex. Paths restricted to cwd. Patches use `*** Begin Patch`, `*** Update File:`, `*** Delete File:`, `*** End Patch` format. |
| **pi-moonshot** | Provider | extension | Pi extension adding Moonshot AI provider with Kimi K2.5 and other models | Adds "moonshot" provider. Models: `kimi-k2.5` (262K, reasoning), `kimi-latest` (131K), `kimi-k2-turbo-preview` (262K), `kimi-k2-thinking` (262K, reasoning), `moonshot-v1-8k/32k/128k` (legacy). Requires `MOONSHOT_API_KEY`. | @mariozechner/pi-coding-agent >=0.53.0 | By default-anton. Pay-per-token via api.moonshot.ai. Different from pi-kimi-coder (subscription plan). Use both simultaneously - they register different providers. |
| **pi-nvidia-nim** | Provider | extension | NVIDIA NIM API provider - access 100+ models from build.nvidia.com | Registers "nvidia-nim" provider. 39+ curated models: DeepSeek V3.2, Kimi K2.5, MiniMax M2.1, GLM-5, GLM-4.7, Qwen3, Llama 4, Mistral, etc. Custom streaming wrapper for thinking support via `chat_template_kwargs`. Auto-discovers new models from API. | @mariozechner/pi-ai, @mariozechner/pi-coding-agent | By xRyul. Requires `NVIDIA_NIM_API_KEY` (nvapi-xxx). Free during preview (rate-limited). All costs $0. Handles thinking via non-standard kwargs per model. Maps "minimal" to "low". Uses `system` role instead of `developer`. |
| **pi-prompt-template-model** | Model Mgmt | extension | Prompt templates on steroids - adds model, skill, thinking frontmatter to templates | Create specialized agent modes that switch to right model, set thinking level, inject skill, then auto-restore. Frontmatter: `model` (required), `skill`, `thinking`, `restore`. Supports model fallback chains. Has `/chain-prompts` for sequential template execution. | pi-coding-agent | By nicopreme. Model can be bare ID (auto-select provider) or `provider/model`. Skill resolves to project then user SKILL.md. Auto-restore previous model after response. Autocomplete shows model/skill info. |
| **pi-pai-lite** | Model Mgmt | extension | Structured thinking modes and lightweight persistent memory for pi | Inspired by Daniel Miessler's PAI. Two tools: `think` (structured thinking with 4 modes: council, red_team, first_principles, be_creative) and `memory` (3 markdown files: preferences.md, learnings.md, context.md). Commands: `/council`, `/redteam`, `/firstprinciples`, `/creative`, `/pai`. | @mariozechner/pi-coding-agent, @mariozechner/pi-ai, @sinclair/typebox | By coctostan. Think tool returns scaffold - LLM fills it in same turn (no extra API calls). Auto-routes mode via keywords. Memory loaded on demand. Every response ends with Success Criteria checklist. |

---

## Summary of Patterns

### Notification Extensions

1. **OSC Protocol Diversity**: Multiple packages solve the same problem (desktop notifications) with different OSC protocol support:
   - OSC 777: Ghostty, WezTerm, rxvt-unicode
   - OSC 9: iTerm2, WezTerm
   - OSC 99: Kitty
   - Windows toast for Windows Terminal

2. **Event-Based Triggering**: All notification extensions trigger on `agent_end` or `message_end` events, showing notifications when the agent finishes and waits for input.

3. **Sound Customization**: Several packages support custom sounds via environment variables or config files (pi-notify, pi-poly-notify).

4. **TTS Integration**: @rbright/pi-notify-koko demonstrates voice notifications using the Koko CLI, speaking the assistant's response.

5. **Non-Blocking Patterns**: @marcfargas/pi-heartbeat introduces non-blocking timers/heartbeats to replace blocking `sleep` calls, keeping the session interactive during waits.

### Safety/Guardrails Extensions

1. **Two Main Approaches**:
   - **Tool Interception**: @aliou/pi-guardrails intercepts tools like read, write, edit, bash to block dangerous operations
   - **Rule Injection**: pi-mdc-rules loads project-specific rules from markdown files with different trigger types

2. **Config Flexibility**: Guardrails support both global and project-level configs with merge behavior.

3. **Shell Parsing**: @aliou/pi-guardrails uses AST-based shell parsing to avoid false positives from keywords in commit messages, grep patterns, etc.

4. **Rule Trigger Types** (pi-mdc-rules):
   - `always_on`: Injected every turn
   - `glob`: Blocks file operations until rule read
   - `model_decision`: Available guidance, agent reads on demand

### Model/Provider Management Extensions

1. **Provider Registration Pattern**: Several packages register custom providers using `pi.registerProvider()` with custom streaming wrappers:
   - pi-kimi-coder: kimi-coder provider (OAuth, subscription)
   - pi-moonshot: moonshot provider (API key, pay-per-token)
   - pi-nvidia-nim: nvidia-nim provider (free preview, 100+ models)

2. **Model Switching Approaches**:
   - **Agent-Controlled**: pi-model-switch gives the agent a tool to switch models
   - **Template-Controlled**: pi-prompt-template-model bundles model/skill/thinking into prompt templates
   - **Role-Based**: @hyperprior/pi-model-roles for role-based switching

3. **System Prompt Customization**:
   - pi-model-sysprompt-appendix: Per-model content injection
   - pi-codex-profile: Auto-inject profile when Codex active
   - pi-pai-lite: Structured thinking scaffolds

4. **Context Management**:
   - pi-model-aware-compaction: Per-model compaction thresholds
   - pi-pai-lite: Lightweight persistent memory files

5. **Authentication Patterns**:
   - OAuth device flow (pi-kimi-coder)
   - API key environment variables (pi-moonshot, pi-nvidia-nim)
   - Credential sharing with CLI tools (pi-kimi-coder <-> kimi-cli)

6. **Thinking/Reasoning Support**: Several providers handle non-standard thinking parameters:
   - pi-nvidia-nim: Uses `chat_template_kwargs` instead of `reasoning_effort`
   - pi-kimi-coder: Uses `zai` thinking format with `reasoning_content` field

### Common Dependencies

- **@mariozechner/pi-coding-agent**: Required peer dependency for almost all extensions
- **@mariozechner/pi-ai**: Required for extensions that interact with AI models/providers
- **@sinclair/typebox**: Used by @hyperprior packages for schema validation

### Configuration Patterns

1. **Config File Locations**:
   - Global: `~/.pi/agent/extensions/<name>/<name>.json`
   - Project: `.pi/extensions/<name>.json`
   - Settings: `~/.pi/agent/settings.json` or `.pi/settings.json`

2. **Environment Variables**: Common pattern for API keys and optional behavior customization (e.g., `NVIDIA_NIM_API_KEY`, `PI_NOTIFY_SOUND_CMD`, `PI_NOTIFY_KOKO_VOICE`).

3. **Commands**: Most extensions register slash commands for user interaction (`/notify`, `/guardrails:settings`, `/mdc`, `/model-sysprompt-appendix reload`, etc.).
