# @lnkb82rez2ge4/pi-the-office

The Office for [pi](https://github.com/badlogic/pi-mono): persistent specialist teams with hierarchical orchestration, audit trails, and a monitor widget.

## What this package provides

- Office-oriented multi-agent orchestration (`orchestrate` tool)
- Team monitor widget and office commands
- Persistent team/workflow/office state in `~/.pi/agent/the-office`
- Auditable message timeline for manager/lead/specialist communication
- Session naming strategy for spawned specialist instances

## Installation

```bash
pi install npm:@lnkb82rez2ge4/pi-the-office
```

Or via `~/.pi/agent/settings.json`:

```json
{
  "packages": ["npm:@lnkb82rez2ge4/pi-the-office"]
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/office` | Toggle persistent office monitor panel (docked above editor) |
| `/office-dashboard` | Open unified Office manager (teams, policies, interaction mode, scoped model picker) |
| `/office-teams` | List saved teams |
| `/office-create-team` | Create a team scaffold (interactive prompts) |
| `/office-role-policy` | Configure ordered provider/model fallback for a team role |
| `/office-interaction <routed|direct>` | Set direct interaction mode |
| `/office-chat <message>` | Send routed/direct office message |
| `/office-audit` | Show recent office audit events |

## Tool

The package registers `orchestrate` with chain, parallel, and team modes.

## Model selection policy

Team lead and specialist model pickers use scoped models only. Configure scope with `/scoped-models` or CLI `--models` before creating/updating teams.

## Notes

This package was bootstrapped from the existing `packages/orchestration` implementation, but is independent and can evolve separately.
