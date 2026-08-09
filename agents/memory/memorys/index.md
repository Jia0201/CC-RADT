---
id: "agents-memory-memorys-index"
title: "Memory Agent 记忆指引索引"
type: "agent-guide-index"
scope: "agent"
owner: "memory"
status: active
---
# Memory Agent 记忆指引索引

本目录是 Memory Agent 的记忆工作指引，不是正式记忆存储区。

正式记忆、候选记忆、会话恢复材料和归档只保存在根目录 `memory/` 下。不要把任何正式记忆写入 `agents/memory/memorys/`。

## 指引入口

本目录只回答一个问题：Memory Agent 到哪里读取正式规则和正式数据。

| 内容 | 正式位置 |
|---|---|
| 记忆总索引 | [index](../../../memory/index.md) |
| 上下文压缩 | [context-compression](../../../memory/context-compression.md) |
| 记忆刷新 | [refresh-rules](../../../memory/refresh-rules.md) |
| 记忆保留 | [retention-policy](../../../memory/retention-policy.md) |
| 上下文压缩安全边界 | [context-compression-policy](../../../security/context-compression-policy.md) |
| 共享正式记忆 | [MEMORY](../../../memory/MEMORY.md) |
| Memory Agent 独立记忆 | [MEMORY](../../../memory/agents/memory/MEMORY.md) |

## 目录边界

| 路径 | 含义 |
|---|---|
| `agents/memory/` | Memory Agent 的角色、流程、组件指针 |
| `agents/memory/memorys/` | Memory Agent 的轻量阅读指引 |
| `memory/` | 正式记忆、候选、会话恢复材料、归档的数据区 |
| `memory/agents/memory/MEMORY.md` | Memory Agent 自己的长期记忆 |

## 禁止

- 不在本目录保存正式记忆。
- 不在本目录保存候选记忆。
- 不在本目录新增记忆规则本体。
- 不在本目录写任务过程或归档内容。
