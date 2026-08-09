#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 0 && ! -t 0 ]]; then
  hook_input="$(cat || true)"
  if [[ -n "$hook_input" ]] && command -v python3 >/dev/null 2>&1; then
    hook_commands=()
    parsed_commands="$(AI_TEAMS_HOOK_INPUT="$hook_input" python3 - <<'PY'
import json
import os

try:
    data = json.loads(os.environ.get("AI_TEAMS_HOOK_INPUT", ""))
except Exception:
    raise SystemExit(0)
tool_input = data.get("tool_input", data)
command = tool_input.get("command") if isinstance(tool_input, dict) else None
if command:
    print(command)
PY
)"
    while IFS= read -r line; do
      [[ -n "$line" ]] && hook_commands+=("$line")
    done <<< "$parsed_commands"
    set -- "${hook_commands[@]+"${hook_commands[@]}"}"
  fi
fi

if [[ $# -eq 0 ]]; then
  echo "未提供删除目标。"
  exit 0
fi

echo "删除检查目标："
printf -- "- %s\n" "$@"

joined="$*"
if [[ ! "$joined" =~ (^|[[:space:];&|])(rm|unlink|rmdir)([[:space:]]|$) ]]; then
  echo "未检测到删除命令，跳过删除确认。"
  exit 0
fi

if [[ "${AI_TEAMS_CONFIRM_DELETE:-0}" != "1" ]]; then
  echo "删除操作需要明确确认。设置 AI_TEAMS_CONFIRM_DELETE=1 后才允许继续。" >&2
  exit 2
fi

echo "删除确认已提供。"
