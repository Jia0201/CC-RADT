---
id: "rule-agent-security-reviewer"
title: "Security-Reviewer 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Security-Reviewer 规则路由

## 执行前最短读取链

1. 读取 [security-reviewer](../../agents/security-reviewer/security-reviewer.md) 和 [index](../tasks/index.md) 中的安全审查路由。
2. 涉及目标项目时读取 [index](../project/index.md)、[index](../../project/index.md)、[risks](../../project/risks.md) 和变更文件范围。
3. 通过 [index](../shared/index.md) 定位当前任务、执行方案、锁、监督状态和交接。
4. 通过 [index](../security/index.md) 选择当前风险规则；全局审计时才进入 [index](../../security/index.md)；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 按风险读取敏感文件、删除、锁、Owner、命令、Hook、MCP、状态和工作区规则，不默认加载全部安全文件。
- 项目风险定位：[risks](../../project/risks.md)；文件定位：[files](../project/files.md) 或 [files](../catalog/files.md)。
- 专业知识：[index](../../kb/agents/security-reviewer/index.md)；安全结论交给 Lead 和 Doc，不直接改写无关 Owner 文件。
