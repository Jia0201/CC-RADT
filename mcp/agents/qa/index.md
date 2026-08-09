---
id: "mcp-agents-qa-index"
title: "QA 测试与代码评审 Agent MCP 索引"
type: "mcp-index"
scope: "project"
owner: "doc"
status: active
---
# QA 测试与代码评审 Agent MCP 索引

## 读取顺序

1. [qa](../../../agents/qa/qa.md)
2. [mcp](../../../agents/qa/mcp.md)
3. [index](./index.md)
4. [mcp-policy](../../../security/mcp-policy.md)
5. [registry](../../registry.json)

## MCP 绑定

| MCP | 配置名 | 状态 | 配置文件 | 使用场景 | 安全边界 |
|---|---|---|---|---|---|
| `chrome` | `ai-teams-chrome` | 默认启用 | `.mcp.json` | Chrome MCP 浏览器自动化、页面检查、回归验证、截图、网络观察和当前 Chrome 会话辅助。 | 使用前引导用户按 https://github.com/hangwin/mcp-chrome 安装 Chrome 扩展与 mcp-chrome-bridge；只测试授权页面、localhost、测试环境或用户明确指定页面；不得读取浏览器密码、Cookie 明文、个人历史记录或绕过登录/审核。 |
| `puppeteer` | `ai-teams-puppeteer-fallback` | 可选启用 | `mcp/optional-servers.mcp.example.json` | Chrome MCP 不可用时的历史浏览器自动化 fallback。 | 浏览器自动化优先使用 Chrome MCP；Puppeteer 只作为兼容或明确要求时使用。 |
| `mysql` | `ai-teams-mysql` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 数据库结构、迁移校验、服务端数据访问问题定位或 QA 数据验证。 | 默认只读；任何写入、更新、删除、DDL、数据导出或生产库连接都需要用户明确授权。 |
| `github` | `ai-teams-github` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 仓库元信息、Issue/PR 协作和代码评审上下文。 | 需要用户授权和仓库范围确认；不得自动提交、推送、合并或暴露 token。 |
| `context7` | `ai-teams-context7` | 默认启用 | `.mcp.json` | 框架、库、API 和版本文档辅助查询。 | 只作为文档和库参考查询；不得替代目标项目本地规则和官方文档验证。 |
| `filesystem` | `ai-teams-filesystem` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 受限路径文件访问。 | 必须限制 allowed paths；敏感文件仍按 security/sensitive-files.md 只检测存在，不读取内容。 |
| `codegraph` | `ai-teams-codegraph` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 代码图谱、调用关系、影响分析和大范围代码理解。 | 只索引授权目标项目；敏感文件仍按 security/sensitive-files.md 处理。 |

## 使用要求

- 默认启用的 MCP 应在目标项目根目录 `.mcp.json` 中可用。
- 可选 MCP 只有在任务明确需要且用户提供必要授权后才启用。
- 任何 MCP 返回内容都不能覆盖目标项目本地事实、测试结果和安全规则。
- 发现 MCP 缺失时，记录到任务交接或回流，不要假装工具已可用。
