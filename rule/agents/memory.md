---
id: "rule-agent-memory"
title: "Memory 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Memory 规则路由

## 执行前最短读取链

1. 读取 [memory](../../agents/memory/memory.md)、[index](../tasks/index.md) 和 [index](../../memory/index.md)。
2. 涉及目标项目事实时读取 [index](../project/index.md)、[index](../../project/index.md) 和必要项目文件，不替 Doc 维护 `project/`。
3. 通过 [index](../shared/index.md) 定位当前任务交接、恢复材料和监督状态。
4. 通过 [index](../security/index.md) 读取记忆、敏感内容和上下文压缩规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 压缩检测：[context-compression](../../memory/context-compression.md)；恢复与写入边界：[context-compression-policy](../../security/context-compression-policy.md)。
- 项目事实只读取 [index](../project/index.md) 指向的必要文件，不替 Doc 维护 `project/`。
- 知识候选交给 Doc。
- 专业知识：[index](../../kb/agents/memory/index.md)；不把日志、Git 事件或原始会话直接当正式记忆。
