---
id: "agents-role-skills"
title: "Role Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Role Skills 指针

本文件记录 Role 与 Skills 的连接关系。Agent 主入口保留为 `agents/role/role.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| agent-identifier | 创建或改进 Agent 定义和 frontmatter | `skills/agents/role/claude-plugin-dev-agent-development` | installed-local-copy |
| skill-creator | 创建、修改和优化 Skills | `skills/agents/role/skill-creator` | installed-local-copy |
| skill-name | 编写新的 Agent Skill | `skills/agents/role/write-a-skill` | installed-local-copy |
| claude-automation-recommender | 推荐 subagents、skills、hooks、MCP 等自动化配置 | `skills/agents/role/claude-claude-code-setup-claude-automation-recommender` | installed-local-copy |
| setup-matt-pocock-skills | 设置工程中的 Agent skills 区块参考 | `skills/agents/role/setup-matt-pocock-skills` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/role/index.md)
- 工程内 Skills 目录：`skills/agents/role/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
