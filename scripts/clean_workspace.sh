#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPLY=0

usage() {
  cat <<USAGE
Usage: bash ./scripts/clean_workspace.sh [--apply]

Default mode is dry-run.
- --apply: remove matched generated files and folders.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --apply)
      APPLY=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      usage
      exit 1
      ;;
  esac
done

log() {
  printf '[clean][%s] %s\n' "$(date +%H:%M:%S)" "$*"
}

remove_path() {
  local path="$1"
  local label="$2"

  if [[ ! -e "$path" ]]; then
    return 0
  fi

  if [[ "$APPLY" -eq 1 ]]; then
    rm -rf "$path"
    log "removed $label"
  else
    log "would remove $label"
  fi
}

cd "$ROOT_DIR"

log "mode=$( [[ "$APPLY" -eq 1 ]] && echo apply || echo dry-run )"

# Build/cache artifacts.
remove_path "$ROOT_DIR/.next" ".next/"
remove_path "$ROOT_DIR/out" "out/"
remove_path "$ROOT_DIR/build" "build/"
remove_path "$ROOT_DIR/dist" "dist/"
remove_path "$ROOT_DIR/coverage" "coverage/"

# Pipeline generated outputs (keep .gitkeep files).
shopt -s nullglob
for file in "$ROOT_DIR"/ops/artifacts/* "$ROOT_DIR"/ops/reports/*; do
  base_name="$(basename "$file")"
  if [[ "$base_name" == ".gitkeep" ]]; then
    continue
  fi
  remove_path "$file" "${file#"$ROOT_DIR"/}"
done
shopt -u nullglob

# TypeScript incremental metadata under repo sources only (exclude .git/node_modules).
while IFS= read -r -d '' file; do
  remove_path "$file" "${file#"$ROOT_DIR"/}"
done < <(find "$ROOT_DIR" \
  -type d \( -name '.git' -o -name 'node_modules' \) -prune -o \
  -type f -name '*.tsbuildinfo' -print0)

if [[ "$APPLY" -eq 0 ]]; then
  log "dry-run finished (run with --apply to execute removals)"
else
  log "cleanup finished"
fi
