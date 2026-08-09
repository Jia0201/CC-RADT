---
id: "kb-shared-agent-collaboration-protocol"
title: "Agent 协作协议"
type: "knowledge"
scope: "shared"
owner: "doc"
status: active
---

# Agent 协作协议

非平凡任务默认由 Lead 调度多 Agent 协作。协作必须落到文件，不能依赖不可追溯的临时聊天记忆。

## 协作链路

1. Lead 接收需求。
2. PD 分析需求。
3. Plan-PM 拆解任务。
4. Dev 执行开发或修复。
5. QA 验证和代码评审。
6. Doc 沉淀知识库或文档。
7. Memory 筛选记忆和恢复点。
8. Security-Reviewer 处理风险边界。
9. Role 处理 Agent 职责调整。

## 文件落点

- 任务单：`shared/tasks/`
- 交接：`shared/handoffs/`
- 决策：`shared/decisions/`
- 记忆候选：`memory/candidates/`
- 知识候选：`kb/candidates/`
- 任务日志：`logs/task/`

## 验收规则

- Dev 输出必须进入 QA，除非任务不涉及开发或用户明确跳过。
- 需要长期恢复的信息交给 Memory。
- 需要稳定复用的信息交给 Doc。
- 涉及敏感、删除、命令、MCP、Skills、Hooks 风险时交给 Security-Reviewer。
