---
id: "kb-shared-memory-and-compression"
title: "记忆与上下文压缩知识"
type: "knowledge"
scope: "shared"
owner: "doc"
status: active
---
# 记忆与上下文压缩知识

AI-Teams 的记忆体系不是聊天记录仓库，而是恢复能力。上下文压缩、正式记忆和知识库必须分层处理。

## 核心规则

- 上下文压缩用于恢复当前任务。
- 正式记忆用于长期恢复和稳定偏好。
- 知识库用于稳定复用和跨任务引用。
- 日志用于追溯，不进入正式记忆。
- 敏感内容不得进入压缩、记忆或知识库。

## 三层关系

| 层级 | 目标 | 管理者 |
|---|---|---|
| Level 1 上下文压缩 | 保存当前任务恢复摘要 | Memory |
| Level 2 记忆压缩 | 筛选长期事实 | Memory |
| Level 3 知识库沉淀 | 提炼可复用知识 | Doc |

## 使用入口

- [context-compression](../../memory/context-compression.md)
- [refresh-rules](../../memory/refresh-rules.md)
- [retention-policy](../../memory/retention-policy.md)
- [index](../../memory/conversations/index.md)
