---
id: "kb-agents-memory-01-source-map"
title: "Memory 权威来源"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Memory 权威来源

| 来源 | 什么时候使用 | Codex 生成内容时要遵守什么 |
|---|---|---|
| [index](../../../memory/index.md) | 判断记忆层级与目录 | 不把日志、知识库、project 混成记忆 |
| [context-compression](../../../memory/context-compression.md) | 上下文达到阈值或用户要求压缩 | 生成恢复材料和候选，不直接把全文写入长期记忆 |
| [refresh-rules](../../../memory/refresh-rules.md) | 刷新共享记忆或 Agent 记忆 | 只保留长期有用、可恢复、非敏感事实 |
| [context-compression-policy](../../../security/context-compression-policy.md) | Hook 提示或手动压缩 | 不读取敏感文件内容，不泄露私密信息 |
| [index](../../../agents/memory/memorys/index.md) | Memory Agent 读取指引 | 这是指引文件，不是新的记忆数据层 |
