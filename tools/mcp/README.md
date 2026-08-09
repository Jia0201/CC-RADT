---
id: "tools-mcp-readme"
title: "MCP 工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# MCP 工具

## 用途

保存 MCP 查询、受控注册和 Agent 级 MCP 管理说明。

## 状态

v1.0 已提供查询、脱敏登记和 Agent 绑定说明。MCP 的工程事实在 `mcp/registry.json`，人类可读入口在 [index](../../mcp/index.md)。

## 可执行入口

```bash
bash tools/bin/ai-teams-mcp-list.sh
bash tools/bin/ai-teams-mcp-install.sh --name <名称> --agent <Agent> --source <来源> --command <命令> --plan
```

## 安全边界

- 不自动运行未知第三方安装命令。
- 不把密钥、token、证书或环境变量内容写入 registry。
- 本地私有 MCP 配置不进入发布包。
- 使用、安装、跨 Agent 调用或远程 MCP 启用前读取 [mcp-policy](../../security/mcp-policy.md)。
- QA 浏览器自动化首选 `mcp/agents/qa/index.md` 中的 Chrome MCP；当前状态需要运行态复核。
