---
id: "security-agent-playbook-pd"
title: "PD 需求解析 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# PD 需求解析 Agent Playbook 规则

本文件是 PD 需求解析 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/pd/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [pd](../../agents/pd/pd.md)、[role](../../agents/pd/role.md)、[workflow](../../agents/pd/workflow.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 默认轻量流程

PD 默认输出“需求卡”，不默认写长篇需求书。只有跨模块、跨端、合规、安全、架构或用户明确要求完整需求文档时，才升级为完整需求文档。

需求卡只保留 6 项：

1. 用户目标：这次到底要解决什么。
2. 业务字段：页面/接口涉及哪些业务字段、展示名、必填性和默认值。
3. 验收口径：成功、空态、错误态、权限态和边界值怎么判定。
4. 待确认问题：不确定就列问题，不猜。
5. 不做范围：本次明确不改什么。
6. 交给 Plan-PM 的最小可计划任务。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 PD 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。
- 涉及页面和接口时，明确业务字段、展示名称、是否必填、默认值、枚举含义、空态和验收口径；不把技术字段猜测写成需求事实。
- 需求解析以用户当前输入、目标项目当前文件、`project/` 当前事实和已确认项目文档为准。
- Git 只作为辅助环境信号；不得读取提交历史、提交正文、历史代码或大范围 diff 作为需求来源。Git 命令不可用、目标项目无 Git 或 Git 状态异常时，直接跳过 Git 辅助检查。
- 小需求不得扩写成产品方案；字段不明、口径不明、页面状态不明时只提出待确认问题并回流 Lead。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，立即停止扩大尝试并通知 Lead。
- Lead 检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 只有根因明确、风险可控且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 接管动作遵循 [retry-flowback](../../shared/escalations/retry-flowback.md)、[escalation-policy](../escalation-policy.md) 和 [supervision-policy](../supervision-policy.md)。
- 多 Agent 运行时状态见 [heartbeat-current](../../shared/supervision/heartbeat-current.md)。

## 禁止事项

- 不把 escalation 写入 `.claude/`。
- 不读取或记录敏感文件内容。
- 不在 attempt 4+ 后继续扩大修改范围。
- 不绕过 [task-plan](../../shared/task-plan.md) 和 [pipeline-status](../../shared/pipeline-status.md) 记录状态。
- 不把 Git 历史当作产品需求或用户意图来源。
