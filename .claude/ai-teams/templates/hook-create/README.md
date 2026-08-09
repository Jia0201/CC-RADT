---
id: "templates-hook-create-readme"
title: "Hook 创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# Hook 创建模板

## 用途

用于定义最小安全 Hook 或固定自动化 Hook。

## 所有者

Security 负责维护，Lead 负责启用策略。

## 使用方式

复制 `template.md` 后填写触发时机、检查范围、允许行为、阻断条件、日志位置和回退方案。

## 输出

生成 `hooks/scripts/` 或 `hooks/` 下的 Hook 说明，并更新 `hooks/index.md`。
