---
id: "project-index"
title: "项目管理索引"
type: "project-index"
scope: "project"
owner: "doc"
status: active
---
# 项目管理索引

`project/` 用于记录目标项目的持续画像和执行中沉淀的项目事实。Doc 是本目录的运行期管理者；初始化只负责第一轮扫描，后续需求分析、计划、开发、QA、安全审查、记忆筛选和文档治理都要按 [project-policy](../security/project-policy.md) 向 Doc 提供项目更新来源。

Lead 负责调度、决策和关闭检查；Doc 负责把稳定项目事实、项目规则、状态、风险、图谱和索引合并到 `project/`。

## 核心文件

| 文件 | 用途 | Owner |
|---|---|---|
| [PROJECT](./PROJECT.md) | 项目管理入口 | Doc |
| [context](./context.md) | 目标项目运行期上下文 | Doc |
| [project-profile](./project-profile.md) | 初始化项目画像 | Doc |
| [imported-rules](./imported-rules.md) | 已有 AI/编码规则吸收区 | Doc / Security-Reviewer |
| [index](./rules/index.md) | 项目规则索引 | Doc |
| [architecture](./architecture.md) | 架构入口、模块边界和文档入口 | Doc |
| [ui-style](./ui-style.md) | UI 风格、布局、设计令牌和页面状态 | Doc / Frontend Dev |
| [api-contracts](./api-contracts.md) | 接口契约来源、字段模型和对接缺口 | Doc / Dev / QA |
| [change-log](./change-log.md) | 每次需求前的增量提交、变更文件与影响分类 | Doc / Lead / 全体 Agent |
| [commands](./commands.md) | 构建、测试、lint、type-check、启动命令 | Doc / QA / Plan-PM |
| [verification](./verification.md) | 验证策略和验收方式 | Doc / QA |
| [dependencies](./dependencies.md) | 依赖入口和依赖线索 | Doc / Dev / QA |
| [risks](./risks.md) | 风险、敏感边界和阻断项 | Doc / Security-Reviewer |
| [graph](./graph.md) | 目标项目知识图谱 | Doc |
| [index](./adr/index.md) | 目标项目长期结构性决策 | Doc / Lead |
| [index](../rule/project/index.md) | Agent 按需读取项目结构、文件、前端、后端、决策和方案的快速入口 | Doc / 全体 Agent |

## 子目录

- `project/requirements/`：Doc 维护项目索引，PD 提供需求材料。
- `project/plans/`：Doc 维护项目索引，Plan-PM 提供执行计划材料。
- `project/rules/`：Doc 管理项目规则索引。
- `rule/project/`：Doc 管理面向 Agent 的项目规则路由和初始化目录索引。
- `project/adr/`：Doc 管理长期结构性决策。

## 每次任务前 Agent 必读

每个参与项目任务的 Agent 先读取 [index](../rule/index.md)、自己的 `rule/agents/<agent>.md` 和 [index](../rule/project/index.md)，再按路由读取当前任务需要的项目事实。不得把本目录全部文件作为每次任务的默认上下文。只有规则索引缺失、过期或与代码冲突时，才扩大到 [structure](../rule/project/structure.md)、[files](../rule/project/files.md)、CodeGraph 或必要源码检索。

Lead 必须确认：

1. AI-Teams harness 工程路径。
2. 目标项目路径。
3. 目标项目是否已初始化。
4. 本任务是否需要让 Doc 并行更新项目画像、需求、计划、架构、命令、验证、风险、规则或图谱。

## 运行期并行更新

1. Doc 在非平凡项目任务中作为并行监督 Agent，持续收集项目事实和文档更新来源。
2. Memory 并行判断哪些内容需要进入记忆候选、恢复点或上下文压缩材料。
3. Security-Reviewer 并行检查越界、敏感文件、锁、删除、权限和命令风险。
4. 任务关闭前，Lead 检查 Doc、Memory、Security-Reviewer 是否已处理或明确跳过。
