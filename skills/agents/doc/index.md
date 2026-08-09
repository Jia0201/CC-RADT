---
id: "skills-agents-doc-index"
title: "Doc Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Doc Skills 安装索引

本文件登记 Doc 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| code-documentation | 生成和改进代码、API、仓库文档 | `skills/agents/doc/code-documentation` | installed-local-copy |
| claude-md-improver | 审计和改进 CLAUDE.md | `skills/agents/doc/claude-claude-md-management-claude-md-improver` | installed-local-copy |
| academic-paper-review | 处理研究资料和论文类知识沉淀 | `skills/agents/doc/academic-paper-review` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/doc/skills.md` 和 `kb/graph.md`。
5. 第三方来源与许可证统一查阅 `THIRD_PARTY_NOTICES.md`。
