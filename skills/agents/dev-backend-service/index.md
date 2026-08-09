---
id: "skills-agents-dev-backend-service-index"
title: "Dev-Backend-Service Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Service Skills 安装索引

本文件登记 Dev-Backend-Service 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| tdd | Python / Go / Node.js / TypeScript 服务端功能和缺陷修复的测试先行流程 | `skills/agents/dev-backend-service/tdd` | installed-local-copy |
| diagnose | 服务端异常、接口回归和性能问题定位 | `skills/agents/dev-backend-service/diagnose` | installed-local-copy |
| improve-codebase-architecture | 服务边界、模块耦合和演进建议 | `skills/agents/dev-backend-service/improve-codebase-architecture` | installed-local-copy |
| karpathy-guidelines | 控制实现复杂度并减少编码常见错误 | `skills/agents/dev-backend-service/karpathy-guidelines` | installed-local-copy |
| code-documentation | 记录 API、服务模块和运维命令 | `skills/agents/dev-backend-service/code-documentation` | installed-local-copy |
| build-mcp-server | Node.js / TypeScript 与 Python MCP 服务端、API wrapper 和 Claude 集成设计 | `skills/agents/dev-backend-service/build-mcp-server` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/dev-backend-service/skills.md` 和 `kb/graph.md`。
