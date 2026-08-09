---
id: "mcp-agents-index"
title: "Agent MCP 绑定总索引"
type: "mcp-index"
scope: "project"
owner: "doc"
status: active
---
# Agent MCP 绑定总索引

本索引把 12 个 Agent 与可迁移 MCP 配置绑定起来。具体 MCP 是否可用，以目标项目根目录 `.mcp.json` 和用户启用的可选 MCP 配置为准。

| Agent | Agent 入口 | MCP 索引 | 绑定 MCP |
|---|---|---|---|
| Lead 主 Agent | [lead](../../agents/lead/lead.md) | [index](./lead/index.md) | `context7` · `filesystem` · `github` · `codegraph` |
| PD 需求解析 Agent | [pd](../../agents/pd/pd.md) | [index](./pd/index.md) | `context7` · `figma` · `canva` · `filesystem` |
| Plan-PM 计划管理 Agent | [plan-pm](../../agents/plan-pm/plan-pm.md) | [index](./plan-pm/index.md) | `context7` · `github` · `filesystem` · `codegraph` |
| Dev-Frontend-Web 前端 Web Agent | [dev-frontend-web](../../agents/dev-frontend-web/dev-frontend-web.md) | [index](./dev-frontend-web/index.md) | `chrome` · `figma` · `shadcn` · `context7` · `github` · `filesystem` · `codegraph` |
| Dev-Frontend-Miniapp 小程序 Agent | [dev-frontend-miniapp](../../agents/dev-frontend-miniapp/dev-frontend-miniapp.md) | [index](./dev-frontend-miniapp/index.md) | `chrome` · `figma` · `context7` · `filesystem` · `codegraph` |
| Dev-Backend-Systems 系统后端 Agent | [dev-backend-systems](../../agents/dev-backend-systems/dev-backend-systems.md) | [index](./dev-backend-systems/index.md) | `mysql` · `context7` · `github` · `filesystem` · `codegraph` |
| Dev-Backend-Service 服务端 Agent | [dev-backend-service](../../agents/dev-backend-service/dev-backend-service.md) | [index](./dev-backend-service/index.md) | `mysql` · `context7` · `github` · `filesystem` · `codegraph` |
| QA 测试与代码评审 Agent | [qa](../../agents/qa/qa.md) | [index](./qa/index.md) | `chrome` · `puppeteer` · `mysql` · `github` · `context7` · `filesystem` · `codegraph` |
| Memory 记忆管理 Agent | [memory](../../agents/memory/memory.md) | [index](./memory/index.md) | `filesystem` |
| Doc 文档管理 Agent | [doc](../../agents/doc/doc.md) | [index](./doc/index.md) | `context7` · `figma` · `canva` · `filesystem` · `codegraph` |
| Role 角色管理 Agent | [role](../../agents/role/role.md) | [index](./role/index.md) | `filesystem` |
| Security-Reviewer 安全审查 Agent | [security-reviewer](../../agents/security-reviewer/security-reviewer.md) | [index](./security-reviewer/index.md) | `chrome` · `mysql` · `github` · `filesystem` · `codegraph` |

## 维护规则

1. 新增 MCP 时先更新 `mcp/registry.json`。
2. 默认启用 MCP 需要同步 `.mcp.json` 与 `mcp/claude-project.mcp.json`。
3. 可选 MCP 只写入 `mcp/optional-servers.mcp.example.json`，密钥用环境变量占位。
4. 变更后更新本索引、对应 Agent MCP 索引、Agent 的 `mcp.md` 和 [graph](../../kb/graph.md)。
