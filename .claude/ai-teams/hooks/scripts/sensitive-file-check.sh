#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/tools/bin/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

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
  if ai_teams_is_sensitive_path "$path"; then
    echo "阻止读取敏感文件内容：$path" >&2
    blocked=1
  fi
done

if [[ "$blocked" -eq 1 ]]; then
  exit 2
fi

echo "敏感文件检查通过。"
