---
id: "mcp-shared-index"
title: "共享 MCP 配置索引"
type: "mcp-index"
scope: "project"
owner: "doc"
status: active
---
# 共享 MCP 配置索引

本文件只说明 AI-Teams 内置和可选 MCP 的可迁移配置方式。它不记录本机已安装 MCP，也不保存任何私有路径或密钥值。

## 项目级配置

- Claude Code 读取目标项目根目录的 `.mcp.json`。
- AI-Teams 标准副本是 `mcp/claude-project.mcp.json`。
- 打包安装时，`mcp/claude-project.mcp.json` 会同步为目标项目根目录 `.mcp.json`。

## 项目级默认配置 MCP

| MCP | 配置名 | 包/连接 | 密钥要求 | 用途 |
|---|---|---|---|---|
| `chrome` | `ai-teams-chrome` | `@chrome/mcp` | 无需密钥 | Chrome MCP 浏览器自动化、页面检查、回归验证、截图、网络观察和当前 Chrome 会话辅助。 |
| `context7` | `ai-teams-context7` | `@context7/mcp` | 无需密钥 | 框架、库、API 和版本文档辅助查询。 |
| `shadcn` | `ai-teams-shadcn` | `shadcn-mcp` | 无需密钥 | Web 前端组件参考和 UI 实现辅助。 |
| `filesystem` | `ai-teams-filesystem` | `@modelcontextprotocol/server-filesystem` | 无需密钥 | 受限路径文件访问。 |
| `figma` | `ai-teams-figma` | `figma-developer-mcp` | `FIGMA_API_KEY` | 设计稿结构读取、图片导出和 UI 对齐。 |
| `mysql` | `ai-teams-mysql` | `@benborla29/mcp-server-mysql` | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASS`, `MYSQL_DB`, `ALLOW_INSERT_OPERATION`, `ALLOW_UPDATE_OPERATION`, `ALLOW_DELETE_OPERATION` | 数据库结构、迁移校验、服务端数据访问问题定位或 QA 数据验证。 |
| `github` | `ai-teams-github` | `@modelcontextprotocol/server-github` | `GITHUB_PERSONAL_ACCESS_TOKEN` | 仓库元信息、Issue/PR 协作和代码评审上下文。 |
| `codegraph` | `ai-teams-codegraph` | `@colbymchenry/codegraph` | 无需密钥 | 代码图谱、调用关系、影响分析和大范围代码理解。 |
| `puppeteer` | `ai-teams-puppeteer-fallback` | `@modelcontextprotocol/server-puppeteer` | 无需密钥 | Chrome MCP 不可用时的历史浏览器自动化 fallback。 |
| `canva` | `ai-teams-canva-remote` | `http` | `CANVA_MCP_URL`, `CANVA_MCP_TOKEN` | Canva 设计资产协作。 |

## 密钥规则

1. `mcp/registry.json` 和 `.mcp.json` 不保存密钥值。
2. 需要密钥的 MCP 使用 `${ENV_NAME}` 占位符或用户本地私有配置。
3. 不读取 `.env`、token、credentials、证书、私钥文件内容。
4. MCP 安装或启用前必须检查 [mcp-policy](../../security/mcp-policy.md)。
