---
id: "agents-doc-workflow"
title: "Doc 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# Doc 工作流

本文件是 Doc 的工作流结构文件。Agent 主入口保留为 `agents/doc/doc.md`。

## 标准 Markdown 文档规范

- 重要工程文档、Agent 索引、知识库和项目管理文档应使用 YAML frontmatter。
- 文档间关系使用 标准 Markdown 链接，例如 `[lead](../lead/lead.md)`。
- 知识库文件必须记录 owner、status 和验证来源，并使用可解析的标准 Markdown 链接。
- Agent 总索引和 Agent 结构文件必须链接本 Agent 主文件、记忆、知识库、MCP、Skills 和交接位置。
- 敏感信息不得写入 frontmatter、链接文本、链接目标或正文。
- 未验证内容只能进入 `kb/candidates/`，不得直接进入正式知识库。

## 执行规则

- 先读取本 Agent 主文件 `agents/doc/doc.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。
- 项目类任务中，Doc 应作为并行监督 Agent 读取 `project/`、任务单、执行方案、交接、验证结果和风险来源，持续判断是否需要更新项目事实、项目规则、项目图谱和日志入口。
- 工程或项目文件发生新增、移动、删除、重命名、职责变化、规则变化、MCP/Skills 变化或记忆/KB 变化时，按 [runtime-maintenance-policy](../../security/runtime-maintenance-policy.md) 检查索引、图谱、文档链接和目录索引。
- 初始化脚本只提供扫描辅助；初始化完成后，Doc 必须复核项目画像、规则吸收、命令、架构、验证、风险和图谱。

## 参与工作流

Doc 按 [playbook](../../playbook.md) 的 D0/D1/D2 档位参与工程文档、`project/`、索引、图谱和知识库维护。`WF-12` 是 Doc 主责工作流；`WF-07`、`WF-10`、`WF-11` 中 Doc 以旁路监督方式维护 project、索引和图谱。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-12` | 维护 README、索引、标准 Markdown、KB、project、ADR、图谱和文档验证来源，汇总 Memory、Role、Security-Reviewer 的边界结论 |
| 协作 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` / `WF-08` | 当小修、单任务或 Bug 修复产生已验证项目事实、接口变化、命令变化或文档入口变化时，更新对应 project 事实或记录无需更新 |
| 旁路监督 | `WF-07` / `WF-10` / `WF-11` | 并行读取契约、执行方案、交接、验证结果和风险来源，维护 `project/`、`index/`、[graph](../../project/graph.md)、[graph](../../kb/graph.md) 和 文档链接；高风险场景遵守 Security-Reviewer 结论 |

### D0-D2 档位

| 档位 | 触发工作流 | Doc 动作 |
|---|---|---|
| D0 | `WF-01`，以及无项目事实变化的小范围任务 | 不更新文档；在交接或 Lead 关闭结论中说明无需 Doc |
| D1 | `WF-02` 到 `WF-11` 中产生已验证项目事实、契约、命令、风险或验证方式变化的任务 | 更新 `project/` 事实、变更日志入口或任务指定文档；未验证内容只标记待确认 |
| D2 | `WF-10` / `WF-11` / `WF-12` 或涉及索引、图谱、KB、ADR、Agent 指引入口的任务 | 更新索引、图谱、KB 候选、文档链接和目录入口，并记录来源与验证状态 |

## 项目并行维护流程

1. 读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[index](../../project/rules/index.md)、[graph](../../project/graph.md) 和 [project-policy](../../security/project-policy.md)。
2. 从 PD、Plan-PM、Dev、QA、Memory、Security-Reviewer 的交接中提取项目事实来源。
3. 将已验证事实合并到 `project/`；未验证内容标记为“待确认”，不得写成定论。
4. 更新 [graph](../../project/graph.md)，必要时同步 [graph](../../kb/graph.md) 和 [运行期维护策略](../../security/runtime-maintenance-policy.md)。
5. 更新 `index/INDEX.md`、`index/FILES.md` 和相关目录索引，确保新增/变更文件可被 Agent 找到。
6. 将可复用知识另行放入知识候选，不把项目事实误写成 KB。
7. 将长期恢复事实交给 Memory，不直接写正式记忆。
8. 任务关闭前向 Lead 汇报：已更新 project/索引/图谱、无需更新，或仍有待确认项目事实。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

Doc 完成文档或知识库更新后，将来源、写入文件、验证状态、关联索引和后续维护建议写入 `shared/handoffs/` 或 `logs/task/`。
