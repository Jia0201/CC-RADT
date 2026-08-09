---
id: "shared-index"
title: "共享工作区"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 共享工作区

共享工作区是 AI-Teams Agent 的正式沟通区域。

## 目录

- `shared/tasks/`
- `shared/handoffs/`
- `shared/broadcasts/`
- `shared/decisions/`
- `shared/escalations/`
- `shared/locks/`
- `shared/supervision/`
- `shared/events/`
- `shared/transactions/`
- `shared/`
- `shared/workspace/`
- `shared/prompt-evolution/`
- `shared/task-plan.md`
- `shared/pipeline-status.md`

## 入口文件

- [protocol](./protocol.md)：共享通信总协议。
- [workspace-policy](../security/workspace-policy.md)：共享工作区写入规则。
- [task-plan](./task-plan.md)：任务计划、Lead 接管和定向重试状态。
- [pipeline-status](./pipeline-status.md)：Agent 流水线状态。
- [index](./escalations/index.md)：Lead 接管后仍需跨 Agent、等待或升级的回流记录。
- [retry-flowback](./escalations/retry-flowback.md)：重试与回流协议。
- [BROADCAST_PROTOCOL](./broadcasts/BROADCAST_PROTOCOL.md)：广播协议。
- [LOCKS](./locks/LOCKS.md)：轻量锁登记。
- [LOCK_TEMPLATE](./locks/LOCK_TEMPLATE.md)：锁记录模板。
- [current](./supervision/current.md)：非平凡任务并行监督状态。
- [index](./supervision/index.md)：并行监督索引。
- [SUPERVISION_TEMPLATE](./supervision/SUPERVISION_TEMPLATE.md)：Doc / Memory / Security-Reviewer 并行监督模板。
- [heartbeat](./supervision/heartbeat.md)：10 秒心跳与 Lead 接管协议。
- [heartbeat-current](./supervision/heartbeat-current.md)：实时 Agent 活动、失败、权限和停滞状态。
- [index](./events/index.md)：追加式事件日志索引，用于降低状态板并发写入冲突。
- [EVENT_TEMPLATE](./events/EVENT_TEMPLATE.md)：状态事件模板。
- [index](./transactions/index.md)：跨状态板事务索引。
- [TRANSACTION_TEMPLATE](./transactions/TRANSACTION_TEMPLATE.md)：状态事务模板。
- `shared/tasks/TASK_TEMPLATE.md`：任务单模板。
- [EXECUTION_PLAN_TEMPLATE](./tasks/EXECUTION_PLAN_TEMPLATE.md)：任务执行方案模板。
- `shared/handoffs/HANDOFF_TEMPLATE.md`：交接模板。
- `shared/decisions/DECISION_TEMPLATE.md`：决策模板。
- [运行期维护策略](../security/runtime-maintenance-policy.md)：Doc、Memory、Role 的持续维护动作。
- [导航规范](../index/NAVIGATION.md)：标准 Markdown 链接与文档关系维护方式。
- [index](../project/adr/index.md)：长期结构性决策记录。
- [index](./contracts/index.md)：前后端、跨服务和公共接口契约的运行期登记入口。
- [interface-contract-policy](../security/interface-contract-policy.md)：字段、兼容性、QA 门禁和 Doc 更新规则。
- [adr](../security/adr.md)：ADR 创建和验收规范。
- [index](./prompt-evolution/index.md)：提示词失败事实、候选、评审和当前激活状态。
- [prompt-evolution-policy](../security/prompt-evolution-policy.md)：提示词进化动作与审批规则。

## 使用顺序

1. Lead 根据用户需求创建或引用任务单。
2. 参与 Agent 按任务单读取上下文和广播。
3. 需要并行写同一范围时先登记锁。
4. Agent 将阶段输出写入指定目录。
5. Agent 完成后写交接。
6. 多 Agent 运行期间，Lead 每 10 秒检查 [heartbeat-current](./supervision/heartbeat-current.md)。
7. 如任务失败，按 [retry-flowback](./escalations/retry-flowback.md) 立即进入 Lead 诊断；最多一次定向重试。
8. 非平凡任务关闭前，Lead 检查 [current](./supervision/current.md)，确认 Doc、Memory、Security-Reviewer 已完成或明确跳过。
9. Lead 检查交接、日志、验证和风险，再决定进入 QA、Memory、Doc、回流或结束。

## 边界

- 共享工作区不保存敏感文件内容。
- 共享工作区不替代正式记忆；长期事实交给 Memory。
- 共享工作区不替代知识库；稳定知识交给 Doc。
- 共享工作区不替代日志；命令追溯写入 `logs/`。
- `shared/decisions/` 只记录当前协作中的确认取舍；影响长期工程结构的取舍必须升级写入 `project/adr/`。
- 回流归档使用 `shared/escalations/`，不写入 `.claude/`。
- 共享区具体动作规则由 `security/` 管理，本文件只作为工作区入口。
- 多 Agent 并行写状态时优先追加 `shared/events/`，跨状态板变更写 `shared/transactions/`，再由 Lead 或 Plan-PM 汇总到状态板。
- 提示词相关失败先追加 `shared/prompt-evolution/events/`；该目录不替代普通任务事件、KB 或正式记忆。
