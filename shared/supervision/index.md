---
id: "shared-supervision-index"
title: "并行监督索引"
type: "shared-index"
scope: "project"
owner: "lead"
status: active
---
# 并行监督索引

本目录记录非平凡任务中 Doc、Memory、Role、Security-Reviewer 的并行监督状态。它是共享工作区的一部分，不替代 `logs/`、`memory/`、`project/` 或 `kb/`。

## 文件

| 文件 | 用途 |
|---|---|
| [current](./current.md) | 当前并行监督状态汇总视图 |
| [SUPERVISION_TEMPLATE](./SUPERVISION_TEMPLATE.md) | 创建单次监督状态的模板 |
| [heartbeat](./heartbeat.md) | 10 秒心跳、事件接入和 Lead 接管协议 |
| [heartbeat-current](./heartbeat-current.md) | 当前 Agent 活动、错误、跑偏/停滞与接管状态 |

## 使用规则

1. Lead 或 Plan-PM 创建非平凡任务时，按模板明确监督 Agent 和检查项。
2. Doc、Memory、Role、Security-Reviewer 优先向 [index](../events/index.md) 追加状态事件。
3. 需要同步更新 `shared/task-plan.md`、`shared/pipeline-status.md` 和 [current](./current.md) 时，先创建 [index](../transactions/index.md) 事务。
4. Lead 关闭任务前必须检查 [runtime-maintenance-policy](../../security/runtime-maintenance-policy.md) 和 [state-transaction-policy](../../security/state-transaction-policy.md)，确认监督结论已完成或有明确跳过原因。
5. 多 Agent 运行期间，Lead 每 10 秒检查 [heartbeat-current](./heartbeat-current.md)；异常处理遵循 [supervision-policy](../../security/supervision-policy.md)。
