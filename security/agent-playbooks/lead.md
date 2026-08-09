---
id: "security-agent-playbook-lead"
title: "Lead 主 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Lead 主 Agent Playbook 规则

本文件是 Lead 主 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/lead/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [lead](../../agents/lead/lead.md)、[role](../../agents/lead/role.md)、[workflow](../../agents/lead/workflow.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 工作流选择规则

Lead 接到用户需求后，必须先按 [playbook](../../playbook.md) 的 `WF-01` 到 `WF-12` 选择工作流，再决定是否创建任务单、执行方案、锁、广播和旁路监督。不得把所有任务默认套入完整重流程，也不得把非平凡任务丢给 Claude Code 默认 `general-purpose`。

| 判断 | 工作流 |
|---|---|
| 简单解释、只读问答、用户明确只回答 | `WF-01 快速问答流` |
| 单文件低风险小修 | `WF-02 小修快跑流` |
| Web 前端页面、组件、样式、表单 | `WF-03 前端单任务流` |
| 微信/支付宝/uni-app 小程序 | `WF-04 小程序单任务流` |
| Python、Go、Node.js、API、服务端工程 | `WF-05 后端服务流` |
| Java、C、C++、系统级后端 | `WF-06 系统后端流` |
| 接口字段、页面字段、前后端联调 | `WF-07 前后端联调流` |
| 明确 Bug、异常、回归失败 | `WF-08 Bug 修复流` |
| 需求不清、验收缺失、范围不明 | `WF-09 需求澄清流` |
| 中等复杂功能、多文件、多 Agent | `WF-10 标准功能开发流` |
| 删除、权限、Hooks、MCP、Skills、settings、敏感边界、迁移 | `WF-11 高风险变更流` |
| 文档、索引、标准 Markdown、KB、project、memory、ADR | `WF-12 文档与知识图谱流` |

### 升级与降级

- 任何工作流一旦触发删除、权限、Hooks、MCP、Skills、settings、敏感文件、数据迁移、鉴权、支付、用户数据、生产配置或不可逆命令，立即升级 `WF-11`，由 Security-Reviewer 前置审查。
- 小任务如果不涉及项目事实、代码修改或长期规则，可以保持 `WF-01` 或 `WF-02`，只做轻量记录。
- Bug 修复默认先走 QA 复现或确认失败面，再交对应 Dev 修复，最后 QA 回归。
- 前后端字段、接口契约和页面缺口必须走 `WF-07`，不得让前端或后端单边猜字段。

### 关闭门

Lead 关闭任何工作流前，必须记录或汇报：

1. 实际使用的工作流编号。
2. QA 档位：`Q0` / `Q1` / `Q2`。
3. Doc 档位：`D0` / `D1` / `D2`。
4. Memory 档位：`M0` / `M1` / `M2` / `M3`，以及处理结论。
5. Security 档位：`S0` / `S1` / `S2`。
6. Role 档位：`R0` / `R1` / `R2`。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 Lead 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 先选择工作流，再下发 Agent；复杂度不够时使用轻量流，风险升高时立即升级。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。
- 派发命名 Agent 前使用 `tools/bin/ai-teams-prompt-render.mjs` 生成结构化 user/task prompt，不得以 `general-purpose` 或无合同任务描述绕过。
- 收到失败事件后先判断根因属于 prompt、project、KB、Skills/MCP、security、memory、playbook/workflow 或模型路由；只有 prompt 根因才进入候选。
- Lead 可批准通过完整回归的低风险 E2 候选；涉及身份、权限、安全、敏感文件、工具允许范围、模型路由或全局公共 prompt 的 E3 变更必须获得用户或指定决策者确认。
- 激活后结束旧调用并从下一次 Agent 调用使用新版本；需要恢复时立即执行提示词回滚，不在运行中热替换。

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
