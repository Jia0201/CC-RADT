---
id: "rule-custom-agents-index"
title: "Agent 自建规则索引"
type: "rule-index"
scope: "agent"
owner: "role"
status: active
---
# Agent 自建规则索引

这里登记对 Agent 读取链、触发条件、协作边界或交接要求的补充路由。它不替代 `agents/<agent>/` 主文档，也不替代 `security/agent-playbooks/`。

## 适用场景

- 某个 Agent 在特定任务类型下需要额外读取一个固定入口。
- 某个 Agent 的协作边界出现重复误用，需要加路由提示。
- 新增 Agent 能力后，需要先在规则层试运行，后续稳定后再合并到 Agent 主文档。

## 禁止

- 不在这里写长篇职责说明。
- 不在这里保存业务知识、代码规范正文或安全动作规则。
- 不创建会让 Agent 绕过 Lead 的独立调度规则。

## 当前规则

<!-- AI_TEAMS_CUSTOM_RULES_START -->

尚未注册 Agent 自建规则。

<!-- AI_TEAMS_CUSTOM_RULES_END -->
