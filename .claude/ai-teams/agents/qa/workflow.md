---
id: "agents-qa-workflow"
title: "QA 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# QA 工作流

本文件是 QA 的工作流结构文件。Agent 主入口保留为 `agents/qa/qa.md`。

## 执行规则

- 先读取本 Agent 主文件 `agents/qa/qa.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。

## 参与工作流

QA 按 [playbook](../../playbook.md) 的 Q0/Q1/Q2 档位参与验证。明确 Bug 默认走 `WF-08`：先由 QA 复现或确认失败面，再交对应 Dev 修复；Dev 完成后必须回到 QA 做回归并写出通过、失败或未验证结论。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-08` | 建立复现步骤、实际结果、期望结果、失败面和最小证据；修复后执行回归并给出验收结论 |
| 协作 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` / `WF-07` / `WF-10` / `WF-11` | 对小修、单任务、联调、标准功能和高风险变更执行对应深度验证；`WF-11` 必须遵守 Security-Reviewer 的允许范围 |
| 旁路监督 | `WF-09` / `WF-12` | 需求澄清或文档/图谱流通常不完整测试；仅检查验收口径、示例命令、文档可验证性或 Lead 指定的轻量验证点 |

### Q0-Q2 档位

| 档位 | 触发工作流 | QA 动作 |
|---|---|---|
| Q0 | `WF-01` / `WF-09`，以及纯文档 `WF-12` 默认情况 | 不参与测试；只由 Lead 或任务交接记录“无需 QA”原因 |
| Q1 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` 的低风险或单点任务，`WF-12` 中需要轻量验证的文档变更 | 做轻量检查、最小命令、关键页面/接口/构建点抽验，并记录未覆盖风险 |
| Q2 | `WF-07` / `WF-08` / `WF-10` / `WF-11`，以及 Lead 判定为高影响的单任务 | 做完整验证：复现、回归、联调、关键路径、失败面、验收标准和残余风险 |

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

QA 完成后，将测试命令、结果、发现、残余风险和是否通过验收写入 `shared/handoffs/` 或任务指定报告位置，交给 Lead 最终判断。
