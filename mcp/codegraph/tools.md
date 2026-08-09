---
id: "mcp-codegraph-tools"
title: "CodeGraph 工具清单"
type: "mcp-doc"
scope: "project"
owner: "doc"
status: active
---
# CodeGraph 工具清单

## 调用顺序

1. `codegraph_status`：检查索引是否存在、是否健康。
2. `codegraph_context`：获取任务相关代码上下文。
3. `codegraph_explore`：探索文件内相关符号和源码片段。
4. `codegraph_search`：按符号名查找目标。
5. `codegraph_impact`：修改前分析影响范围。
6. `codegraph_callers` / `codegraph_callees`：分析调用方和被调用方。
7. `codegraph_trace`：追踪两个符号之间的调用路径。

## 工具说明

| 工具 | 适用场景 | 输出用途 |
|---|---|---|
| `codegraph_status` | 初始化检查、任务开始前检查 | 判断是否可用、是否需要回退 |
| `codegraph_files` | 查看索引文件树 | 快速定位目录和文件 |
| `codegraph_search` | 搜索类、函数、方法、路由等符号 | 代替粗暴全文搜索 |
| `codegraph_context` | 需求分析、Bug 定位、架构理解 | 生成最小相关上下文 |
| `codegraph_node` | 查看单个符号详情 | 获取定义、关系和源码 |
| `codegraph_explore` | 查看一个文件或区域的多个相关符号 | 减少大文件全文读取 |
| `codegraph_callers` | 查找谁调用了目标符号 | 影响范围判断 |
| `codegraph_callees` | 查找目标符号调用了谁 | 理解执行路径 |
| `codegraph_trace` | 追踪调用链 | 分析跨模块路径 |
| `codegraph_impact` | 修改前评估 | QA 和 Dev 风险判断 |

## Agent 使用规则

- Dev 和 QA 必须优先尝试 CodeGraph。
- Lead 在分派代码任务时应要求 Dev 说明是否使用 CodeGraph。
- QA 报告应记录 CodeGraph 是否可用、使用了哪些查询、是否回退。
- Doc 可将经验证的架构知识沉淀到 `kb/`，但不得把 CodeGraph 原始输出当作正式知识库。
