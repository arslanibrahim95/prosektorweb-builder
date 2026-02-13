#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() {
  printf '[hygiene][%s] %s\n' "$(date +%H:%M:%S)" "$*"
}

fail_with_file() {
  local message="$1"
  local file="$2"
  echo "$message" >&2
  if [[ -s "$file" ]]; then
    cat "$file" >&2
  fi
  exit 1
}

log "checking merge conflict markers"
if git grep -nE '^(<<<<<<<|=======|>>>>>>>)' -- . >"$TMP_DIR/conflicts.txt"; then
  fail_with_file "Merge conflict markers found in tracked files:" "$TMP_DIR/conflicts.txt"
fi

log "checking forbidden legacy product references"
if rg -n -i \
  -g '!node_modules/**' \
  -g '!.next/**' \
  -g '!ops/artifacts/**' \
  -g '!ops/reports/**' \
  -g '!package-lock.json' \
  -g '!scripts/check_repo_hygiene.sh' \
  '@payloadcms|payload[[:space:]-]?cms|puck[[:space:]-]?editor' \
  "$ROOT_DIR" >"$TMP_DIR/legacy_refs.txt"; then
  fail_with_file "Legacy product references detected (remove Payload/Puck references):" "$TMP_DIR/legacy_refs.txt"
fi

log "checking generated pipeline files are not tracked"
>"$TMP_DIR/tracked_generated.txt"
while IFS= read -r tracked_file; do
  [[ -z "$tracked_file" ]] && continue
  if [[ "$(basename "$tracked_file")" == ".gitkeep" ]]; then
    continue
  fi
  if [[ -e "$tracked_file" ]]; then
    echo "$tracked_file" >>"$TMP_DIR/tracked_generated.txt"
  fi
done < <(
  {
    git ls-files 'ops/artifacts/*'
    git ls-files 'ops/reports/*'
  } | sort -u
)

if [[ -s "$TMP_DIR/tracked_generated.txt" ]]; then
  fail_with_file "Generated pipeline files must not be tracked:" "$TMP_DIR/tracked_generated.txt"
fi

log "checking tracked temporary files"
{
  git ls-files '*.orig'
  git ls-files '*.rej'
  git ls-files '*.swp'
  git ls-files '*.swo'
  git ls-files '.DS_Store'
} >"$TMP_DIR/tracked_temp.txt"

if [[ -s "$TMP_DIR/tracked_temp.txt" ]]; then
  fail_with_file "Temporary files are tracked by git (remove them):" "$TMP_DIR/tracked_temp.txt"
fi

log "repo hygiene checks passed"
