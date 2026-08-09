---
id: "kb-agents-plan-pm-source-map"
title: "Plan-PM 权威来源"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---
# Plan-PM 权威来源

`01-source-map.md` 只登记项目管理、敏捷计划和工程内规范来源，不放随机博客或临时经验。

| 来源 | 地址 | 什么时候使用 | Codex 生成内容时要遵守什么 |
|---|---|---|---|
| Scrum Guide | https://scrumguides.org/ | 计划涉及目标、Backlog、增量、验收和迭代边界时 | 任务必须服务产品目标和可验收增量，不把愿望清单写成承诺 |
| Agile Alliance Acceptance Criteria | https://www.agilealliance.org/glossary/acceptance-criteria/ | 拆解任务需要绑定验收标准时 | 每个任务应有可判断的完成条件和验证方式 |
| INVEST User Stories | https://www.agilealliance.org/glossary/invest/ | 判断需求或任务是否适合拆分时 | 任务应尽量独立、可协商、有价值、可估算、小而可测试 |
| PMBOK Guide | https://www.pmi.org/pmbok-guide-standards | 计划涉及依赖、风险、范围和干系人约束时 | 明确范围、依赖、风险、责任和交付物，不隐藏关键约束 |
| IEEE 29148 Requirements Engineering | https://standards.ieee.org/standard/29148-2018.html | 从需求到任务保持可追溯性时 | 任务应能追溯到需求、约束或验收项 |
| 工程需求上下文 | `project/context.md` | 计划需要对齐项目背景、业务边界和长期目标时 | 不生成与项目上下文冲突的任务目标 |
| 项目规则索引 | `project/rules/index.md` | 计划受工程规则、文档规则、验证规则或命名规则影响时 | 把规则影响写入任务约束和验收方式 |
| 共享任务计划 | `shared/task-plan.md` | 任务需要被协作方读取、追踪和验收时 | 任务结构应稳定、可更新、可审查，避免模糊状态 |
| 流水线状态 | `shared/pipeline-status.md` | 多阶段任务需要同步整体状态时 | 状态表达应区分阻塞、进行中、待验收和已完成 |
| Agent 协作索引 | `agents/index.md` | 计划需要识别可交接角色和能力边界时 | 任务输入输出应匹配对应 Agent 职责，不把责任写混 |
