---
id: "rule-custom-security-index"
title: "安全自建规则索引"
type: "rule-index"
scope: "project"
owner: "security-reviewer"
status: active
---
# 安全自建规则索引

这里登记新增安全动作规则的路由入口。安全规则正文必须落在 `security/`，本文件只说明何时读取、由谁审查、影响哪些范围。

## 适用场景

- 新增危险命令、敏感文件类型、权限边界或删除禁区。
- Hooks、MCP、Skills、锁、状态事务或项目初始化出现新的高风险模式。
- Security-Reviewer 发现已有规则不足，需要补充正式 policy。

## 禁止

- 不在这里保存密钥、token、证书或任何敏感内容。
- 不把安全动作规则写入 `kb/`。
- 不用自建规则绕过 `permissions.deny`、Hook、锁或用户确认。

## 当前规则

<!-- AI_TEAMS_CUSTOM_RULES_START -->

尚未注册安全自建规则。

<!-- AI_TEAMS_CUSTOM_RULES_END -->
