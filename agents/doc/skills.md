---
id: "agents-doc-skills"
title: "Doc Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Doc Skills 指针

本文件记录 Doc 与 Skills 的连接关系。Agent 主入口保留为 `agents/doc/doc.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| code-documentation | 生成和改进代码、API、仓库文档 | `skills/agents/doc/code-documentation` | installed-local-copy |
| claude-md-improver | 审计和改进 CLAUDE.md | `skills/agents/doc/claude-claude-md-management-claude-md-improver` | installed-local-copy |
| academic-paper-review | 处理研究资料和论文类知识沉淀 | `skills/agents/doc/academic-paper-review` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- 第三方来源与许可证：`THIRD_PARTY_NOTICES.md`
- Agent 安装索引：[index](../../skills/agents/doc/index.md)
- 工程内 Skills 目录：`skills/agents/doc/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
