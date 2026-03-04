# Miscellaneous / Specialized Pi Packages Research

**Research Date:** 2026-02-27

## Package Summary Table

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **pi-ask-user** | Extension + Skill | Interactive ask_user tool for pi-coding-agent with multi-select and freeform input UI | Single/multi-select options, freeform responses, context display, bundled ask-user skill for decision-gating | `@sinclair/typebox`, `@mariozechner/pi-tui`, `@mariozechner/pi-coding-agent` | Tool name: `ask_user`. Bundled skill mandates agent to ask user for high-stakes decisions. GitHub: edlsh/pi-ask-user |
| **pi-ask-tool-extension** | Extension | Ask tool extension for pi with tabbed questioning and inline note editing | Structured options with IDs, single + multi-select, tab-based multi-question flow, inline note editing, automatic "Other" option handling | `@sinclair/typebox`, `@mariozechner/pi-tui`, `@mariozechner/pi-coding-agent` | Tool name: `ask`. Similar to pi-ask-user but different API design. GitHub: devkade/pi-ask-tool |
| **@tryinget/pi-extensions-template_copier** | CLI Tool / Template | Copier template + CLI for bootstrapping production-ready pi extension repositories | Generates extension scaffold with governance docs, quality gates (Biome), interview-first startup flow, release automation, vouch trust gate | Node.js >=20, `copier` installed | Includes `new-pi-extension-repo` and `npm-bootstrap-publish` CLIs. Comprehensive template with CI/CD workflows. GitHub: tryingET/pi-extensions-template_copier |
| **@ogulcancelik/pi-sketch** | Extension | Quick sketch pad for pi - draw in browser, send to models | Browser-based canvas drawing, clipboard paste (Ctrl+V), color/brush options, undo, sends sketch as attachment | `@mariozechner/pi-coding-agent` | Command: `/sketch`. Useful for visual communication with the agent. GitHub: ogulcancelik/pi-sketch |
| **pi-powerpoint** | Skill | Pi skill for creating and editing PowerPoint files via CLI, wrapping office-powerpoint-mcp-server | Create presentations, add slides/text/images/tables/charts, apply themes, extract text, batch mode for multi-step workflows | Bun runtime, `uv` (Python), mcporter | Uses MCP server under the hood. Has batch runner to work around upstream state bugs. GitHub: tmustier/powerpoint-cli |
| **@e9n/pi-myfinance** | Extension | Personal finance tracking extension for pi | Accounts, transactions, budgets, goals, recurring expenses, reports, insights, bank statement import (DNB, SAS, Amex), web dashboard | `better-sqlite3`, `read-excel-file`, `@mariozechner/pi-ai`, `@sinclair/typebox`, `@mariozechner/pi-coding-agent` | Tool name: `finance`. Multiple commands like `/finance-accounts`, `/finance-summary`. Web UI at `/finance`. GitHub: espennilsen/pi |
| **@marcfargas/go-easy** | Skill + Library | Google APIs made easy - Gmail, Drive, Calendar for AI agents and humans | Gmail (search, send, reply), Drive (upload, download, share), Calendar (events, freebusy), Tasks, OAuth2 management, safety gates for destructive ops | `@googleapis/drive`, `@googleapis/gmail`, `@googleapis/calendar`, `@googleapis/tasks`, `google-auth-library`, `marked` | Has own auth system in `~/.go-easy/`. CLI tools: `go-gmail`, `go-drive`, `go-calendar`. Safety model: READ/WRITE/DESTRUCTIVE levels. GitHub: marcfargas/go-easy |
| **pi-package-test** | pi-package (multi-type) | Test/reference package demonstrating pi's package system features | Includes extensions, skills, themes, prompts. Demonstrates glob patterns, bundled dependencies, user-side filtering | `shitty-extensions` (bundled), `@sinclair/typebox`, `@mariozechner/pi-ai`, `@mariozechner/pi-tui`, `@mariozechner/pi-coding-agent` | Reference implementation for package authors. Shows how to bundle other packages. GitHub: badlogic/pi-package-test |
| **@benvargas/pi-ancestor-discovery** | Extension | Recursive ancestor discovery for pi resources (skills, prompts, themes) | Uses `resources_discover` hook to walk upward from cwd, finds `.pi/skills`, `.agents/skills` at ancestor levels, configurable boundary | `@mariozechner/pi-coding-agent` | Default: skills enabled, prompts/themes disabled. Configurable via JSON. GitHub: ben-vargas/pi-packages |
| **@benvargas/pi-antigravity-image-gen** | Extension | Google Antigravity image generation tool using Gemini 3 Pro Image model | Generate images from text prompts, multiple aspect ratios, inline terminal rendering, endpoint fallback, quota checking | `@sinclair/typebox`, `@mariozechner/pi-ai`, `@mariozechner/pi-coding-agent` | Tools: `generate_image`, `image_quota`. Requires `/login` with google-antigravity. GitHub: ben-vargas/pi-packages |
| **@yevhen.b/bo-pi** | Extension | Tool preflight approvals for Pi - "YOLO mode done right" | Human-readable tool summaries, three approval modes (all/destructive/off), plain-language permission rules, Ctrl+E for explanations, rule suggestions with Tab | `ignore`, `@mariozechner/pi-ai`, `@mariozechner/pi-agent-core`, `@mariozechner/pi-coding-agent` | Command: `/preflight`. Conflict detection for rules. Session vs persistent rules. GitHub: yevhen/bo-pi |
| **@tmustier/pi-skill-creator** | Skill | Skill-creation guidelines for Pi (Agent Skills format) | Templates and guidelines for creating skills that follow Agent Skills format | None (pure skill) | Lightweight - just skill documentation/templates. GitHub: tmustier/pi-extensions |
| **@juanibiapina/pi-extension-settings** | Extension | Centralized settings management across extensions | `/extension-settings` command with interactive UI, `getSetting()`/`setSetting()` helpers, persistent storage | `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui` | Must load BEFORE extensions that register settings. Storage: `~/.pi/agent/settings-extensions.json`. GitHub: juanibiapina/pi-extension-settings |
| **pi-read-many** | Extension | Batch file reads for Pi via read_many with adaptive packing under output limits | Reads up to 26 files in one call, sequential order, heredoc block output format, adaptive packing strategies, error handling | `@sinclair/typebox`, `@mariozechner/pi-coding-agent` | Tool name: `read_many`. Uses heredoc delimiters with collision avoidance. GitHub: Gurpartap/pi-read-many |

---

## Patterns and Observations

### 1. Extension vs Skill Distinction

- **Extensions** add tools/commands and require TypeScript/JavaScript code with peer dependencies on `@mariozechner/pi-coding-agent` and often `@mariozechner/pi-tui`
- **Skills** are pure markdown documentation (SKILL.md) that guide agent behavior without adding tools
- Some packages bundle both (e.g., `pi-ask-user` has both extension and skill)

### 2. Common Peer Dependencies

Most extensions require:
- `@mariozechner/pi-coding-agent` (core)
- `@mariozechner/pi-tui` (for UI components)
- `@sinclair/typebox` (for schema validation)

### 3. Configuration Patterns

Three common patterns:
1. **Environment variables** (e.g., `PI_IMAGE_SAVE_DIR`)
2. **JSON config files** in `.pi/extensions/` or `~/.pi/agent/extensions/`
3. **Settings integration** via `@juanibiapina/pi-extension-settings`

### 4. Auth Handling

- Some packages use pi's built-in `/login` OAuth flow (e.g., `@benvargas/pi-antigravity-image-gen`)
- Others manage their own auth (e.g., `@marcfargas/go-easy` with `~/.go-easy/`)

### 5. Safety/Approval Patterns

- Several packages implement safety gates for destructive operations
- `@yevhen.b/bo-pi` is specifically designed for tool preflight approvals
- `@marcfargas/go-easy` has READ/WRITE/DESTRUCTIVE levels

### 6. MCP Integration

- `pi-powerpoint` wraps an MCP server (`office-powerpoint-mcp-server`) via mcporter
- This is a pattern for bringing MCP capabilities into pi

### 7. Package Bundling

- `pi-package-test` demonstrates how to bundle other pi packages using `bundledDependencies`
- Resources from bundled packages can be referenced via `node_modules/...` paths

### 8. Hook Usage

- `@benvargas/pi-ancestor-discovery` uses the `resources_discover` hook (pi v0.51.0+)
- Hooks allow extending core agent behavior

### 9. Two Similar "Ask" Packages

- `pi-ask-user` and `pi-ask-tool-extension` solve similar problems with different APIs
- `pi-ask-user`: `ask_user` tool with `question`, `options`, `allowMultiple`, `allowFreeform`
- `pi-ask-tool-extension`: `ask` tool with `questions` array, tab-based UI, inline notes

### 10. Utility/Frontier Packages

- `@tryinget/pi-extensions-template_copier` - for package authors
- `@juanibiapina/pi-extension-settings` - cross-extension settings management
- `@benvargas/pi-ancestor-discovery` - resource discovery enhancement

---

## Installation Commands Reference

```bash
# Interactive user input
pi install npm:pi-ask-user
pi install npm:pi-ask-tool-extension

# Development tools
pi install npm:@tryinget/pi-extensions-template_copier
pi install npm:@juanibiapina/pi-extension-settings

# Visual/sketch
pi install npm:@ogulcancelik/pi-sketch

# Document creation
pi install npm:pi-powerpoint

# Personal finance
pi install npm:@e9n/pi-myfinance

# Google APIs
pi install npm:@marcfargas/go-easy

# Image generation
pi install npm:@benvargas/pi-antigravity-image-gen

# Tool approvals
pi install npm:@yevhen.b/bo-pi

# Skill creation
pi install npm:@tmustier/pi-skill-creator

# Resource discovery
pi install npm:@benvargas/pi-ancestor-discovery

# Batch file reading
pi install npm:pi-read-many

# Reference package (for learning)
pi install npm:pi-package-test
```
