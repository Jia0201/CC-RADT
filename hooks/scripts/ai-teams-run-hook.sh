#!/usr/bin/env bash
set -euo pipefail

script="${1:-}"
if [[ -z "$script" || "$script" == */* ]]; then
  echo "AI-Teams hook runner requires a hook script basename." >&2
  exit 0
fi

node_runner_candidates=()
if [[ -n "${AI_TEAMS_ROOT:-}" ]]; then
  node_runner_candidates+=("$AI_TEAMS_ROOT/hooks/scripts/ai-teams-run-hook.mjs")
fi
if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
  node_runner_candidates+=("$CLAUDE_PROJECT_DIR/.claude/ai-teams/hooks/scripts/ai-teams-run-hook.mjs")
fi
node_runner_candidates+=(
  ".claude/ai-teams/hooks/scripts/ai-teams-run-hook.mjs"
  "hooks/scripts/ai-teams-run-hook.mjs"
)

if command -v node >/dev/null 2>&1; then
  for candidate in "${node_runner_candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      exec node "$candidate" "$script"
    fi
  done
fi

input_file="$(mktemp "${TMPDIR:-/tmp}/ai-teams-hook-input.XXXXXX")"
trap 'rm -f "$input_file"' EXIT
cat >"$input_file" || true

candidates=()
if [[ -n "${AI_TEAMS_ROOT:-}" ]]; then
  candidates+=("$AI_TEAMS_ROOT/hooks/scripts/$script")
fi
if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
  candidates+=("$CLAUDE_PROJECT_DIR/.claude/ai-teams/hooks/scripts/$script")
fi
candidates+=(
  ".claude/ai-teams/hooks/scripts/$script"
  "hooks/scripts/$script"
)

for candidate in "${candidates[@]}"; do
  if [[ -f "$candidate" ]]; then
    exec bash "$candidate" <"$input_file"
  fi
done

echo "AI-Teams hook not found: $script" >&2
exit 0
