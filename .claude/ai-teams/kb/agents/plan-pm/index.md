---
id: "kb-agents-plan-pm-index"
title: "Agent 知识库"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Plan-PM Agent 知识库

Plan-PM 知识库保存任务拆解、执行方案、依赖排序、并行/串行分工、风险控制和验收安排相关的稳定知识。

## 新索引

- [00-index](./00-index.md)

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | 项目管理、任务拆解和工程内规范来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 任务单、依赖、并行、风险、验证和交接知识 |
| [03-code-style](./03-code-style.md) | 计划、任务卡、里程碑和验收安排的写作风格 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于计划审查的清单 |
| [05-do-not](./05-do-not.md) | Plan-PM 计划知识禁区 |

## 什么时候使用

- PD 完成需求分析，需要拆解可执行任务。
- 多 Agent 任务需要文件范围、锁计划、依赖关系和同步点。
- 任务失败需要重新拆分或降低范围。

## Codex 生成内容时要遵守什么

1. 计划必须绑定需求、目标文件范围、Owner、输入、输出、验证方式。
2. 并行任务必须声明锁范围和交接点。
3. 不把任务单写成空泛待办；每项任务都要能被 QA 验收。
4. Plan-PM 知识描述计划结构和分工依据，不替代 Lead 的最终派发职责。
5. 任务计划和流水线状态应保持一致的状态语义、交付物描述和验收口径。
