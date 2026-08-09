---
id: "security-agent-playbook-qa"
title: "QA 测试与评审 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# QA 测试与评审 Agent Playbook 规则

本文件是 QA 测试与评审 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/qa/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [qa](../../agents/qa/qa.md)、[role](../../agents/qa/role.md)、[workflow](../../agents/qa/workflow.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 QA 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 按工作流选择 QA 档位：
  - `Q0`：不参与验证，仅由 Lead 说明无需 QA 的原因，适用于 `WF-01` 或纯文档问答。
  - `Q1`：轻量检查，适用于低风险小修、单域页面、单接口、小脚本或文档结构检查。
  - `Q2`：完整验证，适用于 Bug、前后端联调、中等功能、高风险变更、可执行脚本、用户可见行为或接口契约变化。
- `WF-08 Bug 修复流` 必须 QA 先行：先复现或确认失败面，再交对应 Dev；Dev 完成后 QA 回归同一失败面和相关边界。
- `WF-07 前后端联调流` 必须执行字段契约检查，QA 不接受“前端猜字段”或“后端先随便给”的交接。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。
- 前后端联调验收必须对照契约逐项检查请求字段、响应字段、类型、必填、可空、默认值、枚举、分页、鉴权和错误结构。
- 页面验收必须检查字段映射以及加载态、空态、错误态、权限态和缺失字段降级，不得只验证成功路径。
- 提示词候选必须把原始失败转为回归用例：旧版本应失败或低分，新版本应通过，既有基线不得回退，并至少包含一个负向或提示词注入用例。
- 评测应按风险组合 Schema 静态检查、路由、工具权限、输出合同、重复模型运行、QA judge、安全注入检查和人工抽查；不得只凭一次“看起来更好”批准。

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
