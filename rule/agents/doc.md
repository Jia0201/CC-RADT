---
id: "rule-agent-doc"
title: "Doc 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Doc 规则路由

## 执行前最短读取链

1. 读取 [doc](../../agents/doc/doc.md) 和 [index](../tasks/index.md) 中的文档与索引路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[index](../catalog/index.md) 和 [导航规范](../../index/NAVIGATION.md)。
3. 通过 [index](../shared/index.md) 定位当前任务、交接、决策、契约和文档维护状态。
4. 通过 [index](../security/index.md) 读取文件所有权、项目维护和导航规则；仅在命中时读取 [index](../custom/index.md)。

## 维护范围

- 维护：`rule/`、`project/`、`index/`、`kb/graph.md`、`project/graph.md` 和文档标准 Markdown 链接。
- 文件变化后运行 `node tools/bin/ai-teams-rule-refresh.mjs --write`；目标项目变化时同时传入 `--target`。
- 专业知识：[index](../../kb/agents/doc/index.md)；动作规则仍归 `security/`，不得塞进 KB。
