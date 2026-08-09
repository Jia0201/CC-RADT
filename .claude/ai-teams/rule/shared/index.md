---
id: "rule-shared-index"
title: "共享工作区路由"
type: "rule-index"
scope: "project"
owner: "lead"
status: active
---
# 共享工作区路由

| 当前动作 | 读取或写入位置 | 规则入口 |
|---|---|---|
| 创建任务 | `shared/tasks/`、[TASK_TEMPLATE](../../shared/tasks/TASK_TEMPLATE.md) | [task-policy](../../security/task-policy.md) |
| 创建执行方案 | [EXECUTION_PLAN_TEMPLATE](../../shared/tasks/EXECUTION_PLAN_TEMPLATE.md) | [plans](../project/plans.md) |
| 更新任务状态 | [task-plan](../../shared/task-plan.md) | [state-policy](../../security/state-policy.md), [state-transaction-policy](../../security/state-transaction-policy.md) |
| 更新 Agent 流水线 | [pipeline-status](../../shared/pipeline-status.md) | [state-policy](../../security/state-policy.md) |
| 多文件加锁 | [LOCKS](../../shared/locks/LOCKS.md), [LOCK_TEMPLATE](../../shared/locks/LOCK_TEMPLATE.md) | [lock-policy](../../security/lock-policy.md) |
| Agent 交接 | `shared/handoffs/`、[HANDOFF_TEMPLATE](../../shared/handoffs/HANDOFF_TEMPLATE.md) | [protocol](../../shared/protocol.md) |
| 广播 | [BROADCAST_PROTOCOL](../../shared/broadcasts/BROADCAST_PROTOCOL.md) | [protocol](../../shared/protocol.md) |
| 当前任务决策 | `shared/decisions/` | [decisions](../project/decisions.md) |
| 接口契约 | [index](../../shared/contracts/index.md) | [interface-contract-policy](../../security/interface-contract-policy.md) |
| 失败回流 | [index](../../shared/escalations/index.md), [retry-flowback](../../shared/escalations/retry-flowback.md) | [escalation-policy](../../security/escalation-policy.md) |
| 监督与心跳 | [index](../../shared/supervision/index.md), [heartbeat-current](../../shared/supervision/heartbeat-current.md) | [supervision-policy](../../security/supervision-policy.md) |
| 文档关系实时维护 | [运行期维护策略](../../security/runtime-maintenance-policy.md) | [导航规范](../../index/NAVIGATION.md) |

Agent 只打开当前任务使用的工作区文件。历史任务、已关闭回流和旧交接不属于默认上下文。
