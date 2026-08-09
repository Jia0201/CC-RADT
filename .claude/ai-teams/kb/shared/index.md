---
id: "kb-shared-index"
title: "共享知识库索引"
type: "knowledge-index"
scope: "shared"
owner: "doc"
status: active
---

# 共享知识库索引

共享知识库保存所有 AI-Teams Agent 都可以复用的稳定知识。

## 当前共享知识域

| 知识域 | 入口 | 说明 |
|---|---|---|
| 工程地图 | [CLAUDE](../../CLAUDE.md) | Claude Code 进入 AI-Teams 后的主地图 |
| Agent 团队 | [index](../../agents/index.md) | 12 个 Agent 的索引和职责入口 |
| 指令体系 | [index](../../tools/commands/index.md) | 用户指令说明和工具入口 |
| 记忆体系 | [index](../../memory/index.md) | 记忆、候选记忆和恢复材料 |
| 知识图谱 | [graph](../graph.md) | 文档关系图主入口 |
| 安全治理 | [index](../../security/index.md) | 敏感文件、删除、所有权和高风险操作 |
| CodeGraph | [CODEGRAPH](../../index/CODEGRAPH.md) | 代码图谱调用和回退规则 |
| 标准 Markdown 规范 | [导航规范](../../index/NAVIGATION.md) | 最小 frontmatter、标准 Markdown 链接和图谱规范 |

## 当前知识条目

| 条目 | 说明 |
|---|---|
| [engineering-brain](./engineering-brain.md) | AI-Teams 工程大脑边界 |
| [markdown-document-standard](./markdown-document-standard.md) | 标准 Markdown 文档标准 |
| [agent-collaboration-protocol](./agent-collaboration-protocol.md) | Agent 协作协议 |
| [memory-and-compression](./memory-and-compression.md) | 记忆与上下文压缩分层 |
| [shared-workspace-protocol](./shared-workspace-protocol.md) | 共享工作区与广播协议 |

## 写入规则

- 共享知识必须经过 Doc 验证。
- 共享知识应至少链接一个上游来源和一个使用入口。
- 只对单个 Agent 有用的知识进入 [index](../agents/index.md)。
- 短期任务过程留在 `logs/` 或 `shared/handoffs/`，不进入共享知识库。
