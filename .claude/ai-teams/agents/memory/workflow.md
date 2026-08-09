---
id: "agents-memory-workflow"
title: "Memory 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# Memory 工作流

本文件是 Memory 的工作流结构文件。Agent 主入口保留为 `agents/memory/memory.md`。

## 执行规则

- 先读取本 Agent 主文件 `agents/memory/memory.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。
- 执行前读取 [index](./memorys/index.md)，确认正式规则和数据都在根 `memory/`。
- 非平凡任务中，Memory 并行检查是否需要上下文压缩、恢复点、候选记忆或保留策略处理；具体规则读取 [context-compression](../../memory/context-compression.md)、[refresh-rules](../../memory/refresh-rules.md) 和 [retention-policy](../../memory/retention-policy.md)。
- 按 [runtime-maintenance-policy](../../security/runtime-maintenance-policy.md) 检查记忆索引、会话恢复材料和归档索引是否需要随任务变化同步更新。

## 参与工作流

Memory 参与所有工作流的收尾门。轻量工作流可以由 Lead 代填 M0/M1 结论；非平凡工作流由 Memory 直接判断候选、恢复点、上下文压缩和正式记忆。工作流选择器见 [playbook](../../playbook.md)，档位细则见 [refresh-rules](../../memory/refresh-rules.md)。

| 工作流 | Memory 参与重点 | 默认档位 |
|---|---|---|
| WF-01 快速问答流 | 确认无长期恢复价值 | M0 |
| WF-02 到 WF-06 单任务流 | 检查是否产生小范围候选、验证教训或 Agent 独立记忆 | M1/M2 |
| WF-07 前后端联调流 | 关注契约变化、字段对齐结论、联调恢复点；项目事实交给 Doc | M2 |
| WF-08 Bug 修复流 | 关注复现条件、根因、回归结论中可复用的恢复事实；缺陷知识先候选 | M2 |
| WF-09 需求澄清流 | 关注用户确认、待确认问题和恢复点；未确认需求不得正式记忆 | M1/M2 |
| WF-10 标准功能开发流 | 并行监督多 Agent 交接、恢复点、候选记忆和正式记忆资格 | M2/M3 |
| WF-11 高风险变更流 | 在 Security 前置约束下处理候选；权限、敏感和不可逆动作不得写成正式事实 | M2/M3 |
| WF-12 文档与知识图谱流 | 区分 `project/`、KB、Agent 指引和 Memory 边界；文档事实交给 Doc | M2 |

### M0-M3 判断步骤

1. 读取任务单、执行方案、验证结果、交接和旁路监督结论。
2. 先判断是否可用 M0：没有文件或状态变化、没有恢复价值、没有项目事实或 Agent 指引变化。
3. 若不能 M0，执行 M1 检查：回答是否产生共享记忆、Agent 独立记忆、项目事实、上下文恢复材料或无需记录原因。
4. 发现可能长期有用但仍需筛选、验证或 Doc 分流的内容时升级 M2，写候选或交接，不直接正式写入。
5. 只有来源、验证证据、适用范围和过期条件清楚，且确属长期恢复事实时升级 M3，由 Memory 写入正式 `memory/`。
6. 关闭前向 Lead 汇报 Memory 处理结论：M0 / M1 / M2 / M3、写入位置、未采纳原因、Doc 分流项和阻塞项。

## 运行期记忆维护流程

1. 读取任务单、执行方案、交接、QA 结果和用户确认材料。
2. 筛选长期恢复所需、非敏感、已验证或可明确标注来源的事实。
3. 判断写入位置：共享记忆、Agent 独立记忆、候选记忆、恢复点或归档索引。
4. 检查是否需要上下文压缩；Hook 提示只是触发信号，Memory 必须做最终判断。
5. 将项目事实交给 Doc 合并到 `project/`；将可复用知识交给 Doc 处理知识候选。
6. 更新 `memory/index.md`、`memory/archive/index.md` 或相关 Agent 记忆入口。
7. 向 Lead 汇报已处理、无需处理或阻塞原因。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

Memory 完成刷新或恢复点整理后，将来源、筛选依据、写入位置和未采纳项写入 `shared/handoffs/` 或 `logs/task/`。
