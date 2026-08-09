---
id: "templates-agent-create-readme"
title: "Agent 创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# Agent 创建模板

## 用途

用于创建新的 Agent 职责文档、记忆目录和知识库目录。

## 所有者

Role Agent 负责维护，Lead 和 Doc 可参与评审。

## 使用方式

复制 `template.md` 后填写 Agent 名称、职责、输入、输出、安全边界、协作对象和验收方式。

## 输出

生成 `agents/<agent-name>/<agent-name>.md`，更新 `agents/index.md`，并同步创建 `memory/agents/<agent-name>/` 与 `kb/agents/<agent-name>/`。
