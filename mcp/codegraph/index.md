---
id: "mcp-codegraph-index"
title: "CodeGraph MCP 入口"
type: "mcp-doc"
scope: "project"
owner: "doc"
status: active
---
# CodeGraph MCP 入口

## 目标

CodeGraph 用于把目标项目代码预索引为本地知识图谱，减少 Agent 对源码的重复搜索、重复读取和无效工具调用。

## 官方来源

- GitHub：<https://github.com/colbymchenry/codegraph>
- 文档：<https://colbymchenry.github.io/codegraph/>

## 当前状态

- 是否启用：否
- 状态：unknown
- 本地索引路径：`.codegraph/`
- MCP registry：`mcp/registry.json`
- 调用索引：`index/CODEGRAPH.md`

## 初始化

目标项目具备 CodeGraph 条件时，后续实现阶段可执行：

```bash
npx @colbymchenry/codegraph init -i
```

或使用已安装 CLI：

```bash
codegraph init -i
```

## MCP 启动

```bash
codegraph serve --mcp
```

## 使用边界

- CodeGraph 只索引本地代码，不替代工程索引、记忆或知识库。
- 敏感文件仍按 `security/sensitive-files.md` 处理。
- 当 MCP 不可用或索引过期时，回退到 `index/` 和必要的文件读取。
