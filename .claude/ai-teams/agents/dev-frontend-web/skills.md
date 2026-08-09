---
id: "agents-dev-frontend-web-skills"
title: "Dev-Frontend-Web Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Dev-Frontend-Web Skills 指针

本文件记录 Dev-Frontend-Web 与 Skills 的连接关系。Agent 主入口保留为 `agents/dev-frontend-web/dev-frontend-web.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| frontend-design | 构建高质量 Web UI、组件和页面 | `skills/agents/dev-frontend-web/frontend-design` | installed-local-copy |
| vercel-react-best-practices | React / Next.js 性能和最佳实践 | `skills/agents/dev-frontend-web/vercel-react-best-practices` | installed-local-copy |
| webapp-testing | 使用浏览器自动化验证本地 Web 应用；MCP 默认用 Chrome MCP，Skill 原文仅作为工具示例参考 | `skills/agents/dev-frontend-web/claude-anthropic-webapp-testing` | installed-local-copy |
| tdd | 红绿重构方式实现前端功能或修复缺陷 | `skills/agents/dev-frontend-web/tdd` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- 第三方来源与许可证：`THIRD_PARTY_NOTICES.md`
- Agent 安装索引：[index](../../skills/agents/dev-frontend-web/index.md)
- 工程内 Skills 目录：`skills/agents/dev-frontend-web/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
