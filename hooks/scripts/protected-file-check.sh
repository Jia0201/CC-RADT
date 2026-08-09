#!/usr/bin/env bash
set -euo pipefail

protected_prefixes=(
  "memory/"
  "kb/"
  "project/"
  "shared/tasks/"
  "shared/handoffs/"
  "agents/"
  "security/"
  "hooks/"
  ".claude/settings.json"
  ".claude/settings.local.example.json"
  "tools/commands/"
  "CLAUDE.md"
  "index/"
)

if [[ "$#" -eq 0 && ! -t 0 ]]; then
  hook_input="$(cat || true)"
  if [[ -n "$hook_input" ]] && command -v python3 >/dev/null 2>&1; then
    hook_paths=()
    parsed_paths="$(AI_TEAMS_HOOK_INPUT="$hook_input" python3 - <<'PY'
import json
import os

try:
    data = json.loads(os.environ.get("AI_TEAMS_HOOK_INPUT", ""))
except Exception:
    raise SystemExit(0)

paths = []
def walk(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in {"file_path", "path", "source", "target", "notebook_path"} and isinstance(value, str):
                paths.append(value)
            else:
                walk(value)
    elif isinstance(obj, list):
        for item in obj:
            walk(item)
walk(data.get("tool_input", data))
for item in paths:
    print(item)
PY
)"
    while IFS= read -r line; do
      [[ -n "$line" ]] && hook_paths+=("$line")
    done <<< "$parsed_paths"
    set -- "${hook_paths[@]+"${hook_paths[@]}"}"
  fi
fi

blocked=0
for path in "$@"; do
  for prefix in "${protected_prefixes[@]}"; do
    if [[ "$path" == "$prefix"* || "$path" == "$prefix" ]]; then
      echo "受保护文件需要确认后修改：$path" >&2
      blocked=1
    fi
  done
done

if [[ "$blocked" -eq 1 && "${AI_TEAMS_ALLOW_PROTECTED:-0}" != "1" ]]; then
  echo "如已完成锁检查和人工确认，可设置 AI_TEAMS_ALLOW_PROTECTED=1 后重试。" >&2
  exit 2
fi

echo "受保护文件检查通过。"
