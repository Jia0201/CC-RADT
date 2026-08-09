#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_path="memory/conversations/sessions"
output_dir="memory/conversations/compact"
write=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      source_path="${2:-}"
      shift 2
      ;;
    --output)
      output_dir="${2:-}"
      shift 2
      ;;
    --write)
      write=1
      shift
      ;;
    --dry-run)
      write=0
      shift
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ "$source_path" == /* ]]; then
  abs_source="$source_path"
else
  abs_source="$ROOT_DIR/$source_path"
fi

if [[ "$output_dir" == /* ]]; then
  abs_output="$output_dir"
else
  abs_output="$ROOT_DIR/$output_dir"
fi

if [[ ! -e "$abs_source" ]]; then
  echo "来源不存在：$source_path" >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
output_file="$abs_output/$timestamp-context-compact.md"

file_count=0
source_summary=""
heading_summary=""
if [[ -d "$abs_source" ]]; then
  file_count="$(find "$abs_source" -type f \( -name "*.md" -o -name "*.jsonl" -o -name "*.json" -o -name "*.txt" \) 2>/dev/null | wc -l | tr -d ' ')"
  source_summary="$(find "$abs_source" -type f \( -name "*.md" -o -name "*.jsonl" -o -name "*.json" -o -name "*.txt" \) 2>/dev/null | sort | sed "s#^$ROOT_DIR/##" | head -20 | sed 's#^#- `#; s#$#`#')"
  heading_summary="$(find "$abs_source" -type f -name "*.md" 2>/dev/null | sort | head -10 | while IFS= read -r file; do
    rel="${file#$ROOT_DIR/}"
    grep -E '^#{1,4} ' "$file" 2>/dev/null | head -5 | sed "s#^#- \`$rel\`：#"
  done)"
else
  file_count=1
  rel_source="${abs_source#$ROOT_DIR/}"
  source_summary="- \`$rel_source\`"
  if [[ "$abs_source" == *.md ]]; then
    heading_summary="$(grep -E '^#{1,4} ' "$abs_source" 2>/dev/null | head -20 | sed "s#^#- \`$rel_source\`：#")"
  fi
fi
[[ -n "$source_summary" ]] || source_summary="- 未提取到可列举的恢复材料。"
[[ -n "$heading_summary" ]] || heading_summary="- 未提取到 Markdown 标题线索。"

echo "上下文压缩计划"
echo "- source: $source_path"
echo "- output: $output_dir"
echo "- files: $file_count"
echo "- write: $write"

if [[ "$write" -ne 1 ]]; then
  exit 0
fi

mkdir -p "$abs_output"
{
  echo "---"
  echo "id: \"context-compact-$timestamp\""
  echo "title: \"上下文压缩摘要 $timestamp\""
  echo "type: \"memory-compact\""
  echo "scope: \"project\""
  echo "owner: \"memory\""
  echo "status: \"draft\""
  echo "---"
  echo "# 上下文压缩摘要 $timestamp"
  echo
  echo "## 来源"
  echo
  echo "- 路径：$source_path"
  echo "- 文件数：$file_count"
  echo
  echo "## 恢复状态"
  echo
  echo "- 这是手动上下文压缩摘要，不是正式记忆。"
  echo "- Memory 需要筛选后，才能写入共享记忆或 Agent 独立记忆。"
  echo
  echo "## 最近材料"
  echo
  printf '%s\n' "$source_summary"
  echo
  echo "## Markdown 标题线索"
  echo
  printf '%s\n' "$heading_summary"
  echo
  echo "## 当前目标"
  echo
  echo "- 由 Memory 结合当前任务、交接和用户最新指令补充。"
  echo
  echo "## 已完成"
  echo
  echo "- 由 Memory 根据任务交接补充；不得凭空推断。"
  echo
  echo "## 未完成"
  echo
  echo "- 由 Lead/Memory 根据任务状态板和交接补充。"
  echo
  echo "## 已知风险与禁止范围"
  echo
  echo "- 不读取敏感文件内容。"
  echo "- 不直接写正式记忆。"
  echo "- 不把 Claude Code 原生 auto memory 目录作为事实来源。"
  echo "- 不复制原始 transcript 大段内容。"
  echo
  echo "## 下一步建议"
  echo
  echo "- Lead 使用本文件恢复当前任务范围和下一步。"
  echo "- Memory 筛选候选记忆。"
  echo "- Doc 判断是否需要刷新 project/、索引或知识图谱。"
  echo "- Security-Reviewer 检查是否有敏感内容或越权痕迹。"
  echo
  echo "## 候选记忆"
  echo
  echo "- 待 Memory 从当前任务事实中筛选，不自动提升。"
  echo
  echo "## 候选知识"
  echo
  echo "- 待 Doc 判断；动作规则不得写入 KB。"
  echo
  echo "## Memory 处理要求"
  echo
  echo "- 正式记忆只写入 \memory/MEMORY.md\ 或 \memory/agents/<agent>/MEMORY.md\。"
  echo "- 只保存长期可恢复事实，不保存临时过程。"
  echo "- 发现敏感内容时只保留非敏感摘要，并标记来源已隐藏。"
} > "$output_file"

echo "已写入：$output_file"
