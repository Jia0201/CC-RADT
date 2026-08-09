---
id: "project-dependencies"
title: "依赖"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 依赖

## 运行时依赖

当前主工程没有应用运行时依赖。

## 工具依赖

- Shell：用于自检脚本、核心工具脚本和 Hook 检查脚本。
- Git：仅作为辅助环境信号；当前目录不是 Git 仓库或 Git 命令不可用时静默跳过，不影响项目初始化、规划、开发或验收。
- Markdown / JSON：工程主体文档和 registry 格式。

## 外部能力

- MCP：通过 `mcp/registry.json` 管理共享 MCP、Agent MCP 和 CodeGraph 状态。
- Skills：通过 `skills/registry.json` 管理共享 Skills 和 Agent Skills。
- CodeGraph：当前已具备状态记录、调用规则和最小检测脚本；MCP 运行态深度检测后续增强。

