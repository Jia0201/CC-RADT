---
id: "rule-knowledge-index"
title: "知识与记忆路由"
type: "rule-index"
scope: "project"
owner: "doc"
status: active
---
# 知识与记忆路由

| 需要 | 读取入口 | 使用边界 |
|---|---|---|
| 当前项目事实 | [index](../project/index.md), [index](../../project/index.md) | 不从 KB 猜当前项目事实 |
| Agent 专业知识 | `kb/agents/<agent>/index.md` | 只读与职责相关部分 |
| 跨 Agent 稳定知识 | [index](../../kb/shared/index.md) | 必须经过验证 |
| 调用链和影响分析 | [CODEGRAPH](../../index/CODEGRAPH.md) | 不可用时再用目录索引和必要检索 |
| 当前协作状态 | [index](../../shared/index.md) | 不写入 KB |
| 恢复和长期偏好 | [index](../../memory/index.md) | 由 Memory 管理 |
| 长期结构决策原因 | [index](../../project/adr/index.md) | 不等于执行规则 |

先由规则路由定位知识入口，再读取具体知识文件；不得默认加载整个 `kb/`。
