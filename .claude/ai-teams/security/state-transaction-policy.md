---
id: "security-state-transaction-policy"
title: "状态事件与事务写入规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 状态事件与事务写入规则

本规则解决 R-3：多个 Agent 同时更新任务计划、流水线状态和监督状态时，不再直接抢写同一个状态板。

## 核心原则

1. 状态板是汇总视图，不是多人直接编辑区。
2. 普通 Agent 优先追加 `shared/events/` 事件。
3. 涉及多个状态板或多个 Owner 的状态变更，必须创建 `shared/transactions/` 事务记录。
4. Lead / Plan-PM 根据事件和事务汇总 `shared/task-plan.md`、`shared/pipeline-status.md`、`shared/supervision/current.md`。
5. 修改状态板前必须使用文件级锁，避免并发覆盖。

## 什么时候使用事件

使用 `shared/events/EVENT_TEMPLATE.md` 或 `tools/bin/ai-teams-state-event.sh`：

- Agent 开始、阻塞、完成、交接、进入 QA、进入回流。
- Memory / Doc / Role / Security-Reviewer 并行监督状态变化。
- 任务发现项目事实、风险、规则变化或索引变化。
- 只需要记录单一事件，不需要同时改多个状态板。

Codex 生成状态事件时必须遵守：

1. 只写摘要、路径、证据位置，不写敏感文件内容。
2. 必须包含 Agent、任务 ID、事件类型、状态、来源文件或证据。
3. 文件名必须包含日期、时间、Agent 和短 slug。
4. 事件写入后再由 Lead / Plan-PM 汇总，不要求普通 Agent 直接编辑状态板。

## 什么时候使用事务

使用 `shared/transactions/TRANSACTION_TEMPLATE.md`：

- 同一次变化需要更新 `shared/task-plan.md` 和 `shared/pipeline-status.md`。
- 需要同时更新任务状态、监督状态、回流状态或锁状态。
- 多 Agent 任务关闭，需要把多个事件汇总为一次状态变更。
- attempt 清零、Owner 切换、回流恢复、任务取消等会影响多个状态视图。

Codex 生成事务时必须遵守：

1. 事务必须列出涉及的状态板、事件、锁和验证证据。
2. 事务未完成前，相关状态板不得部分更新后直接关闭。
3. 事务失败时必须写明失败原因、已写入内容、回滚或修复方式。
4. 事务关闭后必须能从状态板追溯回事务文件。

## 文件级锁

`tools/bin/ai-teams-lock.sh` 使用目录创建作为原子锁：

```bash
bash tools/bin/ai-teams-lock.sh acquire --resource shared/task-plan.md --owner plan-pm --task TASK-ID
bash tools/bin/ai-teams-lock.sh release --resource shared/task-plan.md --owner plan-pm
```

锁文件位于 `shared/locks/.locks/`。该目录是运行期锁状态，不替代 `shared/locks/LOCKS.md` 的人类可读锁登记。

## 状态渲染

`tools/bin/ai-teams-state-render.sh` 用于从事件生成状态摘要：

```bash
bash tools/bin/ai-teams-state-render.sh --dry-run
```

如需写入状态板，必须先取得对应状态板锁，再使用 `--write`。写入只更新 AI-TEAMS 标记区，不得覆盖人工维护的任务表。

## 禁止事项

- 不得让多个 Agent 同时直接编辑同一状态板。
- 不得为了省事绕过事件或事务记录。
- 不得把敏感文件内容写入事件、事务或状态板。
- 不得自动释放他人锁；过期锁必须交给 Lead 判断。
- 不得把事件日志当作正式记忆或知识库。
