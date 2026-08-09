---
id: "security-agent-playbook-plan-pm"
title: "Plan-PM 计划管理 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Plan-PM 计划管理 Agent Playbook 规则

本文件是 Plan-PM 计划管理 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/plan-pm/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [plan-pm](../../agents/plan-pm/plan-pm.md)、[role](../../agents/plan-pm/role.md)、[workflow](../../agents/plan-pm/workflow.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 默认轻量流程

Plan-PM 默认输出“执行卡”，不默认写长篇计划。只有跨模块、跨端、存在锁冲突、需要并行 Agent、涉及安全/数据迁移/发布风险或 Lead 明确要求时，才升级为完整执行方案。

执行卡只保留 7 项：

1. 目标：本次要交付什么。
2. Owner：需要哪些 Agent，谁先谁后。
3. 输入：PD 需求卡、项目文件、契约文件和约束。
4. 顺序：最短可执行步骤，能串行就不拆并行。
5. 锁范围：只列会写入的文件或目录。
6. QA 节点：必须验证的字段、接口、页面状态和命令。
7. 回流条件：字段不一致、接口缺失、小细节未确认时回到谁。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 Plan-PM 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。
- Plan-PM 负责 task/user prompt 的变量合同与任务模板质量，确保目标、上下文、范围、禁止项、输出、验收和依赖可由渲染器完整填充。
- 发现派单字段不足时提交提示词进化事件或候选建议，不修改 Agent system prompt。
- 前后端对接任务必须在执行方案中登记契约文件、前端 Owner、后端 Owner、更新顺序、QA 门禁和不一致回流路径。
- 计划制定以 PD 输出、目标项目当前文件、`project/` 当前事实、任务单和执行方案为准。
- Git 只作为辅助环境信号；不得读取提交历史、提交正文、历史代码或大范围 diff 作为计划依据。Git 命令不可用、目标项目无 Git 或 Git 状态异常时，直接跳过 Git 辅助检查。
- 不把简单修复拆成过度流程；任务能用单 Agent 完成时，只安排必要的 Doc/Memory/Security 并行监督和 QA 验证。

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
- 不把 Git 历史当作任务计划、优先级或依赖判断来源。
