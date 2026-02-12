#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPTS_DIR="$ROOT_DIR/ops/prompts"
ARTIFACTS_DIR="$ROOT_DIR/ops/artifacts"
REPORTS_DIR="$ROOT_DIR/ops/reports"
SCHEMAS_DIR="$ROOT_DIR/ops/schemas"
VALIDATOR="$ROOT_DIR/scripts/validate_content_pack.py"
NORMALIZER="$ROOT_DIR/scripts/normalize_content_pack.py"
FRONTEND_VALIDATOR="$ROOT_DIR/scripts/validate_frontend_artifact.py"

ARCH_PROMPT_TEMPLATE="$PROMPTS_DIR/architecture.md"
FRONTEND_PROMPT_TEMPLATE="$PROMPTS_DIR/frontend-design.md"
CONTENT_PROMPT_TEMPLATE="$PROMPTS_DIR/content-generation.md"
BACKEND_PROMPT_TEMPLATE="$PROMPTS_DIR/backend-integration.md"

ARCH_OUTPUT="$ARTIFACTS_DIR/01-architecture.md"
FRONTEND_OUTPUT="$ARTIFACTS_DIR/02-frontend-design.md"
CONTENT_OUTPUT="$ARTIFACTS_DIR/03-content-pack.json"
BACKEND_OUTPUT="$ARTIFACTS_DIR/04-backend-integration.md"

PIPELINE_LANG="${PIPELINE_LANG:-tr}"
PIPELINE_PROJECT_CONTEXT="${PIPELINE_PROJECT_CONTEXT:-}"
PIPELINE_RUN_ID="${PIPELINE_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
AGENT_TIMEOUT_SECONDS="${AGENT_TIMEOUT_SECONDS:-900}"
PIPELINE_CLEAN="${PIPELINE_CLEAN:-1}"
DRY_RUN=0

GEMINI_CMD="${GEMINI_CMD:-gemini}"
CLAUDE_CMD="${CLAUDE_CMD:-claude}"
CODEX_CMD="${CODEX_CMD:-codex}"

# Invocation templates. These defaults are non-interactive and tuned for each CLI.
CLAUDE_RUN_TEMPLATE="${CLAUDE_RUN_TEMPLATE:-}"
GEMINI_DESIGN_RUN_TEMPLATE="${GEMINI_DESIGN_RUN_TEMPLATE:-}"
GEMINI_CONTENT_RUN_TEMPLATE="${GEMINI_CONTENT_RUN_TEMPLATE:-}"
CODEX_RUN_TEMPLATE="${CODEX_RUN_TEMPLATE:-}"

if [[ -z "$CLAUDE_RUN_TEMPLATE" ]]; then
  CLAUDE_RUN_TEMPLATE='cat {prompt_file} | {cmd} -p --output-format text --permission-mode dontAsk --tools "" > {output_file}'
fi
if [[ -z "$GEMINI_DESIGN_RUN_TEMPLATE" ]]; then
  GEMINI_DESIGN_RUN_TEMPLATE='cat {prompt_file} | {cmd} -p "" -o text > {output_file}'
fi
if [[ -z "$GEMINI_CONTENT_RUN_TEMPLATE" ]]; then
  GEMINI_CONTENT_RUN_TEMPLATE='cat {prompt_file} | {cmd} -p "" -o text > {output_file}'
fi
if [[ -z "$CODEX_RUN_TEMPLATE" ]]; then
  CODEX_RUN_TEMPLATE='cat {prompt_file} | {cmd} exec - -C {repo_root} --sandbox workspace-write -o {output_file}'
fi

log() {
  printf '[pipeline][%s] %s\n' "$(date +%H:%M:%S)" "$*"
}

usage() {
  cat <<USAGE
Usage: ./scripts/agent_pipeline.sh [--dry-run] [--help]

Env overrides:
  PIPELINE_RUN_ID, PIPELINE_LANG, PIPELINE_PROJECT_CONTEXT
  AGENT_TIMEOUT_SECONDS, PIPELINE_CLEAN
  GEMINI_CMD, CLAUDE_CMD, CODEX_CMD
  CLAUDE_RUN_TEMPLATE, GEMINI_DESIGN_RUN_TEMPLATE,
  GEMINI_CONTENT_RUN_TEMPLATE, CODEX_RUN_TEMPLATE

Template placeholders:
  {cmd}, {prompt_file}, {output_file}, {repo_root}
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      usage
      exit 1
      ;;
  esac
done

ensure_command() {
  local cmd_string="$1"
  local base_cmd="${cmd_string%% *}"
  if ! command -v "$base_cmd" >/dev/null 2>&1; then
    echo "Missing command: $base_cmd" >&2
    return 1
  fi
}

ensure_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    echo "Missing file: $file_path" >&2
    return 1
  fi
}

ensure_non_empty() {
  local file_path="$1"
  if [[ ! -s "$file_path" ]]; then
    echo "Output is empty: $file_path" >&2
    return 1
  fi
}

render_prompt() {
  local template_file="$1"
  local output_file="$2"

  ensure_file "$template_file"

  local text
  text="$(cat "$template_file")"
  text="${text//'{{REPO_ROOT}}'/$ROOT_DIR}"
  text="${text//'{{ARCH_ARTIFACT}}'/$ARCH_OUTPUT}"
  text="${text//'{{FRONTEND_ARTIFACT}}'/$FRONTEND_OUTPUT}"
  text="${text//'{{CONTENT_ARTIFACT}}'/$CONTENT_OUTPUT}"
  text="${text//'{{BACKEND_ARTIFACT}}'/$BACKEND_OUTPUT}"
  text="${text//'{{PIPELINE_LANG}}'/$PIPELINE_LANG}"
  text="${text//'{{PIPELINE_RUN_ID}}'/$PIPELINE_RUN_ID}"

  {
    printf '%s\n' "$text"
    printf '\n## Runtime Context\n'
    printf -- '- run_id: %s\n' "$PIPELINE_RUN_ID"
    printf -- '- repo_root: %s\n' "$ROOT_DIR"
    printf -- '- language: %s\n' "$PIPELINE_LANG"
    printf -- '- generated_at: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    if [[ -n "$PIPELINE_PROJECT_CONTEXT" ]]; then
      printf -- '- additional_context: %s\n' "$PIPELINE_PROJECT_CONTEXT"
    fi
  } > "$output_file"
}

run_with_template() {
  local template="$1"
  local cmd_string="$2"
  local prompt_file="$3"
  local output_file="$4"

  local escaped_prompt escaped_output escaped_repo_root final_cmd cmd_word cmd_bin run_path
  escaped_prompt="$(printf '%q' "$prompt_file")"
  escaped_output="$(printf '%q' "$output_file")"
  escaped_repo_root="$(printf '%q' "$ROOT_DIR")"

  final_cmd="$template"
  final_cmd="${final_cmd//\{cmd\}/$cmd_string}"
  final_cmd="${final_cmd//\{prompt_file\}/$escaped_prompt}"
  final_cmd="${final_cmd//\{output_file\}/$escaped_output}"
  final_cmd="${final_cmd//\{repo_root\}/$escaped_repo_root}"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] $final_cmd"
    printf 'DRY_RUN output for %s\n' "$cmd_string" > "$output_file"
    return 0
  fi

  cmd_word="${cmd_string%% *}"
  cmd_bin=""
  if [[ "$cmd_word" == */* ]]; then
    cmd_bin="$(dirname "$cmd_word")"
  fi

  run_path="$PATH"
  if [[ -n "$cmd_bin" ]]; then
    run_path="$cmd_bin:$run_path"
  fi

  timeout "$AGENT_TIMEOUT_SECONDS" env PATH="$run_path" bash -c "$final_cmd"
}

run_stage() {
  local stage_name="$1"
  local cmd_string="$2"
  local template="$3"
  local prompt_template="$4"
  local output_file="$5"

  local prompt_runtime_file="$ARTIFACTS_DIR/.prompt-${stage_name}.tmp.md"

  log "Stage ${stage_name}: render prompt"
  render_prompt "$prompt_template" "$prompt_runtime_file"

  log "Stage ${stage_name}: run agent"
  if ! run_with_template "$template" "$cmd_string" "$prompt_runtime_file" "$output_file"; then
    rm -f "$prompt_runtime_file"
    case "$stage_name" in
      architecture)
        echo "Stage architecture failed. If using Claude CLI, refresh auth with: claude setup-token" >&2
        ;;
      frontend|content)
        echo "Stage ${stage_name} failed. Verify Gemini CLI auth/session and rerun." >&2
        ;;
      backend)
        echo "Stage backend failed. Verify Codex CLI auth/session and rerun." >&2
        ;;
      *)
        echo "Stage ${stage_name} failed." >&2
        ;;
    esac
    return 1
  fi

  ensure_non_empty "$output_file"
  rm -f "$prompt_runtime_file"

  log "Stage ${stage_name}: output saved -> $output_file"
}

write_report() {
  local report_file="$REPORTS_DIR/pipeline-run-${PIPELINE_RUN_ID}.md"
  {
    echo "# Agent Pipeline Report"
    echo
    echo "- run_id: $PIPELINE_RUN_ID"
    echo "- generated_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "- dry_run: $DRY_RUN"
    echo "- language: $PIPELINE_LANG"
    echo
    echo "## Artifacts"
    echo "- $ARCH_OUTPUT"
    echo "- $FRONTEND_OUTPUT"
    echo "- $CONTENT_OUTPUT"
    echo "- $BACKEND_OUTPUT"
    echo
    echo "## Commands"
    echo "- claude: $CLAUDE_CMD"
    echo "- gemini: $GEMINI_CMD"
    echo "- codex: $CODEX_CMD"
  } > "$report_file"

  log "Report written -> $report_file"
}

main() {
  mkdir -p "$ARTIFACTS_DIR" "$REPORTS_DIR" "$SCHEMAS_DIR"

  ensure_file "$VALIDATOR"
  ensure_file "$NORMALIZER"
  ensure_file "$FRONTEND_VALIDATOR"
  ensure_file "$ARCH_PROMPT_TEMPLATE"
  ensure_file "$FRONTEND_PROMPT_TEMPLATE"
  ensure_file "$CONTENT_PROMPT_TEMPLATE"
  ensure_file "$BACKEND_PROMPT_TEMPLATE"

  if [[ "$PIPELINE_CLEAN" == "1" ]]; then
    log "Cleaning previous artifacts"
    rm -f "$ARCH_OUTPUT" "$FRONTEND_OUTPUT" "$CONTENT_OUTPUT" "$BACKEND_OUTPUT"
  fi

  if [[ "$DRY_RUN" -eq 0 ]]; then
    ensure_command "$CLAUDE_CMD"
    ensure_command "$GEMINI_CMD"
    ensure_command "$CODEX_CMD"
    ensure_command "python3"
  fi

  log "Run started (id=$PIPELINE_RUN_ID)"

  run_stage "architecture" "$CLAUDE_CMD" "$CLAUDE_RUN_TEMPLATE" "$ARCH_PROMPT_TEMPLATE" "$ARCH_OUTPUT"
  run_stage "frontend" "$GEMINI_CMD" "$GEMINI_DESIGN_RUN_TEMPLATE" "$FRONTEND_PROMPT_TEMPLATE" "$FRONTEND_OUTPUT"

  log "Validate frontend artifact quality"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    python3 "$FRONTEND_VALIDATOR" "$FRONTEND_OUTPUT"
  fi

  run_stage "content" "$GEMINI_CMD" "$GEMINI_CONTENT_RUN_TEMPLATE" "$CONTENT_PROMPT_TEMPLATE" "$CONTENT_OUTPUT"

  log "Validate content pack JSON"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    python3 "$NORMALIZER" "$CONTENT_OUTPUT"
    python3 "$VALIDATOR" "$CONTENT_OUTPUT"
  fi

  run_stage "backend" "$CODEX_CMD" "$CODEX_RUN_TEMPLATE" "$BACKEND_PROMPT_TEMPLATE" "$BACKEND_OUTPUT"

  write_report
  log "Pipeline finished successfully"
}

main "$@"
