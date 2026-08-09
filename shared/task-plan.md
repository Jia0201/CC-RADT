---
id: "shared-task-plan"
title: "任务计划状态"
type: "shared-doc"
scope: "project"
owner: "plan-pm"
status: active
---
# 任务计划状态

本文件记录当前任务计划、重试计数和回流状态。它是实时状态板和汇总视图，不替代 `shared/tasks/` 中的任务单或执行方案。普通 Agent 优先写 [index](./events/index.md)，跨状态板变更写 [index](./transactions/index.md)，Lead / Plan-PM 再按 [state-transaction-policy](../security/state-transaction-policy.md) 汇总。

## 状态字段

| 字段 | 含义 |
|---|---|
| 任务 ID | 对应任务单或交接文件 |
| 工作流编号 | `WF-01` 到 `WF-12`，记录实际采用的工作流 |
| 工作流名称 | 工作流的人类可读名称 |
| 下发方式 | 单点下发 / 串行下发 / 并行下发 / 扇出-汇总 / 旁路监督 |
| Owner | 当前负责 Agent |
| 状态 | `TODO` / `DOING` / `RETRYING` / `FLOWBACK` / `REVIEW` / `DONE` / `CANCELLED` |
| attempt | `0` 到 `3` 为可重试范围；`4+` 进入回流 |
| 尝试计数 | `1/4` 到 `4/4`；第 `4+` 次超出 4/4 |
| 上游 | 回流时接收复核的上游 Agent |
| QA 档位 | `Q0` / `Q1` / `Q2`，不参与 / 轻量检查 / 完整验证 |
| Doc 档位 | `D0` / `D1` / `D2`，不更新 / 更新 project 事实 / 更新索引、图谱、KB |
| Memory 档位 | `M0` / `M1` / `M2` / `M3`，不写记忆 / 记忆检查 / 候选记忆 / 正式记忆 |
| Security 档位 | `S0` / `S1` / `S2`，不介入 / 轻量审查 / 前置安全审查 |
| Role 档位 | `R0` / `R1` / `R2`，不介入 / 检查指针 / 更新 Agent 指引 |
| Memory 结论 | pending / 无需记录 / 已检查无候选 / 已写候选 / 已写正式记忆 / blocked |
| 最近失败 | 最近一次失败摘要 |
| 下一步 | 下一次动作或回流复核动作 |

## 活动任务

| 任务 ID | 工作流 | Owner | 状态 | attempt | 尝试计数 | 上游 | QA 档位 | Doc 档位 | Memory 档位 | Security 档位 | Role 档位 | Memory 结论 | 最近失败 | 下一步 |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| 当前无活动任务 | - | Lead | TODO | 0 | 1/4 | - | Q0 | D0 | M0 | S0 | R0 | 无需记录 | - | 等待任务单 |

## 重试清零记录

当 attempt >= 4 进入回流后，Lead 必须记录：

- 任务 ID。
- 原 Owner。
- 失败摘要。
- 回流目标。
- 清零原因与新的 attempt / 尝试计数。
- 新任务单或修订后的任务定义。

## 更新规则

- 任务创建、工作流选择、档位选择、Owner 切换、attempt 变化、阻塞、回流、QA、Memory 结论和关闭时必须更新。
- 普通 Agent 不直接编辑本文件，先写状态事件。
- 修改前检查 [LOCKS](./locks/LOCKS.md)，并通过 `tools/bin/ai-teams-lock.sh` 取得文件级锁。
- 状态变更必须能追溯到事件、事务、任务单、执行方案、交接、锁、回流记录或日志。
