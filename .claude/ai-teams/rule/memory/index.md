---
id: "rule-memory-index"
title: "记忆与上下文路由"
type: "rule-index"
scope: "project"
owner: "memory"
status: active
---
# 记忆与上下文路由

| 需要恢复的内容 | 入口 | 使用边界 |
|---|---|---|
| 团队共享长期事实 | [MEMORY](../../memory/MEMORY.md) | 只读当前任务相关条目 |
| Agent 独立长期事实 | `memory/agents/<agent>/MEMORY.md` | 只读当前 Agent 相关条目 |
| 待筛选候选 | `memory/candidates/` | 仅 Memory 处理，不作为已确认事实 |
| 会话恢复材料 | [index](../../memory/conversations/index.md) | 中断、恢复或交接时按需读取 |
| 上下文压缩 | [context-compression](../../memory/context-compression.md) | 达到阈值、PreCompact/PostCompact 或手动压缩时使用 |
| 历史归档索引 | [index](../../memory/archive/index.md) | 只在追溯替代关系时读取 |

日志、Git 事件、原始会话和知识库内容不能直接当作正式记忆。Memory 按 [context-compression-policy](../../security/context-compression-policy.md) 判断压缩、恢复点和正式写入。
