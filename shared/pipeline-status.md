---
id: "shared-pipeline-status"
title: "流水线状态"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 流水线状态

本文件记录 Agent 在任务流水线中的实时状态。它用于支持任务调度、重试、回流和 Lead 仲裁，是状态汇总视图，不替代任务单、执行方案、交接、事件、事务或日志。更新规则见 [state-policy](../security/state-policy.md) 和 [state-transaction-policy](../security/state-transaction-policy.md)。

## Agent 状态

| Agent | 状态 | 当前任务 | attempt | 尝试计数 | 备注 |
|---|---|---|---:|---|---|
| Lead | IDLE | - | 0 | 1/4 | - |
| PD | IDLE | - | 0 | 1/4 | - |
| Plan-PM | IDLE | - | 0 | 1/4 | - |
| Dev-Frontend-Web | IDLE | - | 0 | 1/4 | - |
| Dev-Frontend-Miniapp | IDLE | - | 0 | 1/4 | - |
| Dev-Backend-Systems | IDLE | - | 0 | 1/4 | - |
| Dev-Backend-Service | IDLE | - | 0 | 1/4 | - |
| QA | IDLE | - | 0 | 1/4 | - |
| Memory | IDLE | - | 0 | 1/4 | - |
| Doc | IDLE | - | 0 | 1/4 | - |
| Role | IDLE | - | 0 | 1/4 | - |
| Security-Reviewer | IDLE | - | 0 | 1/4 | - |

## 状态词

| 状态 | 含义 |
|---|---|
| `IDLE` | 空闲 |
| `DOING` | 执行中 |
| `RETRYING` | 正在按重试策略处理失败 |
| `FLOWBACK` | 已进入回流复核 |
| `BLOCKED` | 被依赖、信息、权限或安全阻塞 |
| `REVIEW` | 等待 Lead / QA / Owner 复核 |

## 回流恢复规则

- 进入回流时，相关 Agent 状态设为 `FLOWBACK`。
- 复核完成并重建任务后，Lead 将相关 Agent 从 `RETRYING` 或 `FLOWBACK` 切回 `IDLE` 或 `DOING`。
- 状态变更必须能追溯到任务单、执行方案、交接、决策或 escalation 文件。

## 更新规则

- Agent 开始执行时从 `IDLE` 改为 `DOING`。
- Agent 阻塞时改为 `BLOCKED` 并写明关联任务。
- Agent 进入重试时改为 `RETRYING` 并更新 attempt。
- Agent 进入回流时改为 `FLOWBACK`。
- 等待 QA 或 Lead 复核时改为 `REVIEW`。
- 任务关闭后恢复为 `IDLE`，并保留任务引用。
- 普通 Agent 不直接编辑本文件，先写 [index](./events/index.md)。
- Lead 汇总前必须取得本文件锁；跨状态板变化必须引用 [index](./transactions/index.md)。
