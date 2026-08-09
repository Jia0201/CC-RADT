---
id: "shared-protocol"
title: "共享协议"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 共享协议

共享工作区是 AI-Teams 多 Agent 协作的唯一正式通信区。临时聊天只用于执行过程，不能作为 Agent 之间的唯一交接依据。具体动作规则由 `security/` 管理，本文件只说明通信目录和入口。

## 总原则

1. Lead 负责任务路由。
2. 任务单写入 `shared/tasks/`。
3. 交接写入 `shared/handoffs/`。
4. 广播写入 `shared/broadcasts/`。
5. 决策写入 `shared/decisions/`。
6. 锁登记写入 `shared/locks/LOCKS.md`。
7. Agent 将输出写入任务定义的位置。
8. 任务完成必须有日志或交接。

## 通信目录

| 目录 | 用途 | 主要写入者 |
|---|---|---|
| `shared/inbox/` | 待 Lead 分派或待处理输入 | Lead / 各 Agent |
| `shared/outbox/` | 已完成输出或待汇总材料 | 各 Agent |
| `shared/tasks/` | 任务单、执行方案、目标、范围、验收标准 | Lead / Plan-PM |
| `shared/handoffs/` | Agent 交接、已完成项、风险、下一步 | 各 Agent |
| `shared/broadcasts/` | 对多个 Agent 同时生效的通知 | Lead / Security / Doc / Memory |
| `shared/decisions/` | 重要决策、取舍、变更原因 | Lead |
| `shared/escalations/` | 第 4+ 次失败后的回流、升级和仲裁记录 | Lead / 上游 Agent |
| `shared/locks/` | 文件锁、协作锁、冲突说明 | Lead / 对应 Owner |
| `shared/events/` | 追加式状态事件 | 各 Agent |
| `shared/transactions/` | 跨状态板事务记录 | Lead / Plan-PM |
| `shared/workspace/` | 临时共享草稿和多人协作材料 | 任务指定 Agent |
| `shared/` | 协作入口、实时状态和图谱检查状态 | Doc / Lead |
| `shared/task-plan.md` | 任务计划、重试计数、回流清零记录的汇总视图 | Plan-PM / Lead |
| `shared/pipeline-status.md` | Agent 流水线状态和 `RETRYING` / `FLOWBACK` 状态的汇总视图 | Lead |

## 任务入口

- 任务单模板：[TASK_TEMPLATE](./tasks/TASK_TEMPLATE.md)
- 执行方案模板：[EXECUTION_PLAN_TEMPLATE](./tasks/EXECUTION_PLAN_TEMPLATE.md)
- 任务规则：[task-policy](../security/task-policy.md)

## 交接规则

- 每个 Agent 完成任务后必须写明已完成、变更文件、验证证据、风险和下一步。
- Dev 交接必须包含改动范围、测试结果、未测风险和是否需要 QA。
- QA 交接必须包含验证命令、结果、失败项和回归建议。
- Memory / Doc 交接必须说明来源、筛选依据和写入位置。

## 错误处理与重试回流

- 重试机制：[retry-flowback](./escalations/retry-flowback.md)
- 回流模板：[ESCALATION_TEMPLATE](./escalations/ESCALATION_TEMPLATE.md)
- 回流规则：[escalation-policy](../security/escalation-policy.md)
- 状态更新：[task-plan](./task-plan.md) / [pipeline-status](./pipeline-status.md)

## 广播规则

广播用于对多个 Agent 同时生效的通知，例如安全冻结、索引迁移、重大需求变更、工具状态变化。

- 广播必须写入 `shared/broadcasts/`。
- 广播必须说明影响范围、开始时间、过期条件和要求动作。
- Agent 执行任务前应检查是否存在与自己相关的有效广播。
- 过期广播应标记状态，不直接删除。

详细规则见 [BROADCAST_PROTOCOL](./broadcasts/BROADCAST_PROTOCOL.md)。

## 决策规则

- 当前任务中的取舍、局部协作决策和短期执行判断写入 `shared/decisions/`。
- `shared/decisions/` 决策应包含背景、选项、最终选择、影响范围和回滚条件。
- 影响长期工程结构、多个 Agent 长期行为、核心协议、目录归位、索引、锁、CodeGraph、标准 Markdown、memory / kb / shared / security 结构的决策，必须写入 `project/adr/`。
- ADR 创建和验收遵循 [adr](../security/adr.md)，ADR 索引见 [index](../project/adr/index.md)。
- 决策记录不是需求文档，也不是日志；它记录已经确认的取舍。ADR 额外记录长期结构性选择的原因。

## 锁入口

- 锁登记表：[LOCKS](./locks/LOCKS.md)
- 锁模板：[LOCK_TEMPLATE](./locks/LOCK_TEMPLATE.md)
- 锁规则：[lock-policy](../security/lock-policy.md)

## 状态入口

- 任务计划状态：[task-plan](./task-plan.md)
- Agent 流水线状态：[pipeline-status](./pipeline-status.md)
- 并行监督状态：[index](./supervision/index.md) / [current](./supervision/current.md)
- 状态规则：[state-policy](../security/state-policy.md)
- 状态事件：[index](./events/index.md)
- 状态事务：[index](./transactions/index.md)
- 事务规则：[state-transaction-policy](../security/state-transaction-policy.md)

普通 Agent 优先追加状态事件。Lead / Plan-PM 需要同时更新多个状态板时，先创建状态事务，再按锁规则汇总到状态板。

## 状态词

| 状态 | 含义 |
|---|---|
| `todo` | 尚未开始 |
| `doing` | 正在执行 |
| `blocked` | 被依赖、权限、信息或风险阻塞 |
| `review` | 等待 QA、Lead 或 Owner 检查 |
| `done` | 已完成并有验证或交接 |
| `archived` | 已归档，不作为当前活动状态 |
