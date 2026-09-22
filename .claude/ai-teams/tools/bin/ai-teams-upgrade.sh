#!/usr/bin/env bash
set -euo pipefail

# Retired entry point: no shared library, project discovery, snapshots or writes.
printf '%s\n' \
  '工程内升级脚本已停用，不再执行升级，也不提供 dry-run 或创建快照。' \
  '请退出目标项目的 Claude Code、Agent、Hook 和观察台写入任务，使用项目目录之外的 CC-RADT 外部升级器。' \
  '先只读预览；核对旧、新清单的完整 SHA-256 指纹并由用户在 UI/CLI 明确认可信任后，才可申请 apply。' \
  '未签名清单默认仅可预览；生成清单或 --seal 不等于官方签名或用户授权。' \
  '操作与安全边界见 tools/commands/ai/upgrade-existing.md 和 security/upgrade-policy.md。'

if [[ $# -eq 1 && ( "$1" == '--help' || "$1" == '-h' ) ]]; then
  exit 0
fi
exit 2
