---
id: "skills-agents-pd-index"
title: "PD Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# PD Skills 安装索引

本文件登记 PD 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| to-prd | 把用户需求整理为 PRD 或需求文档 | `skills/agents/pd/to-prd` | installed-local-copy |
| grill-me | 对模糊需求进行结构化追问 | `skills/agents/pd/grill-me` | installed-local-copy |
| grill-with-docs | 结合现有文档挑战和澄清需求模型 | `skills/agents/pd/grill-with-docs` | installed-local-copy |
| consulting-analysis | 市场、用户、业务场景和产品判断分析 | `skills/agents/pd/consulting-analysis` | installed-local-copy |
| deep-research | 需要外部资料或竞品研究时进行深度研究 | `skills/agents/pd/deep-research` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/pd/skills.md` 和 `kb/graph.md`。
