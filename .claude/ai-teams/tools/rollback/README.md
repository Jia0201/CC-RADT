---
id: "tools-rollback-readme"
title: "回滚工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 回滚工具

## 用途

保存回滚工具说明。实际脚本位于 `tools/bin/ai-teams-rollback.sh`。

## 状态

v1.0 最小可执行版本已创建。

## 输入

- `--list`：列出可用快照。
- `--snapshot <路径>`：指定回滚快照。
- `--plan`：只生成回滚计划。
- `--apply --yes`：执行回滚。

## 输出

- `tools/rollback/snapshots/pre-rollback-*`
- `logs/audit/rollback-*.md`
- `index/STATUS.md`

## 安全边界

- 默认只生成计划。
- 执行回滚必须显式传入 `--apply --yes`。
- 回滚后运行结构自检。

## 使用示例

```bash
bash tools/bin/ai-teams-rollback.sh --list
bash tools/bin/ai-teams-rollback.sh --snapshot tools/rollback/snapshots/upgrade-YYYYMMDD-HHMMSS --plan
```
