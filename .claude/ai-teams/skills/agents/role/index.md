---
id: "skills-agents-role-index"
title: "Role Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Role Skills 安装索引

本文件登记 Role 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| agent-identifier | 创建或改进 Agent 定义和 frontmatter | `skills/agents/role/claude-plugin-dev-agent-development` | installed-local-copy |
| skill-creator | 创建、修改和优化 Skills | `skills/agents/role/skill-creator` | installed-local-copy |
| skill-name | 编写新的 Agent Skill | `skills/agents/role/write-a-skill` | installed-local-copy |
| claude-automation-recommender | 推荐 subagents、skills、hooks、MCP 等自动化配置 | `skills/agents/role/claude-claude-code-setup-claude-automation-recommender` | installed-local-copy |
| setup-matt-pocock-skills | 设置工程中的 Agent skills 区块参考 | `skills/agents/role/setup-matt-pocock-skills` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/role/skills.md` 和 `kb/graph.md`。
