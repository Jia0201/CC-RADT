---
id: "shared-supervision-current"
title: "当前并行监督状态"
type: "shared-status"
scope: "project"
owner: "lead"
status: active
---
# 当前并行监督状态

当前没有进行中的并行监督任务。

本文件是并行监督状态的汇总视图。Doc、Memory、Role、Security-Reviewer 的监督动作优先写入 `shared/events/`；Lead 关闭任务或汇总监督状态时按 `security/state-transaction-policy.md` 更新本文件。

## 使用方式

1. Plan-PM 创建非平凡任务执行方案后，Lead 按模板创建本轮监督状态。
2. Doc、Memory、Security-Reviewer 分别更新自己的行。
3. Role 按触发条件参与：涉及 Agent、索引、规则、Tools、Hooks、MCP、Skills、目录结构、playbook 或职责边界变化时必须更新自己的行。
4. Lead 关闭任务前检查本文件，不得在监督未完成时关闭任务。
5. 本文件管理 Doc/Memory/Role/Security-Reviewer 的业务监督结论；实时 Agent 存活、错误、权限和跑偏检查由 [heartbeat-current](./heartbeat-current.md) 承载。
