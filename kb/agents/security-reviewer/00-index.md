---
id: "kb-agents-security-reviewer-00-index"
title: "Security-Reviewer 知识库索引"
type: "knowledge-index"
scope: "agent"
owner: "doc"
status: active
---
# Security-Reviewer 知识库索引

Security-Reviewer 知识库保存安全审查、敏感文件、删除禁区、权限边界、MCP/Hook 风险、供应链风险和开发禁区相关的稳定知识。本知识库不保存密钥、凭证或敏感文件内容。

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | 安全规范、漏洞分类和工程内安全策略来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 鉴权、输入、秘密、删除、依赖、MCP/Hook 和审查知识 |
| [03-code-style](./03-code-style.md) | 安全审查结论、风险说明和修复建议的写作风格 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于安全审查的清单 |
| [05-do-not](./05-do-not.md) | Security-Reviewer 安全知识禁区 |

## 使用规则

- 什么时候使用：任务涉及高风险命令、删除、覆盖、权限、认证、支付、数据库、部署、网络、文件系统、MCP、Hook 或敏感信息时。
- Codex 生成内容时要遵守：只记录风险模式、审查标准和安全结论；不得读取、复制或沉淀密钥、token、证书、凭证和敏感数据内容。
