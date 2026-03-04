## Context
- User wants a major new capability named **"The Office"**: persistent specialized agents organized into teams, each with a team lead, coordinated by a top-level Office Manager.
- Required outcomes include: delegation/orchestration, auditable communications, persistent team/member configuration, per-agent model/provider control, team/member status visibility in TUI, and direct interaction with any manager/specialist instance.
- User decided implementation should be a **new standalone npm-installable package** named **`pi-the-office`** (scoped package name to use in-repo: `@lnkb82rez2ge4/pi-the-office`).
- `packages/orchestration` should remain untouched as an upstream/in-progress package; we can copy/adapt code from it into the new package.
- Existing codebase already contains substantial groundwork in `packages/orchestration` and extension examples in `packages/coding-agent/examples/extensions/subagent`.

## Approach
- Build **The Office as a standalone installable pi package** (npm-installable + `pi install npm:@lnkb82rez2ge4/pi-the-office`) implemented as an extension package, not a skill.
- Create a new package at `packages/office` with package name `@lnkb82rez2ge4/pi-the-office`.
- Leave `packages/orchestration` unchanged; copy/adapt proven pieces into the new package.
- Use copied orchestration primitives as the base and evolve to full Office hierarchy:
  - Office Manager (global coordinator/router)
  - Team Leads (intra-team coordinators + cross-team communication)
  - Specialists (spawnable workers, multi-instance, persistent specialization profiles)
- Implement **both** communication channels in v1:
  - Canonical internal auditable message bus (persistent, queryable)
  - Telegram adapter integration (mirrors selected events/threads)
- Default autonomy policy in v1: all routing/delegation/spawn/provider-switch actions are automatic (no user confirmation gates).
- Support direct interaction mode toggle:
  - routed-via-office in current session
  - direct dedicated session/thread with selected Office/Lead/Specialist
- Model/provider quota policy is defined at team/role setup as an ordered fallback list; runtime uses that policy for intelligent selection.
- Deliver in phases: package scaffold + imported baseline → Office domain/storage/messaging → TUI builders + direct interaction → quota routing + Telegram.

## Files to modify
- New package (target path):
  - `packages/office/package.json` (name: `@lnkb82rez2ge4/pi-the-office`)
  - `packages/office/README.md`
  - `packages/office/tsconfig.json`
  - `packages/office/src/index.ts`
  - `packages/office/src/core/types.ts`
  - `packages/office/src/core/spawn/subprocess.ts`
  - `packages/office/src/core/context/branched.ts`
  - `packages/office/src/coordination/*` (copied/adapted chain/parallel/team engines)
  - `packages/office/src/tools/orchestrate.ts` (or renamed office tool entry while preserving orchestration capabilities)
  - `packages/office/src/persistence/store.ts`
  - `packages/office/src/tui/*` (office monitor + builder/editor panels)
  - `packages/office/src/office/*` (manager/team-lead/specialist/message domain)
  - `packages/office/src/integrations/telegram/*`
  - `packages/office/agents/*.md` (office defaults + specialist templates)
- Source explicitly reused by copy/adaptation (no edits to source package):
  - `packages/orchestration/src/**`
  - `packages/orchestration/agents/*.md`
- Repo-level references to add/update for new package:
  - root `README.md` package listing
  - root build/check script wiring if package needs explicit inclusion

## Reuse
- Existing **subagent extension pattern**:
  - `packages/coding-agent/examples/extensions/subagent/index.ts`
  - `packages/coding-agent/examples/extensions/subagent/agents.ts`
  - Provides isolated `pi` subprocess spawning, progress updates, and rich renderers.
- Existing orchestration package building blocks:
  - Modes and entrypoint: `packages/orchestration/src/index.ts`, `packages/orchestration/src/tools/orchestrate.ts`
  - Team DAG scheduling: `packages/orchestration/src/coordination/team.ts`
  - Spawn/process isolation: `packages/orchestration/src/core/spawn/subprocess.ts`
  - Team/workflow persistence: `packages/orchestration/src/persistence/store.ts`
  - Monitor widget + pinning concept: `packages/orchestration/src/tui/monitor-widget.ts`
- Existing extension UI/command patterns:
  - Widget placement: `packages/coding-agent/examples/extensions/widget-placement.ts`
  - Stateful command/tool extension patterns from `packages/coding-agent/docs/extensions.md`.

## Steps
### Phase 1 — New package scaffold + imported baseline
- [ ] Scaffold new package `packages/office` (`@lnkb82rez2ge4/pi-the-office`) with pi package manifest and extension entrypoint.
- [ ] Copy/adapt baseline orchestration modules from `packages/orchestration` into `packages/office` (without modifying source package).
- [ ] Integrate package into monorepo wiring (root build/check/readme references where required).
- [ ] Harden imported baseline before feature expansion:
  - remove inline imports in copied `core/context/branched.ts` (top-level imports only)
  - fix/verify usage aggregation and subprocess argument correctness in copied team/spawn flows
  - replace copied command stubs (e.g., `teams-create`) with Office command placeholders

### Phase 2 — Office core domain + persistence + audit
- [ ] Introduce Office domain types in core models:
  - Office, Team, TeamLead, SpecialistTemplate, SpecialistInstance
  - WorkItem/Delegation, MessageThread, AuditEvent, RoutingPolicy, FallbackPolicy
- [ ] Extend persistence layer to store Office config + runtime audit log:
  - team/role specializations, prompts, skills, provider/model fallback lists, session naming state
  - message transcripts with correlation IDs and thread IDs
- [ ] Implement deterministic session/instance naming using approved scheme:
  - `office/<team>/<role>/<template>#<instance>-<shortTask>-<timestamp>`
- [ ] Implement auditable communication bus:
  - office↔team lead↔specialist and lead↔lead message routing
  - persisted timeline + read/query APIs for TUI and export

### Phase 3 — Orchestration behavior + direct interaction + TUI
- [ ] Implement orchestration runtime updates:
  - Office Manager routing incoming jobs to team leads
  - Team lead decomposition and subordinate lifecycle management
  - multi-instance specialist spawning per template
- [ ] Implement direct-interaction mode toggle (both supported):
  - routed messages in parent office flow
  - direct dedicated session/thread with selected manager/lead/worker
- [ ] Implement TUI Office surfaces:
  - pinned/unpinned office widget with team/member cards + status/current work
  - team/member builder/editor UI for persistent setup
  - per-role/provider model fallback ordering UI

### Phase 4 — Provider policy engine + Telegram + packaging
- [ ] Implement quota-aware model/provider routing:
  - ordered fallback list per team/role configured in TUI
  - runtime selection + automatic degrade/failover behavior
- [ ] Implement Telegram integration adapter:
  - pluggable transport boundary over canonical internal message bus
  - configurable mirroring rules for threads/events
- [ ] Package/release work for standalone install:
  - finalize package metadata/docs for npm + `pi install npm:@lnkb82rez2ge4/pi-the-office`
  - ensure discoverable commands and quick-start examples for Office workflows

## Verification
- Static checks:
  - `npm run check` after implementation changes.
- Phase acceptance checks:
  - Phase 1: New package loads as extension and registers base command/tool set without touching `packages/orchestration`.
  - Phase 2: Office/team configs and audit log survive restart and can be queried in-session.
  - Phase 3: Office Manager dispatch + Team Lead delegation + specialist multi-instance workflows operate end-to-end with visible TUI state.
  - Phase 4: role/team fallback policy executes in priority order; Telegram adapter mirrors configured events/threads.
- Functional verification (package-level/manual scenarios):
  - Create office + teams + specialists, persist and reload.
  - Dispatch a project to Office Manager; verify routing to appropriate team lead and subordinate spawning.
  - Run cross-team collaboration and confirm auditable message timeline with correlation/thread IDs.
  - Verify widget pin/unpin and real-time status accuracy.
  - Verify direct interaction with selected Office Manager/team lead/specialist instance (both routed and direct modes).
  - Verify unique session naming and searchability for multiple specialist instances.
  - Verify model/provider override behavior and intelligent fallback under configured quota constraints.

## Discoveries / Constraints from current code
- `packages/orchestration` already targets much of the requested direction but is incomplete (e.g., `/teams-create` is TODO).
- Existing monitor widget implementation exists (`packages/orchestration/src/tui/monitor-widget.ts`) but is basic and not yet a full office/team management UI.
- Team persistence already exists on disk (`~/.pi/agent/orchestration`), which can be extended for office entities.
- `packages/orchestration/package.json` already has a `pi` manifest and npm package metadata, so it is structurally compatible with standalone installation via `pi install npm:...` once finalized/published.
- A mature spawning/reference pattern exists in `packages/coding-agent/examples/extensions/subagent/index.ts` (single/parallel/chain modes, streaming progress, rich result rendering).
- Extension/TUI APIs already support custom interactive components and overlays (`docs/tui.md`, `ctx.ui.custom`, `ctx.ui.setWidget`).
- `packages/orchestration/src/core/context/branched.ts` currently uses inline dynamic imports (`await import("node:child_process")`), conflicting with repository rule: no inline imports.
- `packages/orchestration/src/core/spawn/subprocess.ts` and team coordination paths likely need hardening/bugfixing before expanding features.

## Existing orchestration package inventory (for reuse into new package)
- Entry + extension wiring: `packages/orchestration/src/index.ts`
  - registers `orchestrate` tool
  - commands `/teams`, `/teams-create` (stub), `/teams-list`
  - widget updates via `ctx.ui.setWidget`
- Tool schema and mode routing: `packages/orchestration/src/tools/orchestrate.ts`
  - modes: `chain`, `parallel`, `team`
  - progress callback wiring
- Execution engines:
  - sequential chain: `src/coordination/chain.ts`
  - bounded parallel: `src/coordination/parallel.ts`
  - team DAG scheduler: `src/coordination/team.ts`
- Agent subprocess runtime: `src/core/spawn/subprocess.ts`
  - launches isolated `pi` processes
  - timeout/abort handling
  - output truncation + partial progress parsing
- Context snapshot generation: `src/core/context/branched.ts`
- Persistence: `src/persistence/store.ts`
  - team store + workflow store under `~/.pi/agent/orchestration`
- TUI status component: `src/tui/monitor-widget.ts`
- Built-in agent templates: `packages/orchestration/agents/*.md` (scout/planner/worker/reviewer/researcher)

## Open decisions requiring user input
- None currently blocking plan execution.
- Assumed decisions locked:
  - package: `@lnkb82rez2ge4/pi-the-office`
  - location: `packages/office`
  - `packages/orchestration` remains untouched; copy/adapt only.
