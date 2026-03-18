#!/usr/bin/env bash
# local-sync.sh — pull origin/main and rebuild if it has moved
# Runs as a systemd user timer. Safe to run while pi is in use.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_TAG="pi-mono-sync"

log() { echo "[$LOG_TAG] $*"; }

cd "$REPO_DIR"

git fetch origin --quiet

LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  log "Already up to date."
  exit 0
fi

BEHIND=$(git rev-list --count main..origin/main)
log "origin/main is $BEHIND commit(s) ahead — merging..."

# Try a clean merge first
if git merge origin/main --no-edit -m "Merge origin/main (auto-sync)" 2>/dev/null; then
  log "Merge clean."
else
  # Auto-resolve CHANGELOG and generated files, same logic as the GHA workflow
  UNRESOLVED=""

  for f in $(git diff --name-only --diff-filter=U); do
    case "$f" in
      packages/coding-agent/CHANGELOG.md)
        python3 - "$f" <<'PY'
import sys, re

path = sys.argv[1]
text = open(path).read()

def resolve(text):
    pattern = re.compile(
        r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [^\n]+\n',
        re.DOTALL
    )
    def pick(m):
        ours = m.group(1).rstrip('\n')
        theirs = m.group(2).rstrip('\n')
        return ours + '\n\n' + theirs + '\n'
    resolved = pattern.sub(pick, text)
    if '<<<<<<<' in resolved or '>>>>>>>' in resolved:
        return None
    return resolved

result = resolve(text)
if result:
    open(path, 'w').write(result)
    sys.exit(0)
sys.exit(1)
PY
        if [ $? -eq 0 ]; then
          git add "$f"
          log "Auto-resolved: $f"
        else
          UNRESOLVED="$UNRESOLVED $f"
        fi
        ;;
      packages/ai/src/models.generated.ts)
        git checkout --theirs "$f"
        git add "$f"
        log "Auto-resolved: $f (took origin/main)"
        ;;
      *)
        UNRESOLVED="$UNRESOLVED $f"
        ;;
    esac
  done

  if [ -z "$(echo $UNRESOLVED | tr -d ' ')" ]; then
    git commit -m "Merge origin/main (auto-sync — conflicts auto-resolved)"
    log "All conflicts auto-resolved."
  else
    git merge --abort
    log "ERROR: Unresolvable conflicts in:$UNRESOLVED"
    log "Resolve manually, then push to origin/main to re-trigger the build."
    exit 1
  fi
fi

log "Building..."
npm run build
log "Build complete. pi is up to date."
