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
This is a static copy — it does **not** auto-update from `~/pi-mono`.

## Stable vs Dev Builds

| | Location | Command |
|---|---|---|
| **Stable** (global) | npm global install | `pi` |
| **Dev** (this repo) | `~/pi-mono` | `./pi-test.sh` or build + run directly |

To **promote your dev build to global**:
```bash
./install-pi.sh
```
This builds the repo and runs `npm link` in `packages/coding-agent`, replacing the global binary. Run this only when you're happy with your changes.

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

Each plugin fork has:
- `origin` → your GitHub fork (fetch + push)
- `upstream` → the original author's repo (fetch only)

### pi-messenger-bridge

```bash
cd ~/pi-plugins/pi-messenger-bridge

# Build after changes
npm run build

# Install modified version into global pi
npm install -g .
```

### plannotator (@plannotator/pi-extension)

```bash
cd ~/pi-plugins/plannotator

# The pi extension lives in apps/pi-extension
cd apps/pi-extension
npm install && npm run build  # if applicable
```

The extension is loaded by pi via an absolute path in `~/.pi/agent/settings.json`.

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
1. `npm:package-name` — stable npm installs, auto-updated by `pi ext update`
2. Absolute paths — local forks from `~/pi-plugins/`, built locally
3. GitHub URLs — avoid; use local clones instead

## Adding a New Plugin Fork

1. Fork the plugin on GitHub to `LNKB82REZ2GE4/<plugin-name>`
2. Clone it: `git clone https://github.com/LNKB82REZ2GE4/<plugin-name> ~/pi-plugins/<plugin-name>`
3. Add upstream: `git -C ~/pi-plugins/<plugin-name> remote add upstream <original-url>`
4. Build it: `cd ~/pi-plugins/<plugin-name> && npm install && npm run build`
5. Add an absolute path entry to `~/.pi/agent/settings.json`:
   ```json
   "/home/jake/pi-plugins/<plugin-name>"
   ```
