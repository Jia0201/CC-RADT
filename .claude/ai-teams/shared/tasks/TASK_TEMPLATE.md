---
id: "shared-tasks-task-template"
title: "任务单"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 任务单

## 目标

填写任务要达成的业务或工程结果，避免只写动作。

## 上下文

填写需求来源、相关文件、约束、已有结论和不能触碰的范围。

## 工作流与下发

- 工作流编号：`WF-__`
- 工作流名称：
- 选择依据：
- 下发方式：单点下发 / 串行下发 / 并行下发 / 扇出-汇总 / 旁路监督
- 参与 Agent：
- 旁路监督 Agent：Doc / Memory / Security-Reviewer / Role / 无
- QA 档位：Q0 / Q1 / Q2
- Doc 档位：D0 / D1 / D2
- Memory 档位：M0 / M1 / M2 / M3
- Security 档位：S0 / S1 / S2
- Role 档位：R0 / R1 / R2
- 高风险升级检查：未触发 / 已升级 WF-11 / 待确认

## 步骤

填写建议执行顺序、需要参与的 Agent、需要先读的索引和需要验证的命令。

## 任务单与执行方案

- 是否需要任务单：是 / 否
- 是否需要执行方案：是 / 否
- 判断依据：小任务轻量执行 / 中大型任务 / 多 Agent / 高风险 WF-11 / 其他
- 执行方案文件：`shared/tasks/<task-id>-execution-plan.md`
- 模板：[EXECUTION_PLAN_TEMPLATE](./EXECUTION_PLAN_TEMPLATE.md)

## 验收标准

填写可检查的完成条件，包括文件产物、脚本结果、日志位置和未完成项。

## Memory 处理结论

- Memory 档位：M0 / M1 / M2 / M3
- 结论：无需记录 / 已检查无候选 / 已写候选 / 已写正式记忆 / blocked
- 写入或交接位置：
- Doc / project 分流项：
- 未采纳或跳过原因：

## 重试状态

- 当前阶段：首次执行
- 定向重试预算：1 次，必须由 Lead 诊断后授权
- Lead 接管状态：否
- 当前策略：Agent 在任务边界内执行
- 失败摘要：无
- 回流目标：无
- 状态记录：[task-plan](../task-plan.md) / [pipeline-status](../pipeline-status.md)
