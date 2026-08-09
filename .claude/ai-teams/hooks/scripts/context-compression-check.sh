#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_FILE="$ROOT_DIR/hooks/configs/context-compression.example.env"

if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

threshold_chars="${AI_TEAMS_CONTEXT_THRESHOLD_CHARS:-50000}"
threshold_files="${AI_TEAMS_CONTEXT_THRESHOLD_FILES:-20}"
target_dir="${AI_TEAMS_CONTEXT_TARGET_DIR:-memory/conversations/sessions}"
notice_dir="${AI_TEAMS_CONTEXT_NOTICE_DIR:-memory/conversations/compact}"
action="${AI_TEAMS_CONTEXT_ACTION:-write-notice}"
hook_transcript_path=""

if [[ ! -t 0 ]]; then
  hook_input="$(cat || true)"
  if [[ -n "$hook_input" ]] && command -v python3 >/dev/null 2>&1; then
    hook_transcript_path="$(AI_TEAMS_HOOK_INPUT="$hook_input" python3 - <<'PY'
import json
import os

try:
    data = json.loads(os.environ.get("AI_TEAMS_HOOK_INPUT", "") or "{}")
except Exception:
    raise SystemExit(0)
value = data.get("transcript_path") or data.get("transcriptPath")
if isinstance(value, str):
    print(value)
PY
)"
  fi
fi

target_path="$ROOT_DIR/$target_dir"
notice_path="$ROOT_DIR/$notice_dir"

if [[ -n "$hook_transcript_path" && -f "$hook_transcript_path" ]]; then
  target_dir="$hook_transcript_path"
  target_path="$hook_transcript_path"
fi

if [[ ! -d "$target_path" && ! -f "$target_path" ]]; then
  echo "上下文压缩检查：目标目录不存在：$target_dir"
  exit 0
fi

if [[ -f "$target_path" ]]; then
  current_files=1
  current_chars="$(wc -c < "$target_path" | tr -d ' ')"
else
  current_files="$(find "$target_path" -type f 2>/dev/null | wc -l | tr -d ' ')"
  current_chars="$(find "$target_path" -type f \( -name "*.md" -o -name "*.jsonl" -o -name "*.json" -o -name "*.txt" \) -print0 2>/dev/null | xargs -0 wc -c 2>/dev/null | awk 'END {print $1+0}')"
fi

echo "上下文压缩检查：files=$current_files chars=$current_chars threshold_files=$threshold_files threshold_chars=$threshold_chars"

if [[ "$current_files" -lt "$threshold_files" && "$current_chars" -lt "$threshold_chars" ]]; then
  exit 0
fi

echo "建议触发上下文压缩：bash tools/bin/ai-teams-context-compact.sh --source \"$target_dir\" --write"

if [[ "$action" == "write-notice" ]]; then
  mkdir -p "$notice_path"
  timestamp="$(date +%Y%m%d-%H%M%S)"
  notice_file="$notice_path/$timestamp-context-compression-notice.md"
  {
    echo "---"
    echo "id: \"context-compression-notice-$timestamp\""
    echo "title: \"上下文压缩提示 $timestamp\""
    echo "type: \"memory-candidate\""
    echo "scope: \"project\""
    echo "owner: \"memory\""
    echo "status: \"draft\""
    echo "---"
    echo "# 上下文压缩提示 $timestamp"
    echo
    echo "- 检测目标：$target_dir"
    echo "- 当前文件数：$current_files"
    echo "- 当前字符数：$current_chars"
    echo "- 文件阈值：$threshold_files"
    echo "- 字符阈值：$threshold_chars"
    echo
    echo "建议运行："
    echo
    echo '```bash'
    echo "bash tools/bin/ai-teams-context-compact.sh --source \"$target_dir\" --write"
    echo '```'
  } > "$notice_file"
  echo "已写入提示：$notice_file"
fi
