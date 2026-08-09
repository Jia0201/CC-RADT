---
id: "rule-project-index"
title: "目标项目规则索引"
type: "rule-index"
scope: "project"
owner: "doc"
status: active
---
# 目标项目规则索引

本目录是所有 Agent 获取目标项目事实的快速入口。初始化脚本负责生成目录与文件索引，Doc 在项目运行期间持续维护。

| 需要了解 | 优先读取 | 正文来源 |
|---|---|---|
| 项目概况与技术栈 | [project-profile](../../project/project-profile.md), [stack](../../project/stack.md) | 当前项目扫描与 Agent 复核 |
| 项目目录 | [structure](./structure.md) | 目标项目文件系统 |
| 精确文件 | [files](./files.md) | 目标项目文件系统 |
| 项目工作流 | [workflow](./workflow.md) | [commands](../../project/commands.md), [verification](../../project/verification.md) |
| 前端、UI、语法 | [index](./frontend/index.md) | [ui-style](../../project/ui-style.md), 项目规则 |
| 后端、接口、语法 | [index](./backend/index.md) | [api-contracts](../../project/api-contracts.md), 项目规则 |
| 决策与方案 | [decisions](./decisions.md), [plans](./plans.md) | ADR、需求、计划、任务单 |
| 已导入规则 | [imported-rules](../../project/imported-rules.md), [index](../../project/rules/index.md) | 目标项目现有规则文件 |
| 最近同事变更 | [change-log](../../project/change-log.md) | 需求前 Git 增量同步 |

未初始化时不得猜测项目结构、UI、接口或语法规则，必须由 Lead 引导初始化。
