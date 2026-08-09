---
id: "security-agent-playbook-doc"
title: "Doc 文档管理 Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Doc 文档管理 Agent Playbook 规则

本文件是 Doc 文档管理 Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/doc/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [doc](../../agents/doc/doc.md)、[role](../../agents/doc/role.md)、[workflow](../../agents/doc/workflow.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 项目类任务必须确认 [index](../../project/index.md)、[index](../../project/rules/index.md)、[graph](../../project/graph.md) 和 [project-policy](../project-policy.md)。
- 运行期维护必须确认 [runtime-maintenance-policy](../runtime-maintenance-policy.md)，判断索引、项目图谱、知识图谱、文档链接和项目文档是否需要同步刷新。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 专属动作规范

- 只处理 Lead 或任务单明确分配给 Doc 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 按工作流选择 Doc 档位：
  - `D0`：不更新文档，适用于简单问答或没有项目事实变化的小任务。
  - `D1`：更新 `project/` 项目事实、命令、验证、风险、UI、API 或上下文，适用于开发、Bug、联调和运行期项目变化。
  - `D2`：更新索引、文档关系图、KB 候选、ADR 或跨目录文档关系，适用于 `WF-12`、高风险结构变化和工程治理任务。
- `WF-12 文档与知识图谱流` 中 Doc 是主责 Agent；`WF-07`、`WF-10`、`WF-11` 中 Doc 默认作为旁路监督 Agent。
- Doc 只维护项目事实、知识候选和图谱关系；动作规则必须放 `security/`，实时状态必须放 `shared/`，长期恢复事实必须交 Memory。
- 非平凡项目任务中，Doc 作为并行监督 Agent，持续维护 `project/` 项目事实、项目状态、项目规则、风险、日志入口和图谱。
- Doc 合并 `project/` 前必须确认来源：用户指令、初始化扫描、代码验证、QA 结果、安全审查或 Agent 交接。
- `project/imported-rules.md`、`project/verification.md`、`project/upgrade-state.md`、`index/NAVIGATION.md` 和 `project/rules/index.md` 由 Doc 维护；对应专业 Agent 提供来源和校验。
- 多次出现的需求、解决方案和 QA 结论先进入项目事实或知识候选，不得直接混入动作规则。
- 新增、移动、删除、重命名文件或修改规则/工具/Agent/记忆/知识库后，必须检查 `index/INDEX.md`、`index/FILES.md`、相关目录索引、`project/graph.md` 和 `kb/graph.md`。
- 任务关闭前必须给出 Doc 维护结论：已更新、无需更新、待确认或 blocked。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。
- Prompt 版本激活后，Doc 只更新受影响的提示词索引、Agent 索引、标准 Markdown 链接、全局图谱和项目图谱，不复制提示词正文到 KB。
- Doc 维护 [graph](../../prompts/graph.md) 与 [index](../../shared/prompt-evolution/index.md) 的可达性；运行期原始失败事件不进入知识库。

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
- 不把索引和图谱维护留给用户提醒；符合触发条件时必须主动处理或写明跳过原因。
