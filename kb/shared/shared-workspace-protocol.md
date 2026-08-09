---
id: "kb-shared-workspace-protocol"
title: "共享工作区协议知识"
type: "knowledge"
scope: "shared"
owner: "doc"
status: active
---
# 共享工作区协议知识

共享工作区是 AI-Teams 多 Agent 协作的正式通信层。所有关键协作都必须落到文件，不能依赖不可追溯的临时聊天。

## 核心规则

- Lead 是唯一调度者。
- 任务写入 `shared/tasks/`。
- 交接写入 `shared/handoffs/`。
- 广播写入 `shared/broadcasts/`。
- 决策写入 `shared/decisions/`。
- 锁写入 `shared/locks/LOCKS.md`。
- 长期事实交给 Memory，稳定知识交给 Doc。

## 使用入口

- [protocol](../../shared/protocol.md)
- [BROADCAST_PROTOCOL](../../shared/broadcasts/BROADCAST_PROTOCOL.md)
- [LOCKS](../../shared/locks/LOCKS.md)
- [index](../../shared/index.md)
