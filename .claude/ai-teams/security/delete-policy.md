---
id: "security-delete-policy"
title: "删除规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 删除规则

## 删除分级

| 等级 | 范围 | 规则 |
|---|---|---|
| L0 | 临时缓存、明确生成的空目录、任务临时草稿 | 可按任务单删除，但必须说明原因 |
| L1 | `logs/` 中过期普通日志、可重建报告 | 先归档或按日志清理指令处理 |
| L2 | `shared/` 活动任务、锁、回流、状态文件 | 不直接删除，只允许关闭、归档或标记状态 |
| L3 | `agents/`、`memory/`、`kb/`、`security/`、`hooks/`、`tools/commands/`、`index/` | 禁止直接删除，必须 Lead + Owner 确认 |
| L4 | 用户项目文件、敏感文件、密钥、证书、环境配置 | 必须获得用户明确确认；敏感内容不得读取 |

## 禁止直接删除

- 用户项目文件。
- `memory/MEMORY.md` 和 `memory/agents/*/MEMORY.md`。
- `agents/` 中任何 Agent 本体文件。
- `security/` 规则文件。
- `shared/task-plan.md`、`shared/pipeline-status.md`、`shared/locks/LOCKS.md`。
- `.claude/settings.json` 和 `.claude/settings.local.example.json`。
- 任何疑似密钥、证书、token、credentials、`.env` 文件内容。

## 删除前检查

1. 列出拟删除路径。
2. 检查文件所有权：[file-ownership](./file-ownership.md)。
3. 检查锁：[LOCKS](../shared/locks/LOCKS.md)。
4. 判断删除等级。
5. 说明删除原因、影响范围和恢复方式。
6. L2 及以上必须记录到任务交接或审计日志。
7. L4 必须获得用户明确确认。

## 快照与回滚

- L2/L3 删除或迁移前必须优先使用归档、移动或状态标记。
- 必须删除时，先创建快照或备份路径，并记录恢复命令。
- 当前目录不是 Git 仓库时，不得把 `git` 当作唯一回滚手段。

## 敏感文件处理

- 只检测路径和存在性。
- 不读取内容。
- 不复制到日志、记忆、知识库、压缩摘要或交接。
- 用户要求删除敏感文件时，先确认路径和意图，再执行受控删除。

## 日志要求

删除或迁移后记录：

- 删除路径。
- 删除等级。
- 确认者。
- 快照或备份位置。
- 影响范围。
- 验证结果。
