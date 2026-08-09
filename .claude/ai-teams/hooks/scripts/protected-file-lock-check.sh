#!/usr/bin/env bash
set -euo pipefail

lock_file="shared/locks/LOCKS.md"
if [[ ! -f "$lock_file" ]]; then
  echo "缺少锁文件：$lock_file" >&2
  exit 2
fi

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
  case "$path" in
    agents/*|memory/*|kb/*|project/*|security/*|hooks/*|tools/commands/*|index/*|CLAUDE.md|.claude/settings.json|.claude/settings.local.example.json)
      if ! grep -Fq "$path" "$lock_file"; then
        echo "受保护路径未登记锁：$path" >&2
        blocked=1
      fi
      ;;
  esac
done

if [[ "$blocked" -eq 1 && "${AI_TEAMS_ALLOW_UNLOCKED_PROTECTED:-0}" != "1" ]]; then
  echo "请先在 shared/locks/LOCKS.md 登记，或明确设置 AI_TEAMS_ALLOW_UNLOCKED_PROTECTED=1。" >&2
  exit 2
fi

echo "受保护文件锁检查通过。"
