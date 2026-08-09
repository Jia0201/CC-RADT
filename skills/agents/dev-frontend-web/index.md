---
id: "skills-agents-dev-frontend-web-index"
title: "Dev-Frontend-Web Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Dev-Frontend-Web Skills 安装索引

本文件登记 Dev-Frontend-Web 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| frontend-design | 构建高质量 Web UI、组件和页面 | `skills/agents/dev-frontend-web/frontend-design` | installed-local-copy |
| vercel-react-best-practices | React / Next.js 性能和最佳实践 | `skills/agents/dev-frontend-web/vercel-react-best-practices` | installed-local-copy |
| webapp-testing | 使用 Playwright 验证本地 Web 应用 | `skills/agents/dev-frontend-web/claude-anthropic-webapp-testing` | installed-local-copy |
| tdd | 红绿重构方式实现前端功能或修复缺陷 | `skills/agents/dev-frontend-web/tdd` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/dev-frontend-web/skills.md` 和 `kb/graph.md`。
5. 第三方来源与许可证统一查阅 `THIRD_PARTY_NOTICES.md`。
