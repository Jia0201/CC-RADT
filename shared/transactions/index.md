---
id: "shared-transactions-index"
title: "状态事务索引"
type: "shared-index"
scope: "project"
owner: "lead"
status: active
---
# 状态事务索引

`shared/transactions/` 保存跨状态板、跨 Owner 或跨多个 Agent 的状态变更事务。

## 使用场景

1. 一次任务状态变化需要同时影响 `shared/task-plan.md` 和 `shared/pipeline-status.md`。
2. 非平凡任务关闭时，需要汇总 Doc、Memory、Role、Security-Reviewer 的监督状态。
3. 回流恢复、Owner 切换、attempt 清零、任务取消需要同时更新多个状态视图。
4. 多个事件需要被 Lead / Plan-PM 合并为一次可追溯状态变更。

## 文件命名

```text
YYYYMMDD-HHMMSS-task-id-state-transaction.md
```

## 使用规则

- 先写事件，再写事务。
- 事务必须列出涉及状态板、事件文件、锁和验证证据。
- 写状态板前必须取得文件级锁。
- 状态板只写事务结果摘要，不复制完整事件正文。
- 事务失败时保留失败记录，不删除历史。

规则本体见 [state-transaction-policy](../../security/state-transaction-policy.md)。
