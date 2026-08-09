---
id: "skills-agents-qa-index"
title: "QA Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# QA Skills 安装索引

本文件登记 QA 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| webapp-testing | Web 端回归、截图和交互验证 | `skills/agents/qa/claude-anthropic-webapp-testing` | installed-local-copy |
| tdd | 检查测试覆盖与红绿重构闭环 | `skills/agents/qa/tdd` | installed-local-copy |
| diagnose | 复现、最小化和定位缺陷 | `skills/agents/qa/diagnose` | installed-local-copy |
| triage | 缺陷分级、阻塞判断和验收状态管理 | `skills/agents/qa/triage` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/qa/skills.md` 和 `kb/graph.md`。
5. 第三方来源与许可证统一查阅 `THIRD_PARTY_NOTICES.md`。
