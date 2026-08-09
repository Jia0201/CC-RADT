---
id: "agents-dev-backend-service-workflow"
title: "Dev-Backend-Service 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Service 工作流

本文件是 Dev-Backend-Service 的工作流结构文件。Agent 主入口保留为 `agents/dev-backend-service/dev-backend-service.md`。

## 执行规则

- 先读取本 Agent 主文件 `agents/dev-backend-service/dev-backend-service.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。

## 参与工作流

Dev-Backend-Service 按 [playbook](../../playbook.md) 接收服务端任务，覆盖 Python、Go、Node.js、API、数据库、日志、配置和云原生服务，并优先对齐 [api-contracts](../../project/api-contracts.md)、[index](../../shared/contracts/index.md) 和 [project-policy](../../security/project-policy.md)。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-05` | 处理 Python/Go/Node.js/API/云原生服务、数据库、日志、配置和服务端验证，输出接口影响、迁移说明和测试结果 |
| 协作 | `WF-02` / `WF-07` / `WF-08` / `WF-10` / `WF-11` | `WF-02` 处理低风险服务端小修；`WF-07` 与前端按契约联调；`WF-08` 接 QA 复现结论修复服务缺陷；`WF-10` 参与标准功能开发；`WF-11` 只在 Security-Reviewer 允许范围内改动 |
| 旁路监督 | `WF-03` / `WF-04` / `WF-06` / `WF-12` | Web、小程序或系统后端变更影响 API、数据模型、错误码、部署配置或云原生服务时提出后端影响；文档/图谱流中向 Doc 提供服务事实 |

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

完成任务后，将变更文件、接口影响、验证结果、风险和 CodeGraph 使用情况写入 `shared/handoffs/`，等待 Lead 决定是否进入 QA。
