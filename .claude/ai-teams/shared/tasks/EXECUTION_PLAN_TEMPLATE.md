---
id: "shared-tasks-execution-plan-template"
title: "任务执行方案模板"
type: "shared-template"
scope: "project"
owner: "plan-pm"
status: active
---
# 任务执行方案模板

## 基本信息

- 执行方案 ID：
- 关联任务单：
- 创建者：Plan-PM
- Lead：
- 执行模式：轻量执行 / 标准执行 / 高风险串行 / 扇出-汇总
- 工作流编号：`WF-__`
- 工作流名称：
- 下发方式：单点下发 / 串行下发 / 并行下发 / 扇出-汇总 / 旁路监督
- 状态：draft / active / blocked / done / cancelled

## 执行目标

说明本方案要达成的工程结果，不只写动作。

## 工作流档位

| 项 | 档位 | 说明 |
|---|---|---|
| QA | Q0 / Q1 / Q2 | 不参与 / 轻量检查 / 完整验证 |
| Doc | D0 / D1 / D2 | 不更新 / 更新 project 事实 / 更新索引、图谱、KB |
| Memory | M0 / M1 / M2 / M3 | 不写记忆 / 记忆检查 / 候选记忆 / 正式记忆 |
| Security-Reviewer | S0 / S1 / S2 | 不介入 / 轻量审查 / 前置安全审查 |
| Role | R0 / R1 / R2 | 不介入 / 检查指针 / 更新 Agent 指引 |

## 参与 Agent

| Agent | 职责 | 输入 | 输出 | 是否并行 |
|---|---|---|---|---|

## 旁路监督与收尾门

| Agent | 是否参与 | 档位 | 检查内容 | 结论位置 | 状态 |
|---|---|---|---|---|---|
| QA | 是 / 否 | Q0 / Q1 / Q2 | 验证证据、缺陷、残余风险 |  | pending / done / skipped / blocked |
| Doc | 是 / 否 | D0 / D1 / D2 | `project/`、索引、图谱、KB 候选 |  | pending / done / skipped / blocked |
| Memory | 是 / 否 | M0 / M1 / M2 / M3 | 候选记忆、恢复点、上下文压缩、正式记忆 |  | pending / done / skipped / blocked |
| Security-Reviewer | 是 / 否 | S0 / S1 / S2 | 越界、权限、敏感文件、高风险动作 |  | pending / done / skipped / blocked |
| Role | 是 / 否 | R0 / R1 / R2 | Agent 指引、职责边界、组件指针 |  | pending / done / skipped / blocked |

## 执行顺序

| 步骤 | Agent | 动作 | 输入文件 | 输出文件 | 验收点 |
|---:|---|---|---|---|---|

## 文件范围与锁

| 文件或目录 | Owner | 锁 ID | 写入 Agent | 风险 |
|---|---|---|---|---|

## 状态更新要求

- 开始执行前更新 `shared/task-plan.md`。
- Agent 状态变化时更新 `shared/pipeline-status.md`。
- 并行任务进入同一目录前检查 `shared/locks/LOCKS.md`。
- 阻塞、回流、取消、完成必须能追溯到任务单、交接、锁或回流记录。

## 验证方案

- 自动验证：
- 人工检查：
- QA 进入条件：
- 完成条件：

## 风险与回滚

- 主要风险：
- 需要用户确认的动作：
- 回滚或撤销方式：
