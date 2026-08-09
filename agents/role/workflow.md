---
id: "agents-role-workflow"
title: "Role 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# Role 工作流

本文件是 Role 的工作流结构文件。Agent 主入口保留为 `agents/role/role.md`。

## 执行规则

- 先读取本 Agent 主文件 `agents/role/role.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。
- 工程文件、规则、Agent 职责、MCP、Skills、KB、Memory、project 或 playbook 发生变化时，按 [runtime-maintenance-policy](../../security/runtime-maintenance-policy.md) 检查 Agent 指引是否需要同步更新。

## 参与工作流

Role 按 [playbook](../../playbook.md) 的 R0/R1/R2 档位维护 Agent 指引、职责边界、入口链接和运行期指针。只要 MCP、Skills、Hooks、playbook、Agent 职责、职责边界或核心规则变化，Role 必须参与检查；需要改指引时由 Lead 或对应工作流下发任务。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-12` | 在文档与知识图谱流中维护 Agent 指引、职责边界、[index](../index.md)、角色入口和相关 [playbook](../../playbook.md) 指针 |
| 协作 | `WF-10` / `WF-11` | 标准功能开发中检查多 Agent 职责是否需要同步；高风险变更中配合 Security-Reviewer 处理 Hooks、MCP、Skills、权限、settings、playbook 或 Agent 核心职责变化 |
| 旁路监督 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` / `WF-07` / `WF-08` / `WF-09` | 当小修、单任务、联调、Bug 或需求澄清暴露职责边界、读取顺序、工具指针、MCP/Skills/Hooks/playbook 变化时，登记并回流 Lead |

### R0-R2 档位

| 档位 | 触发工作流 | Role 动作 |
|---|---|---|
| R0 | `WF-01`，以及不影响 Agent 指引、职责边界或工具指针的任务 | 不介入；由 Lead 记录无需 Role |
| R1 | `WF-02` 到 `WF-11` 中出现职责边界、入口链接、MCP/Skills/Hooks/playbook 指针或读取顺序可能变化 | 检查是否需要更新 Agent 指引、索引和专属 playbook 指针；不需要时写明原因 |
| R2 | `WF-10` / `WF-11` / `WF-12` 中确认需要改 Agent 指引、职责边界、工具入口、Hooks、MCP、Skills 或 [playbook](../../playbook.md) | 更新 `agents/<agent>/`、[index](../index.md) 和相关入口，必要时交 Doc 维护索引/图谱 |

## 运行期 Agent 指引维护流程

1. 读取触发变更的任务单、执行方案、交接和变更文件。
2. 判断是否影响某个 Agent 的职责、输入、输出、禁止事项、读取顺序、MCP/Skills/KB/Memory 指针或 playbook。
3. 如需要修改，先检查 Owner 和锁，再更新 `agents/<agent>/`、`agents/index.md` 和相关专属 playbook 指针。
4. 如不需要修改，在交接中写明“无 Agent 指引更新”及原因。
5. 如果职责边界存在争议，回到 Lead 仲裁，不自行扩大 Role 权限。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

Role 完成角色调整后，将变更原因、影响范围、涉及 Agent、更新文件和需要 Lead 复核的事项写入 `shared/handoffs/`。
