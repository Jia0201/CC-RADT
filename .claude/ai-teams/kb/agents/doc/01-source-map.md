---
id: "kb-agents-doc-01-source-map"
title: "Doc 权威来源"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Doc 权威来源

| 来源 | 什么时候使用 | Codex 生成内容时要遵守什么 |
|---|---|---|
| [导航规范](../../../index/NAVIGATION.md) | 新建或修改工程 Markdown | 必须保留 frontmatter、标准 Markdown 链接和可读结构 |
| [markdown-frontmatter](../../../templates/kb-file/markdown-template.md) | 创建知识库类文件 | 不缺 `id/title/type/scope/owner/status/必要元数据` |
| [index](../../../project/index.md) | 目标项目画像和运行上下文 | Doc 是 project 维护者，业务任务中并行更新项目状态 |
| [graph](../../../project/graph.md) | 目标项目知识图谱 | 初始化和业务变更后维护项目节点关系 |
| [graph](../../graph.md) | 全局知识图谱 | Agent、memory、shared、security、commands、MCP、Skills 变化后检查 |
| [adr](../../../security/adr.md) | 长期结构性决策 | ADR 只记录为什么，不替代日志、规则、记忆、KB |
