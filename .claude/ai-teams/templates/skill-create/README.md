---
id: "templates-skill-create-readme"
title: "Skill 创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# Skill 创建模板

## 用途

用于创建可复用 Skill，包括触发条件、流程、允许工具和安全边界。

## 所有者

Role 和 Doc 负责维护，Security 负责检查脚本风险。

## 使用方式

复制 `SKILL.template.md` 后填写 Skill 名称、描述、触发关键词、流程、输入输出和禁止事项。

## 输出

生成 `skills/` 或 Agent 专属 Skills 目录下的 `SKILL.md`，并更新 `skills/registry.json`。
