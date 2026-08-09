---
id: "templates-security-rule-create-readme"
title: "安全规则创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 安全规则创建模板

## 用途

用于新增敏感文件、删除、权限、MCP、Skills 或 Hook 安全规则。

## 所有者

Security-Reviewer 负责维护，Lead 负责最终启用。

## 使用方式

复制 `template.md` 后填写风险类型、保护范围、阻断条件、人工确认条件和日志要求。

## 输出

生成 `security/` 下的安全规则，并更新 `security/index.md`。
