---
id: "index-project"
title: "项目索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# 项目索引

本索引用于目标项目接入后的项目管理入口。安装后尚未初始化目标项目，不携带 AI-Teams 源工程扫描结果。

## 项目知识图谱

- 项目图谱：project/graph
- 项目管理索引：project/index
- 项目运行期上下文：project/context
- 项目规则索引：project/rules/index
- 初始化脚本：tools/bin/ai-teams-init-project.sh

## 初始化状态

- 目标项目：尚未初始化。
- 项目画像：尚未生成。
- 项目规则：尚未吸收。
- 项目图谱：等待初始化脚本和 Doc 处理。

## 运行期规则

1. 项目初始化只写第一轮画像；后续任务执行必须继续维护 `project/`。
2. Doc 是 `project/` 的维护者，负责项目上下文、规则、状态、风险、验证和项目图谱。
3. 所有 Agent 在项目类任务前和关键阶段切换前必须频繁读取 project/index.md、project/context.md、project/change-log.md、project/project-profile.md、project/ui-style.md、project/api-contracts.md 和 project/graph.md。
4. Lead 关闭非平凡任务前按 security/project-policy 检查 Doc 是否已处理或明确跳过项目更新。
