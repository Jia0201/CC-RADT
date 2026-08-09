---
id: "security-agent-playbook-memory"
title: "Memory 记忆管理 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Memory 记忆管理 Agent Playbook 规则

本文件是 Memory 记忆管理 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/memory/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [memory](../../agents/memory/memory.md)、[role](../../agents/memory/role.md)、[workflow](../../agents/memory/workflow.md) 和本文件。
- 读取 [index](../../agents/memory/memorys/index.md)，确认 Memory Agent 指引和正式记忆数据区边界。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 运行期维护必须确认 [runtime-maintenance-policy](../runtime-maintenance-policy.md)，判断是否产生记忆候选、恢复点、上下文压缩或归档索引更新。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 Memory 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 非平凡项目任务中，Memory 作为并行监督 Agent，实时判断是否产生记忆候选、恢复点、上下文压缩材料或保留策略处理项。
- Hook 可以提示上下文压缩；Memory 在写入正式记忆或处理候选时也必须按 [context-compression](../../memory/context-compression.md)、[refresh-rules](../../memory/refresh-rules.md) 和 [retention-policy](../../memory/retention-policy.md) 检查是否需要压缩或归档。
- 项目事实优先交给 Doc 合并到 `project/`，只有长期恢复确实需要且非敏感的事实才进入记忆候选。
- `agents/memory/memorys/` 只作为阅读指引，不写入正式记忆、候选记忆、压缩材料或归档材料。
- 新增或更新记忆、候选、恢复点、压缩材料或归档记录后，必须检查 `memory/index.md`、相关 Agent 记忆入口和 `memory/archive/index.md`。
- 任务关闭前必须给出 Memory 维护结论：已更新、无需更新、待确认或 blocked。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。
- 单次提示词失败、评测分数和候选草稿不写正式记忆；仅跨任务重复、经评测确认且对恢复有长期价值的行为模式进入记忆候选。
- 提示词版本和活动状态以 `prompts/registry.json` 为准，不在记忆中维护第二份注册表。

## M0-M3 安全规则

所有工作流关闭前必须有 Memory 结论。结论可以是 M0 不写记忆，但不能用“未处理”替代判断；档位规则以 [refresh-rules](../../memory/refresh-rules.md) 和 [playbook](../../playbook.md) 为准。

| 档位 | 安全要求 |
|---|---|
| M0 不写记忆 | 只适用于无长期恢复价值、无文件/状态变化、无项目事实变化的任务；不得创建候选或正式记忆 |
| M1 记忆检查 | 必须记录无需记忆、升级 M2 或 blocked 的原因；不得把检查结论伪装成正式记忆 |
| M2 候选记忆 | 只允许写入可筛选的候选或交接；必须标注来源、时间、任务、验证状态和敏感性判断 |
| M3 正式记忆 | 只能由 Memory 写入正式 `memory/`；必须有验证证据、适用范围、来源任务和必要的过期条件 |

以下内容不得进入正式记忆：

- 原始日志、长终端输出、完整会话、临时执行过程和一次性调试路径。
- 未经 QA、用户确认、代码检查或其他明确证据验证的事实。
- 密钥、token、证书、`.env` 内容、私有配置、敏感文件片段和可反推出凭证的路径组合。
- 属于 `project/` 的项目事实、属于 KB 的可复用知识、属于 `agents/` 的职责指引。
- 用户明确要求不要记录，或来源、时间、任务、适用范围无法追溯的内容。

Claude 原生记忆、模型上下文、聊天摘要和工具缓存不能替代 AI-Teams 的 `memory/` 文件体系。凡需跨会话恢复、Agent 共享或正式追溯的内容，必须进入 `memory/`、候选、交接或明确写明无需处理。

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
- 不把记忆维护留给上下文满了以后才处理；符合触发条件时必须主动处理或写明跳过原因。
- 不依赖 Claude 原生记忆、临时聊天上下文或工具缓存替代 `memory/`。
- 不把日志、临时过程、无验证事实或 Doc / project 边界内的内容写入正式记忆。
