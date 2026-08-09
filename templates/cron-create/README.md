---
id: "templates-cron-create-readme"
title: "定时任务创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 定时任务创建模板

## 用途

用于定义 AI-Teams 的定时维护任务，例如日志压缩、索引状态检查和 MCP / Skills 状态检查。

## 所有者

Lead 负责维护，Security 负责审查安全边界。

## 使用方式

复制 `template.md` 后填写任务名称、频率、触发条件、执行脚本、输出目录和失败处理方式。

## 输出

生成 `cron/` 下的任务说明，并更新 `cron/schedules.md`。
