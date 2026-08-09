---
id: "agents-dev-frontend-miniapp-skills"
title: "Dev-Frontend-Miniapp Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Dev-Frontend-Miniapp Skills 指针

本文件记录 Dev-Frontend-Miniapp 与 Skills 的连接关系。Agent 主入口保留为 `agents/dev-frontend-miniapp/dev-frontend-miniapp.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| frontend-design | 小程序页面和组件的前端体验设计参考 | `skills/agents/dev-frontend-miniapp/frontend-design` | installed-local-copy |
| webapp-testing | 可运行 Web 预览或 H5 兼容层时进行自动化验证 | `skills/agents/dev-frontend-miniapp/claude-anthropic-webapp-testing` | installed-local-copy |
| tdd | 以测试先行方式实现小程序业务逻辑 | `skills/agents/dev-frontend-miniapp/tdd` | installed-local-copy |
| code-documentation | 记录平台差异、组件接口和联调说明 | `skills/agents/dev-frontend-miniapp/code-documentation` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- 第三方来源与许可证：`THIRD_PARTY_NOTICES.md`
- Agent 安装索引：[index](../../skills/agents/dev-frontend-miniapp/index.md)
- 工程内 Skills 目录：`skills/agents/dev-frontend-miniapp/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
