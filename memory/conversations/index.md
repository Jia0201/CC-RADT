---
id: "memory-conversations-index"
title: "会话与上下文压缩索引"
type: "memory"
scope: "project"
owner: "memory"
status: active
---
# 会话与上下文压缩索引

## 目标

`memory/conversations/` 用于保存会话、上下文压缩摘要和恢复点，解决长期会话、多 Agent 协作和大型项目中的上下文膨胀问题。

## 目录

- `memory/conversations/sessions/`：会话记录或会话阶段材料。
- `memory/conversations/compact/`：上下文压缩产物。
- `memory/conversations/restore-points/`：恢复点。

## 三层压缩模型

| 层级 | 产物 | 位置 | 管理者 |
|---|---|---|---|
| Level 1 上下文压缩 | 当前会话可恢复摘要 | `memory/conversations/compact/` | Memory |
| Level 2 记忆压缩 | 长期事实候选或正式记忆 | `memory/candidates/`、`memory/MEMORY.md` | Memory |
| Level 3 知识库沉淀 | 可复用知识候选或正式知识 | `kb/candidates/`、`kb/` | Doc |

详细规则见 [context-compression](../context-compression.md)。

## 触发条件

- 用户明确要求压缩、总结、恢复或继续。
- 长任务上下文过长，Lead 判断需要恢复摘要。
- 多 Agent 阶段完成，需要交给 QA 或下一阶段。
- 任务中断、电源中断、网络中断或对话中断后需要恢复。
- 高风险修改前，需要记录当前状态。
- Lead 判断需要保留阶段性恢复点。

## 压缩产物必须包含

- 当前任务目标和最新用户指令。
- 已完成文件和关键改动。
- 未完成项与下一步。
- 已验证事实和未验证假设。
- 重要约束、安全边界和禁止触碰范围。
- 相关索引、任务单、交接和日志位置。
- 是否有候选记忆或候选知识需要 Memory / Doc 处理。

## 边界

- 上下文压缩不等于记忆。
- 记忆压缩不等于知识库。
- 对话快照不等于知识库。
- 敏感信息不得进入压缩摘要、记忆或知识库。
- 正式记忆只由 Memory 从恢复材料中筛选后写入 `memory/MEMORY.md` 或 `memory/agents/`。

## 命名建议

- `memory/conversations/sessions/YYYYMMDD-HHMM-session.md`
- `memory/conversations/compact/YYYYMMDD-HHMM-compact.md`
- `memory/conversations/restore-points/YYYYMMDD-HHMM-restore.md`

每个文件都应包含 标准 Markdown frontmatter，并链接到任务、Agent、记忆或知识库入口。

## 关联

- [index](../index.md)
- [context-compression](../context-compression.md)
- [index](../../kb/index.md)
- [导航规范](../../index/NAVIGATION.md)
