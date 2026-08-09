---
id: "kb-agents-memory-index"
title: "Agent 知识库"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Memory Agent 知识库

Memory 知识库保存共享记忆、Agent 独立记忆、候选记忆、会话恢复材料和上下文压缩相关的稳定知识。

## 入口

- [00-index](./00-index.md)：细分知识库索引。
- [01-source-map](./01-source-map.md)：记忆体系来源。
- [02-engineering-rules](./02-engineering-rules.md)：记忆层级和上下文压缩知识。
- [03-code-style](./03-code-style.md)：记忆摘要格式。
- [04-review-checklist](./04-review-checklist.md)：写入检查清单。
- [05-do-not](./05-do-not.md)：禁止事项。

## 边界

Memory 负责判断什么值得记忆，不负责维护 `project/` 和正式 KB；项目事实交给 Doc，稳定知识交给 Doc 验证后沉淀。
