---
id: ADR-0008
title: Lead 即时接管与多 Agent 心跳
type: adr
scope: project
status: accepted
date: 2026-06-14
owner: doc
decision_by: lead
---
# ADR-0008：Lead 即时接管与多 Agent 心跳

## 1. 背景

旧的 attempt 0-3 机制允许 Agent 在 Lead 介入前连续重试，容易在权限、锁、环境、任务跑偏或安全问题上重复消耗时间。多 Agent 派出后也缺少持续的可读状态，Lead 可能直到全部结束才发现卡断。

## 2. 决策

> 我们决定：首次失败、权限拒绝、安全阻断、锁/Owner 冲突、跑偏或停滞时由 Lead 立即接管；根因明确后最多允许一次定向重试。Hooks 维护 10 秒心跳状态，Lead 负责真正的诊断和路由。

## 3. 原因

- 权限和安全失败不适合由执行 Agent 自主重复尝试。
- 一次有根因的定向重试足以覆盖路径、参数和局部环境错误。
- 10 秒状态刷新可以更早发现无响应和跑偏，又不把复杂调度逻辑塞进 Hook。
- Claude Code Hook 是事件驱动机制，因此 Hook 负责发现和落盘，Lead 负责接管决策。

## 4. 影响范围

- 目录：`shared/supervision/`, `shared/escalations/`, `shared/events/`, `hooks/`。
- Agent：Lead 和全部执行 Agent。
- 规则：`playbook.md`, `security/supervision-policy.md`, `security/escalation-policy.md`。
- 记忆：心跳运行状态不进入正式记忆。
- 知识库：不把动作规则写入知识库。
- 安全：权限、锁、Owner、删除和敏感文件问题立即进入 Lead + Security-Reviewer 复核。

## 5. 后果

### 正面影响

- 失败更早暴露，Lead 不再等待多轮重复失败。
- 多 Agent 活动、工具、目标和停滞状态可以追溯。
- 重试路径更短，权限和安全问题不会被重复绕过。

### 负面影响

- `PostToolUse` 心跳会增加少量 Hook 开销。
- 后台监控只能落盘和在生命周期事件中反馈，不能脱离 Claude Code 事件让主模型自行运行。

### 需要注意

- Lead 仍必须主动轮询，不能把调度职责交给 Hook。
- `.runtime/` 是可重建状态，不是项目知识或记忆。

## 6. 关联

- 相关规则：[retry-flowback](../../../shared/escalations/retry-flowback.md), [supervision-policy](../../../security/supervision-policy.md), [escalation-policy](../../../security/escalation-policy.md)
- 相关目录：`shared/supervision/`, `shared/events/`, `hooks/scripts/`
- 相关 Agent：Lead、Security-Reviewer、全部执行 Agent
- 相关任务：安全、记忆、初始化与多 Agent 运行时核查
- 替代关系：替代 ADR-0005 中 attempt 0-3 / attempt 4+ 的重试次数设计；保留 ADR-0005 作为历史原因。
