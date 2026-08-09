---
id: "shared-escalations-escalation-template"
title: "升级与回流模板"
type: "shared-template"
scope: "project"
owner: "lead"
status: active
---
# 升级与回流模板

## 基本信息

- escalation ID：
- 关联任务 ID：
- 原 Owner：
- 当前 Lead：
- 触发时间：
- 当前状态：pending / resolved

## 触发原因

- attempt：4+
- 失败摘要：
- 是否涉及安全：
- 是否涉及文件所有权：
- 是否涉及锁：
- 是否涉及需求歧义：

## 尝试链

| attempt | 执行动作 | 变化变量 | 验证结果 | 失败证据 |
|---:|---|---|---|---|
| 0 |  |  |  |  |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

## 复核三问

1. 现在确信的事实是什么？
2. 失败最可能的根因是什么，证据和反证分别是什么？
3. 下一步最小、可验证、不会扩大风险的动作是什么？

## Lead 路由

- 回流目标：
- 新 Owner：
- 是否拆分任务：
- 是否冻结文件：
- 是否触发 Security-Reviewer：
- 是否需要用户确认：

## 状态更新

- `shared/task-plan.md` 更新：
- `shared/pipeline-status.md` 更新：
- 相关锁：
- 相关交接：
- 相关日志：

## 关闭记录

- 关闭结论：
- 新任务单或执行方案：
- 后续风险：
- 归档位置：`shared/escalations/resolved/`
