---
id: ADR-0005
title: 错误处理与重试回流
type: adr
scope: project
status: accepted
date: 2026-06-02
owner: doc
decision_by: lead
---
# ADR-0005：错误处理与重试回流

## 1. 背景

多 Agent 协作需要明确失败后的重试上限、递进策略、回流路由和 Lead 仲裁职责。若失败后无限重试或随意扩大范围，会破坏工程安全和可追溯性。

## 2. 决策

> 我们决定：AI-Teams 使用 attempt 0-3 的递进重试机制，attempt 4+ 进入回流流程。协议本体在 `shared/escalations/retry-flowback.md`，现场执行规则在 `playbook.md`。

回流状态写入 `shared/task-plan.md`、`shared/pipeline-status.md` 和 `shared/escalations/`。

## 3. 原因

- 递进重试能给 Agent 自修机会，同时避免无限循环。
- 第 4+ 次失败由 Lead 路由和仲裁，能处理合规、安全、跨域和链式失败。
- 状态写入共享文件，保证任务恢复和后续审计可追溯。

## 4. 影响范围

- 目录：`docs/governance/`, `shared/`, `security/agent-playbooks/`, `agents/`。
- Agent：全部 Agent。
- 规则：playbook 和 retry-flowback 成为执行前必读规则。
- 记忆：长期教训由 Memory 筛选。
- 知识库：可复用失败模式由 Doc 沉淀。
- 安全：高风险失败由 Lead 和 Security-Reviewer 接手。

## 5. 后果

### 正面影响

- 失败处理有明确上限。
- 回流路径清晰。
- QA、Memory、Doc、Role、Security-Reviewer 的介入点更明确。

### 负面影响

- 需要维护任务状态和 pipeline 状态。

### 需要注意

- attempt 4+ 前不得扩大修改范围或绕过安全边界。
- 草案中的主决策角色在本工程中统一由 Lead 执行。

## 6. 关联

- 相关规则：[playbook](../../../playbook.md), [retry-flowback](../../../shared/escalations/retry-flowback.md)
- 相关目录：`shared/escalations/`, `security/agent-playbooks/`
- 相关 Agent：Lead, Plan-PM, QA, Security-Reviewer
- 相关任务：错误与重试机制修复
- 替代关系：重试次数与回流时机由 [ADR-0008-lead-takeover-heartbeat](./ADR-0008-lead-takeover-heartbeat.md) 替代；本 ADR 仅保留历史原因。
