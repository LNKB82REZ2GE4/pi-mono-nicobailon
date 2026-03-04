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

All installed plugins have been forked to `LNKB82REZ2GE4` on GitHub and cloned locally. Each has:
- `origin` → your GitHub fork (fetch + push)
- `upstream` → the original author's repo (fetch only)

| Local dir | npm package | Upstream |
|---|---|---|
| `pi-annotate` | `pi-annotate` | nicobailon/pi-annotate |
| `pi-ask-tool` | `pi-ask-tool-extension` | devkade/pi-ask-tool |
| `pi-doom` | `pi-doom` | badlogic/pi-doom |
| `pi-extensions` | `@tmustier/pi-files-widget`, `@tmustier/extending-pi` | tmustier/pi-extensions |
| `pi-extension-settings` | `@juanibiapina/pi-extension-settings` | juanibiapina/pi-extension-settings |
| `pi-extmgr` | `pi-extmgr` | ayagmar/pi-extmgr |
| `pi-gitnexus` | `pi-gitnexus` | tintinweb/pi-gitnexus |
| `pi-mermaid` | `pi-mermaid` | Gurpartap/pi-mermaid |
| `pi-messenger-bridge` | *(local path)* | tintinweb/pi-messenger-bridge |
| `pi-nes` | `@tmustier/pi-nes` | tmustier/pi-nes |
| `pi-packages` | `@benvargas/pi-antigravity-image-gen` | ben-vargas/pi-packages |
| `pi-peon-ping` | `pi-peon-ping` | joshuadavidthomas/pi-peon-ping |
| `pi-plan` | `@devkade/pi-plan` | devkade/pi-plan |
| `pi-powerbar` | `@juanibiapina/pi-powerbar` | juanibiapina/pi-powerbar |
| `pi-powerline-footer` | `pi-powerline-footer` | nicobailon/pi-powerline-footer |
| `pi-smart-sessions` | `pi-smart-sessions` | HazAT/pi-smart-sessions |
| `pi-theme-jellybeans` | `@aliou/pi-theme-jellybeans` | aliou/pi-theme-jellybeans |
| `pi-tmux-window-name` | `pi-tmux-window-name` | default-anton/pi-tmux-window-name |
| `pi-tokyonight` | `@juanibiapina/pi-tokyonight` | juanibiapina/pi-tokyonight |
| `pi-web-access` | `pi-web-access` | nicobailon/pi-web-access |
| `plannotator` | `@plannotator/pi-extension` *(local path)* | backnotprop/plannotator |

### Normal workflow — using npm packages (no local changes needed)

Most plugins are loaded from npm in `settings.json` as `npm:package-name`. You don't need to do anything with the local clones unless you want to modify a plugin. Update all npm plugins with:
```bash
pi ext update
```

### Modifying a plugin locally

1. Make changes in `~/pi-plugins/<plugin>/`
2. Build it: `cd ~/pi-plugins/<plugin> && npm install && npm run build`
3. Switch `settings.json` from `npm:package-name` to `/home/jake/pi-plugins/<plugin>` for that plugin
4. Restart pi — it will load your local build
5. When happy, push to your fork and optionally publish to npm

### Switching back to npm version

Change the entry in `settings.json` back from the absolute path to `npm:package-name`.

### Pull upstream changes into a plugin fork

```bash
cd ~/pi-plugins/<plugin>
git fetch upstream
git merge upstream/main
# resolve conflicts, then:
git push origin main
```

### pi-messenger-bridge (already local)

Loaded from local path — built and active. After changes:
```bash
cd ~/pi-plugins/pi-messenger-bridge && npm run build
# No settings.json change needed, already on local path
```

### plannotator (@plannotator/pi-extension)

The pi extension lives in `apps/pi-extension` within the monorepo. Loaded from local path. After changes:
```bash
cd ~/pi-plugins/plannotator/apps/pi-extension
npm install && npm run build  # if applicable
```

## Settings (`~/.pi/agent/settings.json`)

Plugin load order in `packages` array:
1. `npm:package-name` — stable npm installs, updated by `pi ext update`
2. Absolute paths (`/home/jake/pi-plugins/...`) — local forks, built locally
3. GitHub URLs — avoid for day-to-day dev; prefer local clones while iterating

### Current status bar setup

- `pi-powerbar` has been removed from active packages (redundant).
- `pi-powerline-footer` now includes subscription windows itself via bundled `@marckrenn/pi-sub-core`.
- Active source is the fork URL: `https://github.com/LNKB82REZ2GE4/pi-powerline-footer`
- For local iteration on that extension, temporarily switch back to `/home/jake/pi-plugins/pi-powerline-footer`.

## Adding a New Plugin Fork

1. Fork on GitHub: `gh repo fork <owner>/<repo> --clone=false`
2. Clone: `git clone https://github.com/LNKB82REZ2GE4/<repo> ~/pi-plugins/<repo>`
3. Add upstream: `git -C ~/pi-plugins/<repo> remote add upstream https://github.com/<owner>/<repo>.git`
4. Build: `cd ~/pi-plugins/<repo> && npm install && npm run build`
5. If actively modifying, switch `settings.json` to use the absolute path
