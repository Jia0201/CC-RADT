---
id: "security-agent-playbook-role"
title: "Role 角色治理 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Role 角色治理 Agent Playbook 规则

本文件是 Role 角色治理 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/role/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [role](../../agents/role/role.md)、[role](../../agents/role/role.md)、[workflow](../../agents/role/workflow.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 运行期维护必须确认 [runtime-maintenance-policy](../runtime-maintenance-policy.md)，判断 Agent 指引、职责边界、读取顺序或指针是否需要同步刷新。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 Role 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 按工作流选择 Role 档位：
  - `R0`：不介入，适用于简单问答、普通开发和不影响 Agent 指引的任务。
  - `R1`：检查指针，适用于新增文档、索引、MCP、Skills、Hooks、规则、任务模板或 workflow 入口变化。
  - `R2`：更新 Agent 指引，适用于 Agent 职责、目录结构、playbook、工作流选择器、权限边界、官方 `.claude/agents` 入口或团队协作机制变化。
- `WF-12 文档与知识图谱流` 和 `WF-11 高风险变更流` 中，只要涉及 Agent 入口或职责边界，Role 必须进入 `R1` 或 `R2`。
- 涉及 Agent、规则、MCP、Skills、KB、Memory、project、shared、tools、hooks、playbook 或目录结构变化时，检查对应 Agent 主文档和组件文件是否需要更新。
- 新增或调整 Agent 指引后，必须同步 `agents/index.md`、`agents/<agent>/`、相关 `security/agent-playbooks/<agent>.md` 指针和 `kb/graph.md`。
- 任务关闭前必须给出 Role 维护结论：已更新、无需更新、待 Lead 裁决或 blocked。
- Role 是提示词源码和生命周期 Owner：维护 `prompts/registry.json`、Agent system prompt 版本、受影响 Agent 内部文档和 `.claude/agents/*.md` 编译结果。
- Role 不依据单次失败直接改活动 prompt；先检查 Lead 根因、QA 回归用例和 Security-Reviewer 风险结论，再创建或激活候选。
- 激活后只更新受影响节点，并检查 `prompts/index.md`、`prompts/graph.md`、`agents/index.md`、`index/AGENTS.md`、`index/FILES.md`、`kb/graph.md`、`project/graph.md`。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。

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
- 不让 Agent 指引落后于工程事实；发现过期指针必须主动修复或回流给 Lead。
- 不允许任何 Agent 修改自己的活动 system prompt，不允许在运行中热替换提示词。
