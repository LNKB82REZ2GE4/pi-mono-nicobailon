# Category I: Planning / Review / Analysis - Pi Extension Packages Research

Research date: 2026-02-27

## Summary Table

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **@devkade/pi-plan** | Extension | Plan command extension for Pi: read-only planning mode with approval-based execution | `/plan` command toggles plan mode; read-only tools during planning; approval UI before execution; `/todos` to track progress; bash command filtering for safety | pi-coding-agent (peer) | More feature-rich than @juanibiapina version; includes todos tracking and explicit approval flow; GitHub: devkade/pi-plan |
| **@juanibiapina/pi-plan** | Extension | Pi extension for plan mode - read-only exploration and analysis | `/plan` toggle; read-only tools only in plan mode; status indicator; powerbar support; configurable keyboard shortcut | pi-coding-agent, pi-tui, @juanibiapina/pi-extension-settings (peer) | Simpler approach; session persistence via system reminders; GitHub: juanibiapina/pi-plan |
| **pi-critique** | Extension | Structured AI critique for writing and code | `/critique` command; numbered critiques (C1, C2...); auto-detects code vs writing; non-destructive by default; large file handling; reply loop with bracketed annotations | pi-coding-agent (peer) | Pairs well with pi-annotated-reply and pi-markdown-preview; GitHub: omaclaren/pi-critique |
| **pi-deep-review** | Extension | Deep PR review with deterministic context packing and OpenAI Responses API streaming | `/deep-review` command; 2-phase flow (context pack + review); git diff analysis; Scribe graph expansion; configurable model/reasoning effort | OpenAI API key, tokencount (cargo), optional: gh CLI, @sibyllinesoft/scribe | Uses gpt-5.2 by default; 6-20 min runtime; generates context artifacts; GitHub: ferologics/pi-deep-review |
| **@hyperprior/pi-review** | Extension | Structured findings tool for code review | `report_finding` tool with P0-P3 priority; confidence score; file/line tracking; `/hyper-review` command to view/clear findings | pi-coding-agent, pi-ai, pi-tui, @sinclair/typebox, @hyperprior/pi-shared | Part of @hyperprior monorepo; branch-scoped session state; GitHub: hyperprior/pi-mf-extensions |
| **@yofriadi/pi-review** | Extension | Interactive code review extension | `/review` command with modes: branch comparison, uncommitted changes, specific commit, custom instructions; `report_finding` and `submit_review` tools; noisy-file filtering; memory-aware diff metadata | pi-coding-agent >=0.52.10 (peer) | Task-aware prompts; security-hardened (path sanitization, git ref validation); GitHub: yofriadi/pi-extensions |
| **@hyperprior/pi-todo** | Extension | Branch-safe todo extension | `/hyper-todos` command; todo list tool; branch-scoped storage | pi-coding-agent, pi-ai, pi-tui, @sinclair/typebox, @hyperprior/pi-shared | Minimal but functional; part of @hyperprior monorepo; GitHub: hyperprior/pi-mf-extensions |
| **pi-search-agent** | Extension | Semantic codebase search with sub-agent processing | `search_agent` and `local_embedding_search` tools; OpenAI embeddings (text-embedding-3-small); configurable search model; `/search-agent` command; `/search-agent-settings` for config | OpenAI API key, dotenv, openai npm pkg | Indexes per-cwd; cached on disk; recommends cerebras/zai-glm-4.7 for search model; GitHub: implied toorusr |
| **@marcfargas/brainiac** | Extension | Persistent, searchable agent knowledge store | `brainiac_learn`, `brainiac_recall`, `brainiac_connect`, `brainiac_feedback` tools; FTS5 full-text search; auto-search before each turn; SQLite storage; privacy controls | pi-coding-agent >=0.50.0, better-sqlite3 | "The killer feature" is auto-search injection; stores at ~/.pi/brainiac/brainiac.db; GitHub: marcfargas/brainiac |
| **pi-evalset-lab** | Extension + Prompts | Fixed-task-set eval runs and prompt/system comparisons | `/evalset run|compare|init` commands; reproducible JSON reports; dataset hashing; variant comparison; HTML export | pi-coding-agent, pi-ai (peer) | Designed for LLM eval/prompt evaluation; includes example datasets; release-please + trusted publishing; GitHub: tryingET/pi-evalset-lab |
| **@marcfargas/pi-test-harness** | Testing Library | Test harness for pi extensions - in-process session testing, package install verification | `createTestSession()` with playbook DSL (`when`, `calls`, `says`); mock tools/UI; `verifySandboxInstall()`; `createMockPi()` for subprocess mocking; event collection | pi-coding-agent >=0.50.0, pi-ai, pi-agent-core (peer), vitest (dev) | "Let pi be pi" philosophy - only mocks LLM boundary; comprehensive testing infrastructure; GitHub: marcfargas/pi-test-harness |
| **pi-interview** | Extension | Interactive interview form extension for pi coding agent | `interview()` tool; web-based form; single/multi select, text, image, info panel types; code blocks, charts, mermaid, tables; keyboard nav; auto-save; session recovery; theming | pi-coding-agent >=0.35.0 | Full-featured form builder; multi-agent queue support; snapshot save/revive; GitHub: nicobailon/pi-interview-tool |
| **pi-annotate** | Extension | Visual annotation tool with inline note cards | `/annotate` command; Chrome extension + native host; element picker; box model capture; accessibility info; screenshots per element; Unix socket communication | Chrome extension install, native host setup (install.sh) | Figma-like annotation; requires Chrome extension + native messaging host; macOS only currently; GitHub: nicobailon/pi-annotate |

---

## Patterns Observed

### 1. Two Plan Mode Approaches
There are two distinct "plan mode" implementations:
- **@devkade/pi-plan**: More comprehensive with explicit approval workflow, `/todos` tracking, and structured plan output contract
- **@juanibiapina/pi-plan**: Simpler toggle-based approach with system reminder persistence

Both enforce read-only tools during planning, but @devkade's version adds the approval gate before execution begins.

### 2. Review Tools Converge on Similar Patterns
All three review packages (@hyperprior/pi-review, @yofriadi/pi-review, pi-deep-review) implement:
- Priority/severity levels (P0-P3 or similar)
- Structured findings with file/line context
- Confidence scoring
- Session-scoped state

pi-deep-review is the outlier - it's focused on PR review with context packing and uses OpenAI's Responses API directly rather than the pi model.

### 3. Knowledge/Search Split
- **pi-search-agent**: Real-time semantic search over codebase with embeddings
- **@marcfargas/brainiac**: Persistent knowledge store that the agent learns and recalls

These are complementary: search-agent finds code, brainiac remembers lessons/decisions.

### 4. Testing Infrastructure is Mature
@marcfargas/pi-test-harness provides a sophisticated testing approach:
- Playbook DSL to script model behavior
- Real pi runtime (only LLM mocked)
- Mock tools and UI
- Sandbox install verification
- Subprocess mocking for CLI spawning

This is a significant contribution to the ecosystem's reliability.

### 5. User Interaction Patterns
Two packages focus on structured user input:
- **pi-interview**: Full form builder with many question types, media support, keyboard nav
- **pi-annotate**: Visual annotation for UI feedback with element picking and screenshots

Both solve the "how do I get structured user input" problem but for different contexts (forms vs visual annotation).

### 6. Evaluation/Comparison Tooling
pi-evalset-lab addresses a gap in the ecosystem: systematic evaluation of prompt/system changes with reproducible datasets and comparison reports.

### 7. Common Dependencies
Most packages depend on:
- `@mariozechner/pi-coding-agent` (core)
- Some also need `pi-ai`, `pi-tui`, `pi-agent-core`
- TypeBox for schema validation (@hyperprior packages)

### 8. GitHub is the Universal Source
All packages are open source on GitHub with npm as the distribution channel. Most use trusted publishing via GitHub Actions OIDC.

---

## Quick Recommendations

| Use Case | Recommended Package(s) |
|----------|----------------------|
| Safer planning before execution | @devkade/pi-plan (more features) or @juanibiapina/pi-plan (simpler) |
| Code review with findings | @yofriadi/pi-review (interactive) or @hyperprior/pi-review (minimal) |
| Deep PR analysis | pi-deep-review (requires OpenAI key) |
| Semantic code search | pi-search-agent |
| Agent memory/knowledge | @marcfargas/brainiac |
| Testing extensions | @marcfargas/pi-test-harness |
| User clarification forms | pi-interview |
| Visual UI annotation | pi-annotate |
| Prompt/system evaluation | pi-evalset-lab |
| Critique writing/code | pi-critique |
| Simple todos | @hyperprior/pi-todo |
