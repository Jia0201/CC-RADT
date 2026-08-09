#!/usr/bin/env bash
set -euo pipefail

target="${1:-.}"
if [[ ! -d "$target" ]]; then
  echo "精简安装包目录不存在：$target" >&2
  exit 1
fi

required_agents=(lead pd plan-pm dev qa doc memory role security-reviewer)
missing=0

echo "== 精简安装包核心 Agent =="
for agent in "${required_agents[@]}"; do
  if [[ ! -f "$target/agents/$agent/$agent.md" ]]; then
    echo "缺失：agents/$agent/$agent.md"
    missing=1
  else
    echo "正常：agents/$agent/$agent.md"
  fi
done

echo
echo "== .claude 最小化 =="
claude_extra="$(find "$target/.claude" -type f \
  ! -path "$target/.claude/settings.json" \
  ! -path "$target/.claude/settings.local.example.json" \
  -print 2>/dev/null || true)"
if [[ -n "$claude_extra" ]]; then
  echo "错误：.claude 中存在非 settings 文件。"
  printf "%s\n" "$claude_extra"
  missing=1
else
  echo "正常：.claude 只包含 settings 文件"
fi

echo
echo "== 精简安装包裁剪检查 =="
if find "$target/agents" -mindepth 1 -maxdepth 1 -type d -name 'dev-*' | grep -q .; then
  echo "错误：精简安装包不应包含开发细分 Agent。"
  missing=1
else
  echo "正常：未包含开发细分 Agent。"
fi

if [[ ! -f "$target/index/SIMPLIFY.md" ]]; then
  echo "缺失：index/SIMPLIFY.md"
  missing=1
else
  echo "正常：index/SIMPLIFY.md"
fi

if [[ "$missing" -eq 1 ]]; then
  echo
  echo "精简安装包自检失败。"
  exit 1
fi

echo
echo "精简安装包自检通过。"
