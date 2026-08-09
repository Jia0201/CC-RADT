---
id: ADR-0003
title: 记忆分层
type: adr
scope: project
status: accepted
date: 2026-06-02
owner: doc
decision_by: lead
---
# ADR-0003：记忆分层

## 1. 背景

AI-Teams 需要同时处理长期记忆、Agent 独立记忆、候选记忆、会话恢复材料、上下文压缩和知识库沉淀。如果不分层，日志、会话摘要、知识库和长期记忆会互相污染。

## 2. 决策

> 我们决定：记忆体系由 Memory Agent 管理，使用 `memory/` 作为正式记忆根目录，使用 `memory/agents/` 保存 Agent 独立记忆，使用 `memory/candidates/` 保存候选记忆，使用 `memory/conversations/` 保存会话恢复材料。

知识库仍归 `kb/`，共享协作状态仍归 `shared/`，日志仍归 `logs/`。

## 3. 原因

- 分层能支持断线恢复和上下文压缩，同时不把所有过程都写成长期记忆。
- `memory/conversations/` 保留会话恢复材料，不等于正式记忆。
- `kb/` 只保存稳定可复用知识，避免把短期状态沉淀成知识。

## 4. 影响范围

- 目录：`memory/`, `memory/agents/`, `memory/candidates/`, `memory/conversations/`, `kb/`, `shared/`, `logs/`。
- Agent：Memory, Doc, Lead。
- 记忆：正式记忆和候选记忆分离。
- 知识库：知识沉淀由 Doc 判断。
- 安全：敏感信息不得进入记忆正文或 frontmatter。

## 5. 后果

### 正面影响

- 恢复、压缩、长期记忆和知识库边界清楚。
- Memory Agent 的职责明确。

### 负面影响

- 需要在交接时判断信息进入 memory、kb、logs 还是 shared。

### 需要注意

- 不是所有会话内容都进入正式记忆。
- 会话恢复材料不参与知识库，除非经 Doc 验证沉淀。

## 6. 关联

- 相关规则：[index](../../../memory/index.md), [context-compression](../../../memory/context-compression.md)
- 相关目录：`memory/`, `kb/`, `shared/`, `logs/`
- 相关 Agent：Memory, Doc, Lead
- 相关任务：上下文压缩与记忆规则补充
- 替代关系：无
