---
id: "rule-agent-role"
title: "Role 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Role 规则路由

## 执行前最短读取链

1. 读取 [role](../../agents/role/role.md)、[index](../tasks/index.md)、[index](./index.md) 和 [index](../../agents/index.md)。
2. 涉及目标项目职责变化时读取 [index](../project/index.md) 和 [index](../../project/index.md)；工程结构变化时读取 [structure](../engineering/structure.md)。
3. 通过 [index](../shared/index.md) 定位当前任务、监督状态和 Agent 交接。
4. 通过 [index](../security/index.md) 读取文件所有权、角色边界和监督规则；仅在命中时读取 [index](../custom/index.md)。

## 维护范围

- Agent 变化时同步 `agents/<agent>/`、`.claude/agents/<agent>.md`、`rule/agents/<agent>.md` 和专属 playbook。
- 检查每个 Agent 是否指向正确项目规则、记忆、知识、Skills 和 MCP。
- 专业知识：[index](../../kb/agents/role/index.md)；不替专业 Agent 定义业务技术规则。
