# Development Guide

This is a personal fork of [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

## Directory Layout

```
~/pi-mono/          # This repo — dev copy of the pi coding agent
~/pi-plugins/       # Local forks of pi plugins you modify
  pi-messenger-bridge/   # Fork of tintinweb/pi-messenger-bridge
  plannotator/           # Fork of backnotprop/plannotator (contains apps/pi-extension)
```

The **globally installed** `pi` binary lives at:
```
~/.local/share/mise/installs/node/25.2.1/lib/node_modules/@mariozechner/pi-coding-agent
```

Global install can be in one of two modes:
1. **Static npm install** (`npm install -g ...`) — separate copy
2. **Linked install** (`npm link`) — symlink to `~/pi-mono/packages/coding-agent`

Check which mode is active:
```bash
ls -l ~/.local/share/mise/installs/node/25.2.1/lib/node_modules/@mariozechner/pi-coding-agent
```

Important: in linked mode, `pi` still runs compiled files from `dist/`. Source edits in `src/` are not picked up globally until you rebuild.

## Stable vs Dev Builds

| | Location | Command |
|---|---|---|
| **Stable** (global static install) | npm global install | `pi` |
| **Global linked to repo** | symlink to `~/pi-mono/packages/coding-agent` | `pi` (uses repo `dist/`) |
| **Dev** (this repo) | `~/pi-mono` | `./pi-test.sh` or build + run directly |

## Promotion workflow for pi-mono changes (required)

When a coding agent has finished a change and it is approved:

1. **Commit only intended files**
2. **Push to your fork**
3. **Rebuild so global linked `pi` picks up changes**

Typical sequence:
```bash
git status
git add <specific-files>
git commit -m "<message>"
git push origin <branch>

# Rebuild + (re)link global pi from this repo
./install-pi.sh
```

Notes:
- If global `pi` is already linked to this repo, rebuild is what matters. Re-running `npm link` is harmless.
- If global `pi` is a static npm install, rebuilding this repo does nothing until you install/link it.

To **restore a clean upstream release** as your global install:
```bash
npm install -g @mariozechner/pi-coding-agent@<version>
```

## Upstream Sync

Upstream changes flow in automatically via the **Upstream Sync** GitHub Actions workflow (`.github/workflows/upstream-sync.yml`). It runs daily and creates a PR when upstream has new commits.

**To merge an upstream sync PR locally:**
```bash
git fetch origin upstream-sync
git merge origin/upstream-sync --no-edit
# If package-lock.json has conflict markers, regenerate it:
npm install --package-lock-only
git add package-lock.json
git commit --amend --no-edit  # or new commit if hooks ran
git push origin main
```

**To manually pull upstream:**
```bash
git fetch upstream
git merge upstream/main
```

## Plugin Forks (`~/pi-plugins/`)

Use `~/pi-plugins` as the canonical workspace for plugin development and maintenance.
Each maintained plugin should have:
- a local clone under `~/pi-plugins/<repo>`
- `origin` pointing to your fork (`LNKB82REZ2GE4`)
- `upstream` pointing to the original repository

### Required plugin audit (run before plugin work)

1. List enabled plugins in pi:
```bash
pi ext list
```
2. Inspect configured package sources:
```bash
python -m json.tool ~/.pi/agent/settings.json
```
3. List local plugin directories:
```bash
find ~/pi-plugins -mindepth 1 -maxdepth 1 -type d | sort
```
4. For every enabled plugin, ensure a corresponding personal fork exists locally and on GitHub.
5. Verify remotes for each maintained plugin:
```bash
git -C ~/pi-plugins/<plugin> remote -v
```

### Source modes for plugins

- **npm package (`npm:<package>`)**: stable mode, managed with `pi ext update`
- **local path (`/home/jake/pi-plugins/<plugin>`)**: development mode, requires local builds
- **GitHub URL**: acceptable for pinning forks, but local path is preferred while iterating

### Promotion workflow for plugin changes (required)

When a coding agent has finished a plugin change and it is approved:

1. **Commit only intended plugin files**
2. **Push to your personal fork**
3. **Build/rebuild the plugin**
4. **Install/activate it in the global pi environment**
5. **Reload/restart pi and verify behavior**

Typical sequence:
```bash
cd ~/pi-plugins/<plugin>
git status
git add <specific-files>
git commit -m "<message>"
git push origin <branch>
npm install
npm run build
```

Activation rules:
- If using a **local path** in `settings.json`: run `/reload` (or restart pi) after build.
- If using an **npm package**: publish/update the package version, then run `pi ext update`.
- If using a **GitHub URL** source: update the URL/ref in `settings.json`, then `/reload`.

### Pull upstream changes into a plugin fork

```bash
cd ~/pi-plugins/<plugin>
git fetch upstream
git merge upstream/main
# resolve conflicts, then:
git push origin main
```

## Settings (`~/.pi/agent/settings.json`)

Plugin load order in `packages` array:
1. `npm:package-name` — stable npm installs, updated by `pi ext update`
2. Absolute paths (`/home/jake/pi-plugins/...`) — local forks, built locally
3. GitHub URLs — avoid for day-to-day dev; prefer local clones while iterating

### Personal active-package notes

Keep this section optional and current. If package-specific notes become stale, remove or update them.
Prefer source-of-truth checks (`pi ext list` + `~/.pi/agent/settings.json`) over hardcoded package state.

## Adding a New Plugin Fork

1. Fork on GitHub: `gh repo fork <owner>/<repo> --clone=false`
2. Clone: `git clone https://github.com/LNKB82REZ2GE4/<repo> ~/pi-plugins/<repo>`
3. Add upstream: `git -C ~/pi-plugins/<repo> remote add upstream https://github.com/<owner>/<repo>.git`
4. Build: `cd ~/pi-plugins/<repo> && npm install && npm run build`
5. If actively modifying, switch `settings.json` to use the absolute path
