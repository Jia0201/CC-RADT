---
id: "tools-commands-ai-mcp-install"
title: "安装 MCP 指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 安装 MCP 指令

## 用途

为指定 Agent 登记、绑定或规划启用 MCP。

## 输入

- MCP 配置来源或 npm 包名。
- 目标 Agent。
- 启用范围：默认项目 MCP、可选 MCP 或 Agent 专属绑定。

## 可执行入口

```bash
bash tools/bin/ai-teams-mcp-install.sh --name <名称> --agent <Agent名称> --source <来源> --command <启动命令> --plan
bash tools/bin/ai-teams-mcp-install.sh --name <名称> --scope shared --source <来源> --command <启动命令> --plan
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取用户提供的 GitHub 地址或 MCP 配置。
3. 检查配置格式和可迁移性。
4. 检查密钥风险与本机绝对路径风险。
5. 检查目标 Agent。
6. 按 [mcp-policy](../../../security/mcp-policy.md) 判断是否只写计划、是否允许 registry 写入。
7. 如果是共享 MCP，同步更新 `.mcp.json` 和 `mcp/claude-project.mcp.json`。
8. 如果需要密钥、远程 URL、数据库或路径限制，只写环境变量名或占位符，不写密钥值。
9. 更新 `mcp/registry.json`。
10. 更新 MCP 索引和 Agent MCP 指针。
11. 写入日志。
12. 输出结果。

## 读取文件

- `index/INDEX.md`
- `mcp/registry.json`
- `.mcp.json`
- `mcp/claude-project.mcp.json`
- `mcp/optional-servers.mcp.example.json`
- `mcp/index.md`
- `mcp/shared/index.md`
- `mcp/agents/index.md`
- `index/AGENTS.md`
- `security/mcp-policy.md`
- `security/sensitive-files.md`
- `用户提供的 MCP 配置`

## 修改文件

- `mcp/`
- `mcp/registry.json`
- `.mcp.json`
- `mcp/claude-project.mcp.json`
- `mcp/optional-servers.mcp.example.json`
- `mcp/shared/index.md`
- `mcp/agents/<agent>/index.md`
- `agents/<agent>/mcp.md`
- `index/AGENTS.md`
- `logs/command/`

## 安全边界

- 不自动安装未知第三方 MCP。
- 不得把密钥写入 registry。
- 本机绝对路径不进入 registry、`.mcp.json` 或安装包。
- 需要密钥的 MCP 只保存环境变量名和模板。
- `--apply` 只执行受控 registry 写入和元数据记录，不运行第三方安装命令。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 MCP 配置格式正确。
- 确认 registry 可解析。
- 确认默认项目 MCP 已同步到 `.mcp.json`。
- 确认 registry 和模板不包含本机绝对路径或密钥值。
- 确认目标 Agent 存在。

## 日志

- `logs/command/`
