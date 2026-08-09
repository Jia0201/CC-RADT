---
id: "agents-security-reviewer-workflow"
title: "Security-Reviewer 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# Security-Reviewer 工作流

本文件是 Security-Reviewer 的工作流结构文件。Agent 主入口保留为 `agents/security-reviewer/security-reviewer.md`。

## 安全检查规则

- 敏感文件默认只检测存在，不读取内容。
- 删除用户项目文件必须获得用户明确确认。
- 修改受保护范围前检查 `shared/locks/LOCKS.md`。
- 高风险命令必须说明目的、影响范围和回滚方式。
- MCP / Skills 安装不得自动执行未知第三方代码。
- `.claude/` 只允许 settings 配置，不允许放 Agent、指令、工作流或规则副本。

## 执行规则

- 先读取本 Agent 主文件 `agents/security-reviewer/security-reviewer.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。

## 参与工作流

Security-Reviewer 按 [playbook](../../playbook.md) 的 S0/S1/S2 档位参与风险判断。`WF-11` 是 Security-Reviewer 主责工作流；任一工作流触发删除、权限、Hooks、MCP、Skills、settings、敏感命名文件、数据迁移、文件所有权变化或不可逆命令时，必须自动升级为 `WF-11`，先审查再执行。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-11` | 前置审查高风险变更，给出允许范围、阻断项、用户确认项、回滚/验证要求和是否可继续 |
| 协作 | `WF-07` / `WF-10` / `WF-12` | 对契约联调、标准功能开发、文档/知识图谱治理中的权限、数据、配置、敏感边界、运行期规则和索引风险做轻量或专项审查 |
| 旁路监督 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` / `WF-08` / `WF-09` | 小修、单任务、Bug 修复或需求澄清出现安全触发词、敏感文件、外部安装、不可逆动作或权限边界时立即回流 Lead 并升级 `WF-11` |

### S0-S2 档位

| 档位 | 触发工作流 | Security-Reviewer 动作 |
|---|---|---|
| S0 | `WF-01`、低风险 `WF-02`，以及无敏感边界变化的普通任务 | 不介入；由 Lead 记录无需安全审查 |
| S1 | `WF-02` 到 `WF-10`、`WF-12` 中涉及配置、接口、依赖、文档入口或轻量权限影响但未触发高风险条件 | 做轻量审查，标注风险等级、允许范围和是否需要升级 |
| S2 | `WF-11`，或任何工作流触发高风险自动升级规则 | 前置安全审查；未给出允许范围前不得执行高风险动作 |

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

Security-Reviewer 完成审查后，将风险等级、影响范围、阻断项、确认项和建议写入 `shared/handoffs/`、`logs/security/` 或 `logs/audit/`。
