---
id: "shared-events-index"
title: "共享事件日志索引"
type: "shared-index"
scope: "project"
owner: "lead"
status: active
---
# 共享事件日志索引

`shared/events/` 保存运行期追加式事件记录，用于降低多个 Agent 同时直接改状态板造成的冲突。

## 写入规则

1. 多 Agent 并行执行时，优先追加事件，再由 Lead 或 Plan-PM 汇总到 `shared/task-plan.md`。
2. 事件不得包含敏感文件内容。
3. 每条事件必须能追溯到任务单、执行方案、交接、锁或回流记录。
4. 跨状态板变更必须升级为 [index](../transactions/index.md) 事务。
5. 事件模板见 [EVENT_TEMPLATE](./EVENT_TEMPLATE.md)，真实路径为 `shared/events/EVENT_TEMPLATE.md`。

## 工具入口

```bash
bash tools/bin/ai-teams-state-event.sh --agent <agent> --type <type> --summary <summary> --task <task-id> --status <status> --evidence <path>
```

生成事件后，Lead / Plan-PM 可使用：

```bash
bash tools/bin/ai-teams-state-render.sh --dry-run
```

需要写入状态板时，必须遵循 [state-transaction-policy](../../security/state-transaction-policy.md) 和 [lock-policy](../../security/lock-policy.md)。
