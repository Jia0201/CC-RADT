---
id: "security-lock-policy"
title: "锁规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 锁规则

## 何时加锁

以下情况必须登记锁：

1. 多 Agent 可能并行写入同一文件或重叠目录。
2. 修改 `shared/task-plan.md`、`shared/pipeline-status.md` 或 `shared/supervision/current.md`。
3. 迁移文件、重命名文件或批量更新索引。
4. 需要跨 Owner 修改。
5. 修改 `.claude/settings.json`、Agent 官方入口、安全规则或其他高风险工程入口。

同一 Owner 单 Agent 正常维护 `project/`、`memory/`、`kb/` 或追加式 `shared/events/` 时，不要求为每个文件创建锁；只有出现并发写、跨 Owner 或高风险入口时才加锁。

## 多文件锁规则

- 同一任务需要多个文件时，先按路径字典序列出锁范围。
- 先登记所有需要的锁，再开始写入。
- 无法取得全部锁时，不得先写部分高风险文件。
- 锁等待超过任务预期时，交给 Lead 重排。

## 文件级原子锁

`tools/bin/ai-teams-lock.sh` 使用 `mkdir` 创建 `shared/locks/.locks/<hash>.lock` 作为文件级原子锁。

使用时机：

- 写入 `shared/task-plan.md`。
- 写入 `shared/pipeline-status.md`。
- 写入 `shared/supervision/current.md`。
- 应用 `shared/transactions/` 中的跨状态板事务。

Codex 生成锁操作时要遵守：

1. 先按路径字典序申请锁。
2. 申请不到全部锁时停止写入，并写状态事件或交接。
3. 不自动释放其他 Owner 的锁。
4. 释放锁前确认写入、验证和交接已完成。
5. 文件级锁不替代 `shared/locks/LOCKS.md` 的人类可读记录。
6. 更新 `shared/locks/LOCKS.md` 用 `tools/bin/ai-teams-lock.sh` 的专用状态锁或原子替换，不要求先在 `LOCKS.md` 为它自身登记锁。

## 死锁处理

潜在死锁包括：

- Agent A 等待 Agent B 的锁，同时 B 等待 A。
- 多个 Agent 分别持有不同文件锁并等待彼此释放。
- 状态板锁未释放导致后续任务无法更新。

处理方式：

1. 停止新增写入。
2. Lead 检查 `shared/locks/LOCKS.md`。
3. 释放过期或无效锁。
4. 必要时拆分任务或重排执行顺序。
5. 将处理结果写入锁记录和交接。

## 释放规则

- 写入完成、验证完成、交接完成后释放锁。
- 取消任务时标记 `cancelled`，不能直接删除锁记录。
- 过期锁由 Lead 检查后标记 `expired` 或恢复为 `active`。

## 锁超时检测

- 自动检测脚本：`hooks/scripts/lock-timeout-check.sh`
- 默认 TTL：120 分钟，可通过 `AI_TEAMS_LOCK_TTL_MINUTES` 调整。
- 显式过期时间优先于默认 TTL。
- Hook 只写报告到 `logs/hook/`，不得自动释放锁。
- Lead 看到超时报告后必须判断：继续持有、标记过期、释放、拆分任务或回流。
