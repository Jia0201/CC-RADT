---
id: "skills-agents-dev-frontend-miniapp-index"
title: "Dev-Frontend-Miniapp Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Dev-Frontend-Miniapp Skills 安装索引

本文件登记 Dev-Frontend-Miniapp 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| frontend-design | 小程序页面和组件的前端体验设计参考 | `skills/agents/dev-frontend-miniapp/frontend-design` | installed-local-copy |
| webapp-testing | 可运行 Web 预览或 H5 兼容层时进行自动化验证 | `skills/agents/dev-frontend-miniapp/claude-anthropic-webapp-testing` | installed-local-copy |
| tdd | 以测试先行方式实现小程序业务逻辑 | `skills/agents/dev-frontend-miniapp/tdd` | installed-local-copy |
| code-documentation | 记录平台差异、组件接口和联调说明 | `skills/agents/dev-frontend-miniapp/code-documentation` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/dev-frontend-miniapp/skills.md` 和 `kb/graph.md`。
5. 第三方来源与许可证统一查阅 `THIRD_PARTY_NOTICES.md`。
