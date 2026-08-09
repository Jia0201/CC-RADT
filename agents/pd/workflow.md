---
id: "agents-pd-workflow"
title: "PD 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# PD 工作流

本文件是 PD 的工作流结构文件。Agent 主入口保留为 `agents/pd/pd.md`。

## 执行规则

- 先读取本 Agent 主文件 `agents/pd/pd.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。

## 参与工作流

PD 按 [playbook](../../playbook.md) 的工作流选择器参与需求侧澄清和验收口径定义。规划和需求判断不得依赖过往 Git 提交记录；Git 只能作为当前环境提示，需求依据必须来自当前项目事实、`project/`、用户目标和可验收口径。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-09` / `WF-10` | `WF-09` 输出需求卡、待确认问题和不做范围；`WF-10` 定义用户目标、业务规则、字段范围和验收标准 |
| 协作 | `WF-07` / `WF-11` | `WF-07` 对齐页面字段、接口字段和验收口径；`WF-11` 明确用户确认、禁止范围、高风险业务影响和可接受降级 |
| 旁路监督 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` / `WF-08` | 当小修、单任务或 Bug 修复出现需求不清、验收缺失、业务字段漂移时，向 Lead 回流澄清，不直接扩大开发范围 |

## 默认轻量路径

1. 小需求默认输出“需求卡”，不写长篇需求文档。
2. 需求卡只包含：用户目标、业务字段、验收口径、待确认问题、不做范围、交给 Plan-PM 的最小可计划任务。
3. 涉及页面或接口时，业务字段必须关联 [ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
4. 字段、页面状态或验收口径不明确时，列为待确认问题并交给 Lead，不自行猜测。
5. 只有跨模块、跨端、合规、安全、架构或用户明确要求时，升级为完整需求文档。
6. 不把历史提交记录、远端待同步提交或推测性变更当作需求来源；只围绕当前项目事实、`project/`、用户目标和验收口径组织需求。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

PD 完成需求解析后，将需求文档路径、未确认问题、风险和验收标准写入 `shared/handoffs/`，由 Lead 判断是否进入 Plan-PM。
