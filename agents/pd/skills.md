---
id: "agents-pd-skills"
title: "PD Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# PD Skills 指针

本文件记录 PD 与 Skills 的连接关系。Agent 主入口保留为 `agents/pd/pd.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| to-prd | 把用户需求整理为 PRD 或需求文档 | `skills/agents/pd/to-prd` | installed-local-copy |
| grill-me | 对模糊需求进行结构化追问 | `skills/agents/pd/grill-me` | installed-local-copy |
| grill-with-docs | 结合现有文档挑战和澄清需求模型 | `skills/agents/pd/grill-with-docs` | installed-local-copy |
| consulting-analysis | 市场、用户、业务场景和产品判断分析 | `skills/agents/pd/consulting-analysis` | installed-local-copy |
| deep-research | 需要外部资料或竞品研究时进行深度研究 | `skills/agents/pd/deep-research` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/pd/index.md)
- 工程内 Skills 目录：`skills/agents/pd/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
