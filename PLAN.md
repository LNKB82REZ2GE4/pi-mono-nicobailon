## Context
- User wants remote bot messages (Discord/WhatsApp/etc.) to still be handled when no interactive `pi` TUI session is open.
- Current bridge is an in-session extension (`src/index.ts`) that depends on `pi.on("session_start")`, `pi.sendUserMessage()`, and `turn_end` events. If pi is not running, transports are down and messages are not processed.
- We need a design that preserves auth/security behavior (challenge auth, trusted users) and still gives reliable async handling.

## Approach
- Recommended direction: split runtime into two layers:
  1. **Always-on bridge daemon** (transport ingress + auth + durable queue + process supervision)
  2. **pi worker sessions** started on demand (SDK) for actual agent turns.
- Concretely for v1:
  - **Session isolation:** one worker/session per `transport:chatId`.
  - **Queue policy:** per-chat FIFO with bounded max depth and drop-oldest policy.
  - **Transport priority:** Discord-first production path; other transports remain secondary.
  - **Startup:** provide manual daemon command first, plus documented optional `systemd --user` unit.
  - **Model policy:** dedicated bridge model/provider config in `~/.pi/msg-bridge.json`.
  - **Working directory:** single fixed default directory in `~/.pi/msg-bridge.json`.
  - **Auth mode:** single-user/headless-safe mode via explicit pre-trust (no challenge prompts for unknown users in daemon mode).
- Prefer using `createAgentSession()` (SDK) in-process for worker lifecycle rather than shelling interactive pi.
- Keep extension UX (`/msg-bridge ...`) for local status/config where useful, but move critical message handling out of TUI-lifetime.

## Files to modify
- In `pi-messenger-bridge` fork:
  - `src/index.ts` (likely reduced to command/UI integration or compatibility shim)
  - `src/transports/*` (reuse providers; decouple from session lifecycle)
  - `src/auth/challenge-auth.ts` (shared auth state with daemon)
  - `src/types.ts` (daemon/job/session state types)
  - New:
    - `src/daemon/main.ts`
    - `src/daemon/runner.ts` (worker session lifecycle)
    - `src/daemon/store.ts` (queue/state persistence)
    - `src/daemon/supervisor.ts` (single-flight/locking/restart policy)
- Package/entrypoints:
  - `package.json` (bin scripts + optional dual mode)
  - `README.md` (systemd/user-service setup)

## Reuse
- `pi-messenger-bridge/src/index.ts`
  - Existing config load/save + command UX + transport wiring.
- `pi-messenger-bridge/src/transports/manager.ts`
  - Existing multiplexing for transport providers.
- `pi-messenger-bridge/src/auth/challenge-auth.ts`
  - Existing challenge + trusted-user model.
- `packages/coding-agent/docs/sdk.md`
  - `createAgentSession()` and `SessionManager` for managed sessions without TUI.
- `packages/coding-agent/docs/rpc.md`
  - Alternative transport if process isolation is preferred.
- `packages/mom/src/main.ts`
  - Long-lived process entrypoint pattern, per-channel state map, graceful shutdown, CLI flags.
- `packages/mom/src/agent.ts`
  - Strong precedent for long-lived runner, queueing, per-channel session persistence, and event-driven output handling.
- `packages/mom/package.json`
  - Existing `bin` CLI packaging pattern for an always-on companion process.

## Steps
- [ ] Add daemon runtime entrypoint and CLI (`msg-bridge-daemon`) with manual start flow.
- [ ] Factor transport/auth/config logic into daemon-shared modules; keep extension as UI/config surface.
- [ ] Add daemon config schema in `~/.pi/msg-bridge.json` for model/provider, fixed `cwd`, queue limits, and single-user trusted identity.
- [ ] Add one-time trust bootstrap command (`/msg-bridge trust-me`) in interactive mode to record your namespaced user ID for daemon-only operation.
- [ ] Implement durable per-chat queue store with max-depth policy (drop oldest, emit status/log event).
- [ ] Implement per-`transport:chatId` worker supervisor using `createAgentSession()` and persistent session files.
- [ ] Implement response correlation and exactly-one outbound reply per processed inbound job (idempotency keys).
- [ ] Add operational controls: `status`, `pause/resume`, queue depth visibility, reconnect backoff, graceful shutdown.
- [ ] Document optional `systemd --user` service and migration from extension-only usage.

## Verification
- Start daemon only (no interactive pi); send Discord DM and verify job is enqueued and answered.
- Send messages to two different Discord chats concurrently; verify isolated per-chat contexts.
- Flood one chat past queue limit; verify drop-oldest behavior and operator-visible warning.
- Kill worker mid-turn; verify supervisor recovery and no duplicate/misdirected replies.
- Restart daemon; verify queued jobs, trusted-user auth state, and session continuity survive restart.
- Verify single-user pre-trust mode: trusted admin user works; unknown users are denied with clear message and no interactive challenge dependency.

## Discoveries so far
- Bridge currently hard-depends on active session event loop (`session_start`, `turn_end`) in `src/index.ts`.
- Existing architecture has no background process lifecycle.
- Current package has no daemon `bin` entrypoint in `package.json`; it is extension-only.
- pi SDK already supports fully programmatic sessions (`createAgentSession()`), `SessionManager`, and event subscriptions for non-TUI runtimes.
- `pi-mom` already demonstrates durable channel state + runner pattern + long-lived CLI process that can be adapted.

## Open questions
- None currently blocking implementation.
