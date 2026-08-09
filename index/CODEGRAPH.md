---
id: "index-codegraph"
title: "CodeGraph 调用索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# CodeGraph 调用索引

## 目标

CodeGraph 用于把本地代码库预索引为可查询知识图谱，减少重复 `grep`、`find` 和大范围文件读取。根据 CodeGraph 官方说明，它通过 tree-sitter 解析代码，将符号、关系边和文件写入本地 `.codegraph/` SQLite 索引，并通过 MCP、CLI 和 TypeScript API 暴露查询能力。

## 官方来源

- GitHub：<https://github.com/colbymchenry/codegraph>
- 文档：<https://colbymchenry.github.io/codegraph/>
- MCP Server：<https://colbymchenry.github.io/codegraph/reference/mcp-server/>

## 当前工程状态

- CodeGraph enabled：否
- 索引路径：`.codegraph/`
- MCP 目录：`mcp/codegraph/`
- 状态记录：`index/FILES.md`
- registry：`mcp/registry.json`

## Agent 调用规则

当 `.codegraph/` 存在且 MCP 可用时：

1. 架构、调用关系、影响范围、符号定位问题，优先调用 CodeGraph。
2. 先用 `codegraph_status` 检查索引健康。
3. 任务级上下文先用 `codegraph_context`。
4. 需要源码片段时再用 `codegraph_explore`。
5. 需要查找符号时用 `codegraph_search`。
6. 修改前影响分析用 `codegraph_impact`。
7. 追踪调用链用 `codegraph_trace`、`codegraph_callers`、`codegraph_callees`。
8. CodeGraph 不可用时，回退到 `index/`、`rg` 和必要文件读取。

## 执行顺序

1. 读取本文件和 `index/FILES.md` 的 CodeGraph 状态。
2. 如果 MCP 可用，先调用 `codegraph_status`。
3. 使用 `codegraph_context` 获取任务相关上下文。
4. 使用 `codegraph_explore` 或 `codegraph_search` 定位符号。
5. 修改前使用 `codegraph_impact` 评估影响范围。
6. 不可用时说明原因，回退到索引、`rg` 和必要文件读取。

## 工具清单

| 工具 | 用途 |
|---|---|
| `codegraph_status` | 检查索引健康和统计信息 |
| `codegraph_files` | 获取已索引文件结构 |
| `codegraph_search` | 按名称查找符号 |
| `codegraph_context` | 为任务构建相关代码上下文 |
| `codegraph_node` | 获取符号详情，可包含源码 |
| `codegraph_explore` | 按文件返回多个相关符号和关系图 |
| `codegraph_callers` | 查询函数调用方 |
| `codegraph_callees` | 查询函数被调用方 |
| `codegraph_trace` | 追踪两个符号之间的调用路径 |
| `codegraph_impact` | 分析修改某符号的影响范围 |

## 初始化建议

后续实现阶段可在目标项目中执行：

```bash
npx @colbymchenry/codegraph init -i
```

或启动 MCP：

```bash
codegraph serve --mcp
```

## 边界

- CodeGraph 是代码索引，不替代需求索引、知识库或记忆。
- 索引内容来自本地代码，不应上传敏感信息。
- 如果目标项目包含敏感源码，仍需遵守 `security/sensitive-files.md`。
