---
id: "kb-agents-lead-00-index"
title: "Lead Agent 知识库索引"
type: "knowledge-index"
scope: "agent"
owner: "doc"
status: active
---
# Lead Agent 知识库索引

Lead 的知识库只保存多 Agent 调度、任务路由、验收收口和风险仲裁相关的稳定知识。

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | Lead 判断时优先采用的权威来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 调度、分派、监督、关闭任务的工程规则 |
| [03-code-style](./03-code-style.md) | Lead 生成任务文档、状态板和交接文字时的格式要求 |
| [04-review-checklist](./04-review-checklist.md) | Lead 关闭任务前的检查清单 |
| [05-do-not](./05-do-not.md) | Lead 禁止事项 |

## 使用时机

- 收到非平凡任务，需要判断 Agent 分派与读写路径。
- 多 Agent 并行执行，需要设置同步点和监督记录。
- QA、Doc、Memory、Security-Reviewer 返回阻塞，需要 Lead 仲裁。
- 任务完成前，需要确认 project、memory、security、shared 状态闭环。
