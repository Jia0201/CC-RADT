---
id: "security-state-policy"
title: "任务计划与流水线状态规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 任务计划与流水线状态规则

## 状态文件边界

- `shared/task-plan.md` 记录任务计划、Owner、attempt、回流和下一步。
- `shared/pipeline-status.md` 记录 12 个 Agent 的实时流水线状态。
- `shared/supervision/current.md` 记录 Doc、Memory、Role、Security-Reviewer 的并行监督状态。
- `shared/events/` 是追加式状态事件来源。
- `shared/transactions/` 是跨状态板变更的事务记录。
- 状态文件不替代任务单、执行方案、交接或日志。

## 写入模型

状态板是汇总视图，不是多个 Agent 直接抢写的协作草稿。

1. 普通 Agent 写入 `shared/events/`。
2. 同一次变更影响多个状态板时，Lead / Plan-PM 创建 `shared/transactions/`。
3. Lead / Plan-PM 根据事件和事务汇总状态板。
4. 写入状态板前必须取得文件级锁。
5. 工具入口和事务规则见 [state-transaction-policy](./state-transaction-policy.md)。

## 更新时机

1. Lead 创建任务或切换任务。
2. Plan-PM 创建或修订执行方案。
3. Agent 开始执行、阻塞、等待复核、完成。
4. attempt 变化或进入回流。
5. QA 接手或完成验证。
6. Memory / Doc 接手候选处理。
7. 任务关闭、取消或归档。

## 可追溯要求

每次状态变更必须能追溯到至少一个文件：

- 状态事件。
- 状态事务。
- 任务单。
- 执行方案。
- 交接。
- 锁记录。
- 回流记录。
- 日志。

## 并发规则

- 普通 Agent 不直接编辑状态板，优先追加状态事件。
- 修改状态板前必须取得状态板文件锁。
- 同一时间只允许一个 Owner 汇总同一状态板。
- 批量更新状态后必须说明原因和关联任务。
- 多状态板批量更新必须创建事务记录。
