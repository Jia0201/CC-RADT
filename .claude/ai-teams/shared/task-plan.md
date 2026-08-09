---
id: "shared-task-plan"
title: "任务计划状态"
type: "shared-doc"
scope: "target-project"
owner: "plan-pm"
status: active
---
# 任务计划状态

本文件是任务计划状态汇总视图。普通 Agent 优先写 shared/events/，跨状态板变更写 shared/transactions/，Lead / Plan-PM 再按 security/state-transaction-policy.md 汇总。

## 状态字段

| 字段 | 含义 |
|---|---|
| 工作流编号 | `WF-01` 到 `WF-12`，记录实际采用的工作流 |
| Owner | 当前负责 Agent |
| 状态 | `TODO` / `DOING` / `RETRYING` / `FLOWBACK` / `REVIEW` / `DONE` / `CANCELLED` |
| attempt | `0` 到 `3` 为可重试范围；`4+` 进入回流 |
| 下一步 | 下一次动作或回流复核动作 |

## 活动任务

| 任务 ID | 工作流编号 | Owner | 状态 | attempt | 尝试计数 | 上游 | 最近失败 | 下一步 |
|---|---|---|---|---:|---|---|---|---|
| 当前无活动任务 | - | Lead | TODO | 0 | 1/4 | - | - | 等待任务单 |
