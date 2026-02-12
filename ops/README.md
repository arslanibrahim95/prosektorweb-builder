# Agent Orchestration

This directory contains CLI orchestration assets for a multi-agent workflow:
- `prompts/`: stage prompts for Claude, Gemini, and Codex CLIs
- `artifacts/`: generated stage outputs
- `reports/`: per-run pipeline reports
- `schemas/`: content package schema references
- `scripts/validate_frontend_artifact.py`: frontend design quality guardrail validator

Run pipeline from repo root:

```bash
./scripts/agent_pipeline.sh
```

Default execution mode (already baked into the script):
- Claude stage: `claude -p --output-format text --permission-mode dontAsk --tools ""`
- Gemini stages: `gemini -p "" -o text`
- Codex stage: `codex exec - -C <repo_root> --sandbox workspace-write -o <output>`

If your CLI binaries are not on `PATH`, run with explicit command paths:

```bash
CLAUDE_CMD="$HOME/.nvm/versions/node/v24.13.0/bin/claude" \
GEMINI_CMD="$HOME/.nvm/versions/node/v24.13.0/bin/gemini" \
CODEX_CMD="$HOME/.nvm/versions/node/v24.13.0/bin/codex" \
./scripts/agent_pipeline.sh
```

Useful flags:

```bash
./scripts/agent_pipeline.sh --dry-run
```

Environment overrides:

- `GEMINI_CMD`, `CLAUDE_CMD`, `CODEX_CMD`
- `CLAUDE_RUN_TEMPLATE`, `GEMINI_DESIGN_RUN_TEMPLATE`, `GEMINI_CONTENT_RUN_TEMPLATE`, `CODEX_RUN_TEMPLATE`
- `PIPELINE_RUN_ID`, `PIPELINE_LANG`, `PIPELINE_PROJECT_CONTEXT`
- `AGENT_TIMEOUT_SECONDS`, `PIPELINE_CLEAN`

Template placeholders:
- `{cmd}`, `{prompt_file}`, `{output_file}`, `{repo_root}`

Auth notes:
- Claude stage requires a valid Claude CLI login/token (`claude setup-token` if expired).
- Gemini stage requires cached credentials or configured API key.
- Codex stage requires active Codex CLI login/session.

Quality gates:
- Frontend output must satisfy modern-corporate, light-first guardrails.
- Content output is normalized to strict JSON and validated.
