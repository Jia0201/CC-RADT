#!/usr/bin/env bash
set -euo pipefail

echo "# AI-Teams Status"
echo

echo "版本："
cat VERSION 2>/dev/null || echo "未知"
echo

echo "Manifest："
cat MANIFEST.json 2>/dev/null || true
echo

echo "Git 辅助状态："
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch="$(git branch --show-current 2>/dev/null || true)"
  head="$(git rev-parse --short HEAD 2>/dev/null || true)"
  changed="$(git status --short 2>/dev/null | awk 'NF { count++ } END { print count + 0 }')"
  echo "- 分支：${branch:-detached}"
  echo "- HEAD：${head:-unknown}"
  echo "- 工作区变更数量：${changed}"
else
  echo "- 未发现 Git 仓库，已跳过 Git 辅助扫描。"
fi
echo

echo "锁："
cat shared/locks/LOCKS.md 2>/dev/null || echo "未找到 LOCKS.md"
echo

echo "索引状态："
grep -R "^status:" index/*.md 2>/dev/null || true
echo

echo "指令文档："
find tools/commands/ai -maxdepth 1 -type f -name "*.md" 2>/dev/null | sort || true
echo

echo "Agent 文档："
find agents -mindepth 2 -maxdepth 2 -type f -name "*.md" 2>/dev/null | sort || true
