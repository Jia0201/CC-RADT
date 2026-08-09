---
id: "tools-commands-ai-cron-list"
title: "查询定时任务指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 查询定时任务指令

## 用途

查询当前工程定时任务名称、频率、最近执行结果、启用状态和报告位置。

## 输入

- 可选任务名称。

## 流程

1. 读取 `index/INDEX.md`。
2. 读取 `cron/schedules.md`。
3. 读取 `cron/jobs/`。
4. 读取 `cron/reports/`。
5. 输出任务状态。
6. 输出结果。

## 读取文件

- `index/INDEX.md`
- `cron/schedules.md`
- `cron/jobs/`
- `cron/reports/`

## 修改文件

- `logs/command/`

## 安全边界

- 查询不执行定时任务。
- 不读取报告中的敏感内容。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 schedule 文档存在。
- 确认报告目录存在。

## 日志

- `logs/command/`
