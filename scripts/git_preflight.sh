#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '[git-preflight][%s] %s\n' "$(date +%H:%M:%S)" "$*"
}

if [[ "${SKIP_GIT_GUARDS:-0}" == "1" ]]; then
  log "SKIP_GIT_GUARDS=1 -> skipping checks"
  exit 0
fi

log "running repository hygiene checks"
bash ./scripts/check_repo_hygiene.sh

log "checking whitespace issues in staged changes"
git diff --cached --check

log "checking whitespace issues in working tree"
git diff --check

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit/stash cleanup before push." >&2
  git status --short >&2
  exit 1
fi

log "running test gate"
npm run test:strict

log "running build gate"
npm run build

log "git preflight passed"
