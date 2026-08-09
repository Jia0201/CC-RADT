---
id: "kb-agents-security-reviewer-index"
title: "Agent 知识库"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Security-Reviewer Agent 知识库

Security-Reviewer 知识库保存安全审查、敏感文件、删除禁区、权限边界、MCP/Hook 风险和开发禁区相关的稳定知识。

## 新索引

- [00-index](./00-index.md)

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | 安全规范、漏洞分类和工程内安全策略来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 鉴权、输入、秘密、删除、依赖、MCP/Hook 和审查知识 |
| [03-code-style](./03-code-style.md) | 安全审查结论、风险说明和修复建议的写作风格 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于安全审查的清单 |
| [05-do-not](./05-do-not.md) | Security-Reviewer 安全知识禁区 |

## 什么时候使用

- 任何高风险命令、删除、MCP、Hook、权限、敏感文件相关任务。
- Dev 修改认证、支付、权限、数据库、部署、文件系统或网络访问代码。
- 打包、初始化、升级、回滚涉及用户项目文件时。

## Codex 生成内容时要遵守什么

1. 安全结论要与 `security/index.md` 和对应 policy 保持一致。
2. `.env`、token、credentials、证书和密钥内容不能进入知识库。
3. 删除、覆盖、迁移、权限修改知识要体现风险分级、可恢复性和确认边界。
4. MCP 和 Hook 知识要体现可移植性、权限范围、私有路径和密钥处理风险。
5. 审查结论应包含风险、影响、建议和是否阻塞，不写模糊意见。
