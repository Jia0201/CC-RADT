---
id: "shared-supervision-template"
title: "并行监督检查模板"
type: "shared-template"
scope: "project"
owner: "lead"
status: active
---
# 并行监督检查模板

## 基本信息

- 任务 ID：
- 任务名称：
- Lead：
- 创建时间：
- 关闭前检查人：

## 监督状态

| Agent | 状态 | 结论 | 证据文件 | 完成时间 |
|---|---|---|---|---|
| Doc | pending |  |  |  |
| Memory | pending |  |  |  |
| Role | skipped | 未触发 Agent 指引维护 |  |  |
| Security-Reviewer | pending |  |  |  |

## 状态值

- `pending`：尚未处理。
- `done`：已完成检查。
- `blocked`：发现阻断问题。
- `skipped`：明确跳过并写明原因。

## Lead 关闭条件

非平凡任务关闭前，Doc、Memory、Security-Reviewer 必须全部为 `done` 或 `skipped`。Role 默认可为 `skipped`，但当任务涉及 Agent、索引、规则、Tools、Hooks、MCP、Skills、目录结构、playbook 或职责边界变化时，Role 必须为 `done` 或 `blocked`。任何 `blocked` 都必须进入 [retry-flowback](../escalations/retry-flowback.md) 或由 Lead 仲裁。
