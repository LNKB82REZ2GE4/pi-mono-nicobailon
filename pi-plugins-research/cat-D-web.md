# Category D: Web / Browser Packages

Research conducted: 2026-02-26

## Package Overview Table

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **pi-web-access** | Extension | Web search, content extraction, and video understanding with zero-config Chrome integration | - `web_search` via Perplexity/Gemini with fallback chain<br>- `fetch_content` for URLs (GitHub cloning, YouTube, PDFs, local video)<br>- `get_search_content` for stored results<br>- Video frame extraction (ffmpeg/yt-dlp)<br>- GitHub repo cloning<br>- YouTube video understanding via Gemini | - Chrome (macOS) for zero-config<br>- Optional: `PERPLEXITY_API_KEY`, `GEMINI_API_KEY`<br>- Optional: `ffmpeg`, `yt-dlp` for video frames<br>- Pi v0.37.3+ | Most feature-complete web extension; zero-config with Chrome cookies; smart fallback chains for all operations |
| **pi-web-tools** | Extension | Lightweight web search and content extraction using Exa AI | - `web_search` via Exa with snippet extraction<br>- `fetch_content` with Readability + Jina Reader fallback<br>- `get_search_content` for stored results<br>- GitHub repo cloning via gh CLI or git | - `EXA_API_KEY` (required)<br>- Optional: `gh` CLI for GitHub<br>- Config: `~/.pi/web-tools.json` | Simpler alternative to pi-web-access; focused on Exa search provider |
| **@vaayne/pi-web-tools** | Extension | Basic web fetching and searching capabilities | - `fetch_content` - fetch and extract content from URLs<br>- `web_search` via Exa AI | - `jsdom` - HTML parsing<br>- `turndown` - HTML to Markdown<br>- Optional: `EXA_API_KEY` | Minimal implementation; fewer features than pi-web-tools above |
| **@hyperprior/pi-browser** | Extension | Lightweight page fetch + extraction helper (no real browser) | - `open`/`navigate` - fetch URL and cache extracted data<br>- `snapshot` - render concise page summary<br>- `extract` - return readable text<br>- `links` - list links from page<br>- `close` - clear session cache | - No external dependencies<br>- Not a real browser (HTTP fetch only) | Minimal browser-style interface; deterministic CLI workflows; no headless browser |
| **pi-agent-browser** | Extension | Real browser automation via agent-browser | - `browser` tool for LLM to drive real browser<br>- Navigate, inspect, interact (click, fill, press, scroll)<br>- Read text, get title/URL<br>- Screenshots (base64 inline for vision models)<br>- Auto-install agent-browser if missing | - `agent-browser` (auto-installed)<br>- Chromium (auto-downloaded)<br>- Vision-capable model recommended | Actually launches a real browser; screenshots for vision models; auto-cleanup on session shutdown |
| **pi-surf** | Extension | Web research with scout subagent for noise reduction | - `fetch_url` - clean Markdown via Readability+Turndown<br>- `web_search` via Brave (pluggable backend)<br>- `web_research` - scout subagent that searches, fetches, filters noise<br>- Auto-selects cheap scout model based on provider | - `BRAVE_API_KEY` (optional, free tier 2000/month)<br>- Pluggable search providers<br>- Custom providers via `~/.pi/agent/search-providers/` | Scout subagent keeps noise out of main context; auto-detects cheap model for scouting; pluggable search |
| **pi-parallel-web-search** | Extension | Web search via Parallel AI | - `web_search` tool powered by Parallel AI<br>- Accepts objective + multiple search queries<br>- Max 1-20 results | - `PARALLEL_API_KEY` (free $80 credits = ~16,000 searches)<br>- platform.parallel.ai | Simple single-purpose extension; Parallel AI specific |
| **@benvargas/pi-firecrawl** | Extension | Firecrawl REST API integration for web scraping | - `firecrawl_scrape` - scrape single URL<br>- `firecrawl_map` - discover URLs on site<br>- `firecrawl_search` - search web and optionally scrape<br>- Tool allowlist, configurable limits, client-side truncation | - Firecrawl API key from firecrawl.dev<br>- Config: `~/.pi/agent/extensions/firecrawl.json`<br>- Pi v0.51.0+ | Enterprise-grade scraping; multiple config sources (env vars, CLI flags, JSON); output truncation for context management |
| **@e9n/pi-webnav** | Extension | Unified navigation shell for pi-webserver | - Auto-discovers mounts from `/_api/mounts/dashboard`<br>- Iframe layout with persistent nav bar<br>- Hash-based routing (`#/tasks`, `#/calendar`)<br>- Live refresh polling for new/removed mounts | - Requires pi-webserver >= 0.1.0<br>- Pi v0.37.3+ | UI shell for pi-webserver ecosystem; works with other mounted extensions |
| **pi-web-utils** | Extension | Configurable web search, webpage fetching, GitHub cloning | - `web_search` with configurable engines (Google, DDG, SearXNG, custom)<br>- `fetch_webpage` - markdown.new first, then local conversion<br>- `clone_github_repo` - handles root/tree/blob URLs<br>- `search_local_repo` - uses `rg` or `grep` | - `@mozilla/readability`, `turndown`, `linkedom`<br>- Optional: `rg` for repo search<br>- Config: `~/.pi/web-tools.json` | Most configurable search; fallback chains; SearXNG support; local repo search with ripgrep |
| **@e9n/pi-webserver** | Extension | Shared HTTP server infrastructure for pi extensions | - Single shared port (default 4100)<br>- Basic auth + API bearer tokens<br>- Event-bus mount system for other extensions<br>- Built-in dashboard listing all mounts<br>- Cookie session auth for browser login | - No external dependencies<br>- Pi core peer dependency | Foundation for web-based extensions; other extensions mount via `web:mount` event; autostart option |
| **@e9n/pi-web-dashboard** | Extension | Live agent dashboard with SSE streaming | - Live SSE event stream (agent start/end, turns, tool calls)<br>- Prompt submission from browser (rate-limited 10/min/IP)<br>- Status endpoint for SSE client count<br>- Auto-cleanup on shutdown | - Requires pi-webserver<br>- Pi core peer dependency | Real-time monitoring; pairs with pi-webserver; browser-based prompt submission |

---

## Detailed Package Summaries

### pi-web-access
**npm:** https://www.npmjs.com/package/pi-web-access

The most comprehensive web extension for Pi. Features zero-config Chrome cookie extraction (macOS only) for Gemini access without API keys. Three main tools: `web_search`, `fetch_content`, `get_search_content`. Unique video understanding capability via Gemini - supports YouTube videos and local video files (MP4, MOV, WebM, AVI up to 50MB). Smart fallback chains ensure something always works (Perplexity -> Gemini API -> Gemini Web for search). GitHub URLs are cloned locally instead of scraped, giving the agent real file access. Includes bundled "librarian" skill for library research workflows.

### pi-web-tools
**npm:** https://www.npmjs.com/package/pi-web-tools

Lightweight alternative focused on Exa AI for search. Three tools with same names as pi-web-access but simpler implementation. Uses Mozilla Readability for content extraction with Jina Reader (`r.jina.ai`) fallback. GitHub cloning via `gh` CLI or `git clone`. Good choice if you already have Exa API key and don't need video features.

### @vaayne/pi-web-tools
**npm:** https://www.npmjs.com/package/@vaayne/pi-web-tools

Minimal implementation from Vaayne (who also maintains agent-kit). Only two tools: `fetch_content` and `web_search`. Uses jsdom and turndown for HTML parsing. Good for basic needs, fewer features than the unscoped pi-web-tools.

### @hyperprior/pi-browser
**npm:** https://www.npmjs.com/package/@hyperprior/pi-browser

Not a real browser - just HTTP fetch with browser-style API. Single `hyperpi_browser` tool with actions: open, navigate, snapshot, extract, links, close. Designed for deterministic CLI workflows where you don't need JavaScript rendering. Zero dependencies.

### pi-agent-browser
**npm:** https://www.npmjs.com/package/pi-agent-browser

Real browser automation using agent-browser (Puppeteer-based). Single `browser` tool with commands like `open`, `snapshot -i`, `click @e1`, `fill @e2 "text"`, `press Enter`, `scroll down`, `get text`. Screenshots returned as base64 for vision-capable models. Auto-installs agent-browser and Chromium on first use. Browser auto-closes on session shutdown.

### pi-surf
**npm:** https://www.npmjs.com/package/pi-surf

Features a "scout subagent" pattern - spawns a lightweight agent that searches, fetches, and filters content before returning only relevant info to main context. Three tools: `fetch_url`, `web_search`, `web_research`. Automatically selects cheap model for scouting (Haiku for Anthropic, GPT-4.1-mini for OpenAI, etc.). Pluggable search providers via files in `~/.pi/agent/search-providers/`. Brave Search built-in with free tier (2000/month).

### pi-parallel-web-search
**npm:** https://www.npmjs.com/package/pi-parallel-web-search

Single-purpose extension for Parallel AI web search. One `web_search` tool accepting objective + multiple queries. Parallel AI offers $80 free credits (~16,000 searches). Simple but locked to one provider.

### @benvargas/pi-firecrawl
**npm:** https://www.npmjs.com/package/@benvargas/pi-firecrawl

Enterprise-grade scraping via Firecrawl REST API. Three tools: `firecrawl_scrape`, `firecrawl_map`, `firecrawl_search`. Handles JavaScript rendering server-side. Configurable output truncation (default 51200 bytes, 2000 lines) with temp file fallback for large responses. Multiple config sources: JSON file, env vars, or CLI flags.

### @e9n/pi-webnav
**npm:** https://www.npmjs.com/package/@e9n/pi-webnav
**GitHub:** https://github.com/espennilsen/pi (extensions/pi-webnav)

Navigation shell that wraps pi-webserver mounts in persistent nav bar with iframe routing. Auto-discovers mounts from `/_api/mounts/dashboard`. Hash-based routing for deep links. Part of the @e9n web ecosystem by Espen Nilsen.

### pi-web-utils
**npm:** https://www.npmjs.com/package/pi-web-utils
**GitHub:** https://github.com/shantanugoel/pi-web-utils

Most configurable search extension. Supports Google, DuckDuckGo, SearXNG, and custom engines with fallback chains. Four tools: `web_search`, `fetch_webpage`, `clone_github_repo`, `search_local_repo`. Unique feature: tries markdown.new service first for webpage fetching, then local conversion. Local repo search uses ripgrep (`rg`) with grep fallback. By Shantanu Goel.

### @e9n/pi-webserver
**npm:** https://www.npmjs.com/package/@e9n/pi-webserver
**GitHub:** https://github.com/espennilsen/pi (extensions/pi-webserver)

Infrastructure extension providing shared HTTP server on single port (default 4100). Event-bus mount system - other extensions mount via `pi.events.emit("web:mount", ...)`. Supports Basic auth, API bearer tokens (full + read-only), and cookie session auth. Built-in dashboard at `/` listing all mounts. Foundation for web-based extension ecosystem.

### @e9n/pi-web-dashboard
**npm:** https://www.npmjs.com/package/@e9n/pi-web-dashboard
**GitHub:** https://github.com/espennilsen/pi (extensions/pi-web-dashboard)

Real-time dashboard with SSE streaming. Shows agent lifecycle events: agent_start, agent_end, turn_start, turn_end, tool_start, tool_end. Browser-based prompt submission (rate-limited 10/min/IP). Mounts at `/dashboard` on pi-webserver. Requires pi-webserver as dependency.

---

## Summary of Patterns

### 1. Three Tiers of Web Access

1. **Zero-config/Chrome-based** (pi-web-access): Uses Chrome session cookies for Gemini access without API keys. Best for users already signed into Google services.

2. **API-key based** (pi-web-tools, pi-parallel-web-search, @benvargas/pi-firecrawl): Requires specific API keys but offers more control and reliability.

3. **Self-hosted/Configurable** (pi-web-utils): Supports SearXNG and custom engines for privacy-conscious users or enterprise deployments.

### 2. Browser Automation Spectrum

- **HTTP fetch only** (@hyperprior/pi-browser): Fast, no JS rendering, no real browser
- **Full browser automation** (pi-agent-browser): Real Chromium, screenshots for vision models, actual DOM interaction
- **Hybrid** (pi-surf): Scout subagent that fetches and filters, keeping noise out of main context

### 3. Content Extraction Strategies

- **Readability + Turndown**: Most common (pi-web-tools, pi-surf, pi-web-utils)
- **External services**: Jina Reader fallback, markdown.new, Firecrawl, Gemini URL Context
- **Multi-layer fallbacks**: pi-web-access has the most sophisticated fallback chains

### 4. GitHub Integration

Several packages clone GitHub repos for real file access:
- pi-web-access, pi-web-tools, pi-web-utils all support GitHub cloning
- Use shallow clones (--depth 1) with size limits (~350MB default)
- Return local paths for subsequent `read` and `bash` operations

### 5. Video/Multimedia Support

Only **pi-web-access** supports:
- YouTube video understanding via Gemini
- Local video file analysis (MP4, MOV, WebM, AVI up to 50MB)
- Frame extraction with ffmpeg/yt-dlp

### 6. Infrastructure Extensions

The @e9n ecosystem (pi-webserver, pi-webnav, pi-web-dashboard) provides:
- Shared HTTP server with auth
- Navigation shell for mounted extensions
- Real-time dashboard with SSE streaming
- Event-based mounting system (`web:mount`, `web:ready`)

### 7. Key Decision Factors

| Need | Recommended Package |
|------|---------------------|
| Zero setup, already use Chrome | pi-web-access |
| Video/YouTube understanding | pi-web-access |
| Enterprise scraping (JS rendering) | @benvargas/pi-firecrawl |
| Real browser interaction | pi-agent-browser |
| Privacy/self-hosted search | pi-web-utils (SearXNG) |
| Minimal, lightweight | @hyperprior/pi-browser |
| Scout subagent for research | pi-surf |
| Build web UI for pi | @e9n/pi-webserver + ecosystem |

---

## Research Methodology

- Direct npm registry queries via curl to registry.npmjs.org
- npmjs.com page fetching via web reader
- GitHub README fetching from raw.githubusercontent.com
- All 12 packages confirmed to exist and be actively maintained

**Last Updated:** 2026-02-26
**Coverage:** 12 packages, all found and researched
