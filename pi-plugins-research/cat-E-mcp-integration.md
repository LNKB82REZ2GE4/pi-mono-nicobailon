# Category E: MCP / Service Integration Packages

Research conducted: 2026-02-26

## Summary Table

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **pi-mcp-adapter** | Extension | MCP (Model Context Protocol) adapter for Pi - use MCP servers without burning context window | Single `mcp` proxy tool (~200 tokens) instead of hundreds; lazy server connections; tool metadata caching; direct tools option; lifecycle modes (lazy/eager/keep-alive) | `@modelcontextprotocol/sdk`, `@sinclair/typebox`, `zod` (peer) | By Nico Bailon. Solves the MCP token bloat problem. Config in `~/.pi/agent/mcp.json`. Supports stdio and HTTP transports, OAuth. |
| **pi-tidy-mcp-adapter** | Extension | Fork of pi-mcp-adapter with additional features | Same as pi-mcp-adapter - MCP adapter with lazy loading, tool discovery, proxy pattern | `@modelcontextprotocol/sdk`, `@sinclair/typebox`, `zod` (peer) | By VandeePunk. Fork of nicobailon's pi-mcp-adapter. Tagged `pi-package`. |
| **@jademind/pi-bridge** | Extension | Minimal secure inbox bridge for Pi - reliable queued/steering message delivery to running sessions | File-based inbox watching; signed/structured message envelopes; challenge-based delivery modes (queued/interrupt); delivery acknowledgements; rate limiting; TTL enforcement | `@mariozechner/pi-coding-agent` (peer) | By Jademind. Designed for pi-statusbar macOS app. Uses `~/.pi/agent/statusbridge/` for inbox/acks. Config via `PI_BRIDGE_*` env vars. |
| **pi-messenger-bridge** | Extension | Bridge common messengers (Telegram, WhatsApp, Slack, Discord) into Pi | Multi-messenger support; challenge-based authentication; trusted user management; live status widget; tool call visibility for remote users; persistent config | `node-telegram-bot-api`, `@whiskeysockets/baileys`, `@slack/bolt`, `discord.js`, `qrcode-terminal` | By tintinweb. Remote users interact with Pi via messenger apps. Config at `~/.pi/msg-bridge.json`. |
| **@e9n/pi-supabase** | Extension | Supabase integration - read-only queries, table subscriptions, pi-channels notifications | `supabase` tool with query/describe/count/rpc actions; realtime subscriptions via pi-channels; dual key support (anon/service role); optional query audit via pi-kysely | `@supabase/supabase-js`, `@mariozechner/pi-coding-agent` (peer), `@sinclair/typebox` (peer) | By Espen Nilsen. RPC allow-list for security. Notifications for table changes. |
| **@e9n/pi-kysely** | Extension | Shared Kysely database registry - single managed DB connection for all extensions | Multi-driver (SQLite/PostgreSQL/MySQL); table-level RBAC; migration system with checksum integrity; event bus API (`kysely:*` events) | `kysely`, `better-sqlite3`, `pg`, `mysql2`, `@mariozechner/pi-coding-agent` (peer) | By Espen Nilsen. Extensions interact via events, no direct import. Used by pi-supabase for query logging. |
| **@e9n/pi-github** | Extension | GitHub integration via `gh` CLI - PR management, issue tracking, CI status | List/manage PRs, issues, notifications; create/merge PRs; automated PR review fix flow (fetch threads -> fix -> resolve); workflow runs | `gh` CLI (external, must be authenticated) | By Espen Nilsen. All commands as `/gh-*` or `/github-*`. PR fix workflow for automated review resolution. |
| **@e9n/pi-gmail** | Extension | Gmail integration via Gmail API - read, search, compose, send emails | 16 actions (search, read, compose, reply, archive, label, etc.); attachment downloads; background polling notifications; OAuth via pi-webserver | Google OAuth credentials required, `@sinclair/typebox` (peer) | By Espen Nilsen. Web UI at `/gmail` when pi-webserver running. Config in settings.json. |
| **@e9n/pi-npm** | Extension | NPM workflow extension - run common npm commands including publish | 15 actions (init, install, run, test, build, publish, pack, version, etc.); safe dry-run mode; custom working directory; truncated output (8000 chars) | `@mariozechner/pi-coding-agent` (peer), `@sinclair/typebox` (peer) | By Espen Nilsen. Single `npm` tool with action parameter. `dry_run: true` adds `--dry-run` to publish/pack/version. |
| **@e9n/pi-vault** | Extension | Obsidian vault integration - read, write, search, manage notes | 16 actions (read, write, append, patch, search, dataview, daily notes, templates, frontmatter, etc.); API-first with filesystem fallback; web dashboard at `/vault` | Obsidian Local REST API plugin (optional), `OBSIDIAN_API_KEY` env var | By Espen Nilsen. Deep links to open notes in Obsidian. Requires pi-webserver for dashboard. |
| **kimicodeprovider** | Extension | Kimi/Moonshot API provider for Pi | Registers `moonshot` provider with Kimi models (kimi-for-coding, kimi-k2.5, kimi-latest, etc.); configurable base URL; custom User-Agent | `MOONSHOT_API_KEY` env var required | By xiezhaopan. Uses Kimi Code API endpoint (`api.kimi.com/coding/v1`). Models include coding-optimized and reasoning variants. |
| **pi-messenger** | Extension + Skills | Inter-agent messaging and file reservation system for multi-agent coordination | Agent presence/discovery; messaging (DM/broadcast); file reservations with blocking; stuck detection; activity feed; crew task orchestration (plan/work/review); chat overlay | No external dependencies - file-based coordination | By Nico Bailon. Includes crew agents for parallel task execution. Config at `~/.pi/agent/pi-messenger.json`. Swarm mode for spec-based tasks. |

---

## Pattern Analysis

### 1. **MCP Integration Patterns**

Two packages focus specifically on MCP integration:
- **pi-mcp-adapter** (original) and **pi-tidy-mcp-adapter** (fork) both solve the "MCP token bloat" problem
- Key innovation: Single proxy tool (~200 tokens) instead of exposing all MCP tools directly
- Lazy loading pattern: servers connect only when needed
- Metadata caching: search/describe work without live connections
- `directTools` option for promoting specific tools to first-class Pi tools

### 2. **External Service Bridges**

Three packages bridge external communication channels:
- **@jademind/pi-bridge**: File-based inbox for status bar/mobile clients
- **pi-messenger-bridge**: Multi-messenger (Telegram, WhatsApp, Slack, Discord)
- **pi-messenger**: Inter-agent coordination within Pi itself

Common patterns:
- Challenge-based authentication
- Rate limiting
- Persistent configuration
- Status/heartbeat systems

### 3. **@e9n Package Suite**

Espen Nilsen (@e9n) has created a cohesive suite of 6 extensions:
- **pi-kysely**: Foundation layer - shared database registry with RBAC
- **pi-supabase**: Uses pi-kysely for optional query logging
- **pi-github**: Requires external `gh` CLI
- **pi-gmail**: OAuth via pi-webserver
- **pi-npm**: Simple npm wrapper
- **pi-vault**: Obsidian integration

Patterns across the suite:
- Event bus communication (pi-kysely)
- Settings in `~/.pi/agent/settings.json`
- `pi-package` keyword
- MIT license
- TypeBox for schema validation

### 4. **LLM Provider Extensions**

- **kimicodeprovider**: Adds Moonshot/Kimi API support
- Pattern: Register provider with model list, API key via env var
- Configurable base URL for proxies/enterprise deployments

### 5. **Common Dependencies**

| Dependency | Purpose | Packages Using |
|------------|---------|----------------|
| `@sinclair/typebox` | Schema validation | Most extensions |
| `@mariozechner/pi-coding-agent` | Pi SDK (peer dep) | Most extensions |
| `@modelcontextprotocol/sdk` | MCP protocol | MCP adapters |
| `zod` | Schema validation (peer) | MCP adapters |

### 6. **Configuration Patterns**

- Global config: `~/.pi/agent/settings.json` or `~/.pi/agent/<package>.json`
- Project config: `.pi/settings.json` or `.pi/<package>.json`
- Environment variables for secrets (API keys, tokens)
- `env:VAR_NAME` syntax in settings for env var references

### 7. **Extension Types**

All packages in this category are **extensions** (not themes or prompt templates):
- Extensions provide tools, commands, and event handlers
- Some include skills (pi-messenger includes crew skills)
- Configuration via JSON files

### 8. **Security Considerations**

- File permissions (chmod 600/700) for config files
- OAuth flows for external services (Gmail, GitHub via gh CLI)
- API key management via environment variables
- Rate limiting for messaging bridges
- TTL and path safety for inbox systems

---

## Installation Commands

```bash
# MCP Integration
pi install npm:pi-mcp-adapter
pi install npm:pi-tidy-mcp-adapter

# Service Bridges
pi install npm:@jademind/pi-bridge
pi install npm:pi-messenger-bridge
pi install npm:pi-messenger

# @e9n Suite
pi install npm:@e9n/pi-supabase
pi install npm:@e9n/pi-kysely
pi install npm:@e9n/pi-github
pi install npm:@e9n/pi-gmail
pi install npm:@e9n/pi-npm
pi install npm:@e9n/pi-vault

# LLM Provider
pi install npm:kimicodeprovider
```

---

## Recommendations

1. **For MCP usage**: Start with `pi-mcp-adapter` - it's the original and well-maintained
2. **For multi-agent work**: `pi-messenger` provides comprehensive coordination features
3. **For database needs**: `@e9n/pi-kysely` as foundation, `@e9n/pi-supabase` for Supabase projects
4. **For GitHub workflows**: `@e9n/pi-github` if you use `gh` CLI
5. **For remote access**: `pi-messenger-bridge` for messenger integration, `@jademind/pi-bridge` for status bar
