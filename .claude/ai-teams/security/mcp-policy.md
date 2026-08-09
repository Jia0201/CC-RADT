---
id: "security-mcp-policy"
title: "MCP 使用与配置安全规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# MCP 使用与配置安全规则

本文件定义 AI-Teams 中 MCP 的登记、分配、启用和审查规则。MCP 配置属于工程能力入口，但 MCP 的密钥、token、数据库密码、证书和远程 URL 私有值不得进入工程文件。

## 核心原则

1. Claude Code 项目级 MCP 配置使用目标项目根目录 `.mcp.json`。
2. AI-Teams 标准 MCP 配置副本是 `mcp/claude-project.mcp.json`，打包安装时同步到目标项目根目录 `.mcp.json`。
3. `mcp/registry.json` 只记录可迁移元数据、命令形态、环境变量名、Agent 绑定关系和安全边界。
4. `mcp/optional-servers.mcp.example.json` 只保存可选 MCP 模板，密钥位置必须是环境变量占位符。
5. `mcp/agents/<agent>/index.md` 记录单个 Agent 可优先使用的 MCP。
6. `agents/<agent>/mcp.md` 只作为 Agent 内部指针，不重复保存私有配置。
7. MCP 使用必须服从任务单、目标项目路径、文件所有权、锁和敏感文件规则。

## 禁止写入

以下内容不得写入 `mcp/`、`agents/`、`index/`、`project/`、`memory/`、`kb/`、`logs/` 或 `.claude/settings.json`：

- API Key、token、密码、证书、私钥。
- 数据库连接密码、生产库连接串、Cookie、Session。
- 远程 MCP 的完整私有认证 URL。
- `.env`、credentials、secret、token、pem、key 等敏感文件内容。
- 能绕过平台审核、登录、支付、授权或访问控制的配置。

## 配置分级

| 分级 | 文件 | 使用规则 |
|---|---|---|
| 默认配置 | `.mcp.json` / `mcp/claude-project.mcp.json` | 可随 AI-Teams 安装包迁移，默认登记全部共享 MCP；需要密钥的只保存环境变量占位符 |
| 可选示例 | `mcp/optional-servers.mcp.example.json` | 保留为扩展模板；需要用户确认用途、授权范围和环境变量 |
| registry 绑定 | `mcp/registry.json` | 记录 Agent 绑定、用途、安全边界和配置文件，不记录本机安装路径 |
| 私有覆盖 | 用户本机私有配置或环境变量 | 只由用户维护，不进入 AI-Teams 文件，不进入日志、记忆、知识库 |

## Agent 调用规则

1. Agent 只能优先使用 `mcp/agents/<agent>/index.md` 中分配给自己的 MCP。
2. 跨 Agent 使用 MCP 时，必须由 Lead 重新分派或由 Security-Reviewer 审查。
3. Dev 和 QA 使用 CodeGraph、Chrome MCP、数据库或 GitHub MCP 时，必须在交接中记录使用结果或不可用原因。
4. Doc 负责维护 MCP 文档、索引和 文档关系图。
5. Role 修改 Agent MCP 绑定时，必须同步 `agents/<agent>/mcp.md`、`mcp/agents/<agent>/index.md` 和 `mcp/registry.json`。

## Chrome MCP 与浏览器自动化

- QA 的浏览器自动化首选 `chrome` / `ai-teams-chrome`。
- Chrome MCP 默认连接本地 `http://127.0.0.1:12306/mcp`，不需要 API Key。
- 首次使用前，Lead 或 QA 必须引导用户按 [hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome) 安装 Chrome 扩展和 `mcp-chrome-bridge`。
- Chrome MCP 只用于授权页面、目标项目本地页面、测试环境或用户明确指定的页面。
- 不得读取浏览器密码、Cookie 明文、个人历史记录、私有账号材料或用户未授权页面。
- 不得绕过登录、支付、订阅、平台审核、访问控制或风控限制。
- QA 执行前必须确认目标项目根目录 `.mcp.json` 中存在 `ai-teams-chrome`；不可用时记录回退方式。
- `.mcp.json` 默认包含所有 AI-Teams 共享 MCP。Agent 是否实际调用某个 MCP，仍必须遵循本文件、Agent MCP 索引和用户授权边界。

## MySQL 与数据库 MCP

- MySQL MCP 默认只读。
- 任何 INSERT、UPDATE、DELETE、DDL、数据导出、生产库连接都需要用户明确授权。
- 使用前必须确认目标库、环境、账号权限、任务范围和回滚方式。
- 不得把查询结果中的敏感数据写入日志、记忆、知识库或项目文档。
- `ALLOW_INSERT_OPERATION`、`ALLOW_UPDATE_OPERATION`、`ALLOW_DELETE_OPERATION` 只登记环境变量名，不登记值。

## Figma 与远程设计 MCP

- Figma API Key 不进入工程文件，只能由本机私有配置或环境变量提供。
- 设计稿内容用于需求、UI 对齐和文档，不替代用户确认。
- 远程 Canva MCP 默认禁用，必须确认 URL、账号、授权范围和是否允许外部网络调用。

## Filesystem MCP

- Filesystem MCP 必须限制 allowed paths。
- allowed paths 只能包含 AI-Teams harness 工程允许路径和用户明确指定的目标项目路径。
- 敏感文件仍按 [sensitive-files](./sensitive-files.md) 只检测存在，不读取内容。
- 工程内常规文件操作仍优先使用受控脚本和当前工具，不因存在 Filesystem MCP 而绕过 Owner 和锁。

## GitHub MCP

- 需要用户授权和仓库范围确认。
- 不得自动 commit、push、merge、close issue 或修改远程仓库状态，除非用户明确要求。
- 不得写入或展示 token。
- PR、Issue、CI 信息进入项目文档前由 Doc 归并，进入记忆前由 Memory 筛选。

## MCP 登记流程

1. Lead 或 Security-Reviewer 收到 MCP 需求后，先判断它应属于默认启用还是可选启用。
2. 默认启用 MCP 必须无需密钥值，并能通过 `npx` 或随包可迁移命令启动。
3. 需要密钥、数据库、远程 URL、GitHub token、Figma token 或路径限制的 MCP，只能写入 `mcp/optional-servers.mcp.example.json`。
4. 更新 `mcp/registry.json`，只记录名称、传输、命令形态、环境变量名、配置文件、用途和安全边界。
5. 共享 MCP 默认应同步更新 `.mcp.json` 和 `mcp/claude-project.mcp.json`。
6. 更新 `mcp/shared/index.md`、`mcp/agents/index.md` 和对应 `mcp/agents/<agent>/index.md`。
7. 更新对应 `agents/<agent>/mcp.md`。
8. 更新 `index/FILES.md`、`kb/graph.md` 和必要的命令索引。
9. 运行 `bash tools/bin/ai-teams-check.sh`。

## 安装规则

- `tools/bin/ai-teams-mcp-install.sh --plan` 只能生成计划。
- `--apply` 只能写入可迁移配置、脱敏元数据和 registry，不运行未知第三方安装命令。
- 不自动安装未知第三方 MCP。
- 用户提供 GitHub 地址、本地目录或 MCP 配置时，必须先检查敏感字段和执行风险。
- 本机已经安装的 MCP 只能作为候选来源，不能把本机绝对路径写入 AI-Teams registry 或安装包。

## 验收标准

1. 12 个 Agent 在 `mcp/agents/<agent>/index.md` 中都有绑定说明。
2. 12 个 `agents/<agent>/mcp.md` 都指向自己的 MCP 绑定文件。
3. `mcp/registry.json` 覆盖 12 个 Agent。
4. QA 包含 `chrome` 绑定。
5. registry 不包含密钥值、token、证书或数据库密码。
6. `mcp/shared/index.md` 说明每个 MCP 的默认/可选启用方式和安全边界。
7. `.mcp.json` 和 `mcp/claude-project.mcp.json` 包含 registry 中登记的全部共享 MCP。
8. 安装包不得包含本机用户目录绝对路径。
