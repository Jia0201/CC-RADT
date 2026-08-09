---
id: "templates-tool-create-readme"
title: "工具创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 工具创建模板

## 用途

用于创建 AI-Teams 工具脚本、工具说明和验证规则。

## 所有者

Lead 负责工具目标，Security 负责命令安全，QA 负责验证。

## 使用方式

复制 `template.md` 后填写工具名称、命令入口、输入参数、输出文件、安全边界和测试方式。

## 输出

生成 `tools/` 下的工具说明或 `tools/bin/` 下的脚本，并更新 `project/commands.md`。
