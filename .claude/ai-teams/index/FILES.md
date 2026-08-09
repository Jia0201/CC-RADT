---
id: "index-files"
title: "文件索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# 文件索引

## 核心目录

- `.claude/`：Claude Code settings、官方 subagent 和官方规则适配入口；不保存记忆、KB、共享工作区、Hooks、MCP、Skills、project 等工程大脑内容。
- `.claude/agents/`：Claude Code 官方可扫描的 12 个 AI-Teams Agent 主定义文件，负责名称、描述、颜色、Lead 调度白名单和启动读取顺序；不要放组件文件。
- `.claude/rules/`：Claude Code 官方规则适配文件，使用 `paths` 控制作用域并指向 `rule/` 本体。
- `agents/`：Agent 组件文档、职责边界、工作流、记忆指针、知识库指针、Skills 指针、MCP 指针和 playbook 指针。
- `rule/`：规则总索引和按需读取层。
- `rule/agents/`：12 个 Agent 的最小读取集合。
- `rule/tasks/`：按需求、计划、开发、QA、文档、记忆和安全任务路由。
- `rule/custom/`：运行期自建规则路由、分类索引和注册表。
- `rule/engineering/`：AI-Teams 工程结构和工作流路由。
- `rule/project/`：目标项目结构、文件、前端、UI、后端、接口、决策和方案路由。
- `rule/security/`、`rule/shared/`、`rule/memory/`、`rule/knowledge/`、`rule/tools/`：对应领域的快速入口。
- `rule/catalog/`：AI-Teams 非敏感目录和文件完整清单，仅精确定位时读取。
- `security/agent-playbooks/`：Agent playbook 规则本体。
- `tools/commands/`：工程指令说明。
- `tools/bin/`：可执行工程脚本。
- `index/`：轻量导航、需求验收、标准 Markdown 和 CodeGraph 索引。
- `project/`：项目管理文档。
- `project/context.md`：目标项目运行期上下文。
- `project/change-log.md`：每次需求进入前的增量提交、变更文件、影响分类和远端待同步提醒。
- `project/ui-style.md`：前端 UI 风格、布局、设计令牌和页面状态画像。
- `project/api-contracts.md`：接口契约来源、字段模型和前后端对接缺口。
- `project/rules/`：目标项目规则索引。
- `project/requirements/`：目标项目需求材料。
- `project/plans/`：目标项目计划材料。
- `project/adr/`：长期结构性决策记录。
- `memory/`：正式记忆、候选记忆、Agent 记忆、会话恢复材料和记忆归档索引。
- `memory/native-claude-memory-audit.md`：Claude Code 原生 auto memory 审计报告，采用 audit-and-ignore。
- `kb/`：正式知识库、候选知识和 文档关系图入口。
- `shared/`：任务、执行方案、交接、锁、广播、决策、回流和 文档关系维护。
- `security/`：文件所有权、敏感文件、删除、任务、锁、状态、状态事务、回流、运行期维护、工作区、上下文压缩和文档导航规则。
- `hooks/`：最小 Hook 集说明、检查脚本、配置示例和提示模板。
- `shared/contracts/`：接口契约模板、Owner、版本、兼容策略和 QA 证据。
- `logs/`：执行追溯日志和压缩摘要。
- `templates/`：可复用创建模板。
- `skills/`：Skills registry 和文件。
- `mcp/`：MCP registry、Agent MCP 和 CodeGraph 配置。
- `tools/`：工程工具体系。

## 主入口文件

- `README.md`
- `README.en.md`
- `CLAUDE.md`
- `VERSION`
- `MANIFEST.json`
- `agents/index.md`
- `rule/index.md`
- `rule/routing.md`
- `rule/agents/index.md`
- `rule/tasks/index.md`
- `rule/custom/index.md`
- `rule/custom/agents/index.md`
- `rule/custom/project/index.md`
- `rule/custom/security/index.md`
- `rule/engineering/index.md`
- `rule/project/index.md`
- `rule/security/index.md`
- `rule/shared/index.md`
- `rule/memory/index.md`
- `rule/knowledge/index.md`
- `rule/tools/index.md`
- `rule/catalog/index.md`
- `tools/commands/index.md`
- `memory/context-compression.md`
- `memory/native-claude-memory-audit.md`
- `shared/protocol.md`
- `shared/broadcasts/BROADCAST_PROTOCOL.md`
- `shared/task-plan.md`
- `shared/pipeline-status.md`
- `shared/escalations/index.md`
- `playbook.md`
- `index/READING-MODES.md`
- `shared/escalations/retry-flowback.md`
- `shared/escalations/ESCALATION_TEMPLATE.md`
- `shared/tasks/EXECUTION_PLAN_TEMPLATE.md`
- `shared/locks/LOCK_TEMPLATE.md`
- `security/runtime-maintenance-policy.md`
- `index/NAVIGATION.md`
- `shared/supervision/index.md`
- `shared/supervision/current.md`
- `shared/supervision/SUPERVISION_TEMPLATE.md`
- `shared/supervision/heartbeat.md`
- `shared/supervision/heartbeat-current.md`
- `shared/events/index.md`
- `shared/events/EVENT_TEMPLATE.md`
- `shared/transactions/index.md`
- `shared/transactions/TRANSACTION_TEMPLATE.md`
- `project/graph.md`
- `project/index.md`
- `project/context.md`
- `project/change-log.md`
- `project/ui-style.md`
- `project/api-contracts.md`
- `project/requirements/index.md`
- `project/plans/index.md`
- `project/adr/index.md`
- `project/adr/template.md`
- `index/NAVIGATION.md`
- `security/adr.md`
- `security/agent-playbooks/index.md`
- `security/development-policy.md`
- `security/development-frontend-web-policy.md`
- `security/development-frontend-miniapp-policy.md`
- `security/development-backend-systems-policy.md`
- `security/development-backend-service-policy.md`
- `skills/index.md`
- `skills/shared/index.md`
- `mcp/index.md`
- `mcp/shared/index.md`
- `mcp/agents/index.md`
- `mcp/registry.json`
- `security/task-policy.md`
- `security/rule-policy.md`
- `security/mcp-policy.md`
- `security/project-policy.md`
- `security/runtime-maintenance-policy.md`
- `security/lock-policy.md`
- `security/state-policy.md`
- `security/state-transaction-policy.md`
- `security/escalation-policy.md`
- `security/supervision-policy.md`
- `security/workspace-policy.md`
- `security/context-compression-policy.md`
- `index/NAVIGATION.md`
- `memory/archive/index.md`
- `tools/bin/ai-teams-mcp-healthcheck.sh`
- `tools/bin/ai-teams-skills-verify.sh`
- `tools/bin/ai-teams-e2e-fixtures.sh`
- `tools/bin/ai-teams-lock.sh`
- `tools/bin/ai-teams-state-event.sh`
- `tools/bin/ai-teams-state-render.sh`
- `tools/bin/ai-teams-supervision.sh`
- `tools/bin/ai-teams-run.ps1`
- `tools/bin/ai-teams-check.ps1`
- `tools/bin/ai-teams-init-project.ps1`
- `tools/bin/ai-teams-rule-refresh.mjs`
- `tools/bin/ai-teams-rule-create.mjs`
- `tools/bin/ai-teams-rule-refresh.ps1`
- `tools/bin/ai-teams-package.ps1`
- `hooks/scripts/ai-teams-run-hook.mjs`
- `hooks/scripts/ai-teams-run-hook.sh`
- `hooks/scripts/ai-teams-run-hook.ps1`
- `hooks/scripts/ai-teams-user-prompt-submit.sh`
- `hooks/scripts/ai-teams-run-hook.mjs` 中的 `git-activity-watch` 处理器
- `hooks/scripts/lock-timeout-check.sh`
- `hooks/scripts/agent-heartbeat.mjs`
- `.claude/agents/lead.md`
- `.claude/agents/pd.md`
- `.claude/agents/plan-pm.md`
- `.claude/agents/dev-frontend-web.md`
- `.claude/agents/dev-frontend-miniapp.md`
- `.claude/agents/dev-backend-systems.md`
- `.claude/agents/dev-backend-service.md`
- `.claude/agents/qa.md`
- `.claude/agents/memory.md`
- `.claude/agents/doc.md`
- `.claude/agents/role.md`
- `.claude/agents/security-reviewer.md`

## 工作流选择器文件

- 全局工作流选择器：`playbook.md` 中的 `3.4 工作流选择器`。
- Agent 工作流入口：`agents/<agent>/workflow.md`。
- Lead 调度工作流：`agents/lead/workflow.md`。
- Agent 与工作流摘要：`index/AGENTS.md`。
- 全局工作流图谱：`kb/graph.md`。
- 项目运行时工作流关系：`project/graph.md`。
- 工作流导航：`playbook.md` 的工作流选择器和各 Agent 的 `workflow.md`。

## Claude Code 官方 Agent 主定义

`.claude/agents/*.md` 是官方扫描入口，负责让 AI-Teams 的 12 个 subagent、颜色和 Lead 调度白名单生效。该目录保持扁平，不创建 `index.md`，不放组件文件。

- `.claude/agents/lead.md` -> [lead](../agents/lead/lead.md)
- `.claude/agents/pd.md` -> [pd](../agents/pd/pd.md)
- `.claude/agents/plan-pm.md` -> [plan-pm](../agents/plan-pm/plan-pm.md)
- `.claude/agents/dev-frontend-web.md` -> [dev-frontend-web](../agents/dev-frontend-web/dev-frontend-web.md)
- `.claude/agents/dev-frontend-miniapp.md` -> [dev-frontend-miniapp](../agents/dev-frontend-miniapp/dev-frontend-miniapp.md)
- `.claude/agents/dev-backend-systems.md` -> [dev-backend-systems](../agents/dev-backend-systems/dev-backend-systems.md)
- `.claude/agents/dev-backend-service.md` -> [dev-backend-service](../agents/dev-backend-service/dev-backend-service.md)
- `.claude/agents/qa.md` -> [qa](../agents/qa/qa.md)
- `.claude/agents/memory.md` -> [memory](../agents/memory/memory.md)
- `.claude/agents/doc.md` -> [doc](../agents/doc/doc.md)
- `.claude/agents/role.md` -> [role](../agents/role/role.md)
- `.claude/agents/security-reviewer.md` -> [security-reviewer](../agents/security-reviewer/security-reviewer.md)

## Agent 组件主文件

单个 Agent 的 AI-Teams 组件主文件是 `agents/<agent>/<agent>.md`，不再使用旧的单 Agent index 入口作为目标入口。

- `agents/lead/lead.md`
- `agents/pd/pd.md`
- `agents/plan-pm/plan-pm.md`
- `agents/dev-frontend-web/dev-frontend-web.md`
- `agents/dev-frontend-miniapp/dev-frontend-miniapp.md`
- `agents/dev-backend-systems/dev-backend-systems.md`
- `agents/dev-backend-service/dev-backend-service.md`
- `agents/qa/qa.md`
- `agents/memory/memory.md`
- `agents/doc/doc.md`
- `agents/role/role.md`
- `agents/security-reviewer/security-reviewer.md`

## Agent 组件文件

目标组件路径：

- `agents/<agent>/role.md`：职责边界
- `agents/<agent>/workflow.md`：工作流
- `agents/<agent>/memory.md`：记忆指针
- `agents/<agent>/kb.md`：知识库指针
- `agents/<agent>/skills.md`：Skills 指针
- `agents/<agent>/mcp.md`：MCP 指针
- `agents/<agent>/playbook.md`：Playbook 指针
- `security/agent-playbooks/<agent>.md`：Agent 专属动作规则本体

`agents/index.md` 保留为团队级索引；单 Agent 的 标准 Markdown 链接应指向主文件或具体组件文件。

## 开发 Agent 知识库

四个开发 Agent 的正式知识库位于 `kb/agents/<agent>/`，不另建并行目录。

- `kb/agents/dev-backend-service/index.md`
- `kb/agents/dev-backend-service/00-index.md`
- `kb/agents/dev-backend-service/01-source-map.md`
- `kb/agents/dev-backend-service/02-engineering-rules.md`
- `kb/agents/dev-backend-service/03-code-style.md`
- `kb/agents/dev-backend-service/04-review-checklist.md`
- `kb/agents/dev-backend-service/05-do-not.md`
- `kb/agents/dev-backend-systems/index.md`
- `kb/agents/dev-backend-systems/00-index.md`
- `kb/agents/dev-backend-systems/01-source-map.md`
- `kb/agents/dev-backend-systems/02-engineering-rules.md`
- `kb/agents/dev-backend-systems/03-code-style.md`
- `kb/agents/dev-backend-systems/04-review-checklist.md`
- `kb/agents/dev-backend-systems/05-do-not.md`
- `kb/agents/dev-frontend-web/index.md`
- `kb/agents/dev-frontend-web/00-index.md`
- `kb/agents/dev-frontend-web/01-source-map.md`
- `kb/agents/dev-frontend-web/02-engineering-rules.md`
- `kb/agents/dev-frontend-web/03-code-style.md`
- `kb/agents/dev-frontend-web/04-review-checklist.md`
- `kb/agents/dev-frontend-web/05-do-not.md`
- `kb/agents/dev-frontend-miniapp/index.md`
- `kb/agents/dev-frontend-miniapp/00-index.md`
- `kb/agents/dev-frontend-miniapp/01-source-map.md`
- `kb/agents/dev-frontend-miniapp/02-engineering-rules.md`
- `kb/agents/dev-frontend-miniapp/03-code-style.md`
- `kb/agents/dev-frontend-miniapp/04-review-checklist.md`
- `kb/agents/dev-frontend-miniapp/05-do-not.md`

## 关键协作 Agent 知识库

- `kb/agents/lead/index.md`
- `kb/agents/lead/00-index.md`
- `kb/agents/lead/01-source-map.md`
- `kb/agents/lead/02-engineering-rules.md`
- `kb/agents/lead/03-code-style.md`
- `kb/agents/lead/04-review-checklist.md`
- `kb/agents/lead/05-do-not.md`
- `kb/agents/qa/index.md`
- `kb/agents/qa/00-index.md`
- `kb/agents/qa/01-source-map.md`
- `kb/agents/qa/02-engineering-rules.md`
- `kb/agents/qa/03-code-style.md`
- `kb/agents/qa/04-review-checklist.md`
- `kb/agents/qa/05-do-not.md`
- `kb/agents/memory/index.md`
- `kb/agents/memory/00-index.md`
- `kb/agents/memory/01-source-map.md`
- `kb/agents/memory/02-engineering-rules.md`
- `kb/agents/memory/03-code-style.md`
- `kb/agents/memory/04-review-checklist.md`
- `kb/agents/memory/05-do-not.md`
- `kb/agents/doc/index.md`
- `kb/agents/doc/00-index.md`
- `kb/agents/doc/01-source-map.md`
- `kb/agents/doc/02-engineering-rules.md`
- `kb/agents/doc/03-code-style.md`
- `kb/agents/doc/04-review-checklist.md`
- `kb/agents/doc/05-do-not.md`
- `kb/agents/pd/index.md`
- `kb/agents/pd/00-index.md`
- `kb/agents/pd/01-source-map.md`
- `kb/agents/pd/02-engineering-rules.md`
- `kb/agents/pd/03-code-style.md`
- `kb/agents/pd/04-review-checklist.md`
- `kb/agents/pd/05-do-not.md`
- `kb/agents/plan-pm/index.md`
- `kb/agents/plan-pm/00-index.md`
- `kb/agents/plan-pm/01-source-map.md`
- `kb/agents/plan-pm/02-engineering-rules.md`
- `kb/agents/plan-pm/03-code-style.md`
- `kb/agents/plan-pm/04-review-checklist.md`
- `kb/agents/plan-pm/05-do-not.md`
- `kb/agents/role/index.md`
- `kb/agents/role/00-index.md`
- `kb/agents/role/01-source-map.md`
- `kb/agents/role/02-engineering-rules.md`
- `kb/agents/role/03-code-style.md`
- `kb/agents/role/04-review-checklist.md`
- `kb/agents/role/05-do-not.md`
- `kb/agents/security-reviewer/index.md`
- `kb/agents/security-reviewer/00-index.md`
- `kb/agents/security-reviewer/01-source-map.md`
- `kb/agents/security-reviewer/02-engineering-rules.md`
- `kb/agents/security-reviewer/03-code-style.md`
- `kb/agents/security-reviewer/04-review-checklist.md`
- `kb/agents/security-reviewer/05-do-not.md`

## 项目管理文件

- `project/index.md`
- `project/PROJECT.md`
- `project/context.md`
- `project/change-log.md`
- `project/project-profile.md`
- `project/ui-style.md`
- `project/api-contracts.md`
- `project/imported-rules.md`
- `project/rules/index.md`
- `project/requirements/index.md`
- `project/plans/index.md`
- `project/architecture.md`
- `project/commands.md`
- `project/verification.md`
- `project/dependencies.md`
- `project/risks.md`
- `project/graph.md`
- `security/project-policy.md`

## CodeGraph

- enabled: false
- status: index-present-cli-not-found
- path: `.codegraph/`
- mcp: `mcp/codegraph/`
- last_checked: 2026-06-02 12:57:53
- registry: `mcp/registry.json`
- guide: `index/CODEGRAPH.md`
- report: `logs/command/codegraph-status-20260602-125753.md`
- rule: CodeGraph CLI / MCP 可用时，Dev 和 QA 在大范围源码搜索前优先使用 `codegraph_status`、`codegraph_context`、`codegraph_explore` 和 `codegraph_impact`；当前 CLI 未全局安装，需按报告回退到索引和 `rg`。

## MCP

- MCP 总入口：`mcp/index.md`
- 共享 MCP 目录：`mcp/shared/index.md`
- Agent MCP 总索引：`mcp/agents/index.md`
- Agent MCP 绑定：`mcp/agents/<agent>/index.md`
- Agent 内部指针：`agents/<agent>/mcp.md`
- 机器可读 registry：`mcp/registry.json`
- MCP 安全规则：`security/mcp-policy.md`
- QA 浏览器自动化：`mcp/agents/qa/index.md` 中的 `chrome`
- MySQL / Figma / GitHub / filesystem 等 MCP 只记录脱敏元数据；私有密钥和值不得进入工程文件。

## 标准 Markdown

- documents config: `index/NAVIGATION.md`
- graph config: `index/NAVIGATION.md`
- graph index: `index/NAVIGATION.md`
- kb graph: `kb/graph.md`
- project graph: `project/graph.md`
- kb frontmatter template: `templates/kb-file/markdown-template.md`
- project graph template: `templates/project-graph/template.md`
- documents workspace: `security/runtime-maintenance-policy.md`
- documents tags workspace: `index/NAVIGATION.md`
- long-term tag registry: `index/NAVIGATION.md`

## 上下文压缩

- 规则：`memory/context-compression.md`
- 安全规则：`security/context-compression-policy.md`
- Hook 跨平台运行器：`hooks/scripts/ai-teams-run-hook.mjs`
- Git 无感变化监听：`git-activity-watch`（由跨平台运行器实现，不是独立 `.sh` 文件）
- Hook Bash 包装：`hooks/scripts/ai-teams-run-hook.sh`
- Hook PowerShell 包装：`hooks/scripts/ai-teams-run-hook.ps1`
- Hook 脚本：`hooks/scripts/context-compression-check.sh`
- 原生 Claude Memory 审计工具：`tools/bin/ai-teams-memory-audit.mjs`
- 原生 Claude Memory 审计报告：`memory/native-claude-memory-audit.md`
- Prompt 入口守卫 Hook：`hooks/scripts/ai-teams-user-prompt-submit.sh`
- 锁超时检查脚本：`hooks/scripts/lock-timeout-check.sh`
- Hook 配置示例：`hooks/configs/context-compression.example.env`
- Hook 提示模板：`hooks/templates/context-compression-notice.md`
- 手动指令：`tools/commands/ai/context-compact.md`
- 可执行脚本：`tools/bin/ai-teams-context-compact.sh`
- 隔离行为测试：`tools/bin/ai-teams-e2e-fixtures.sh`（E2E-08、E2E-09、E2E-11、E2E-12）

## Shared 工作区关键文件

- 任务单模板：`shared/tasks/TASK_TEMPLATE.md`
- 执行方案模板：`shared/tasks/EXECUTION_PLAN_TEMPLATE.md`
- 实时任务计划：`shared/task-plan.md`
- 流水线状态：`shared/pipeline-status.md`
- 交接模板：`shared/handoffs/HANDOFF_TEMPLATE.md`
- 广播协议：`shared/broadcasts/BROADCAST_PROTOCOL.md`
- 决策模板：`shared/decisions/DECISION_TEMPLATE.md`
- 锁状态：`shared/locks/LOCKS.md`
- 锁模板：`shared/locks/LOCK_TEMPLATE.md`
- 重试回流协议：`shared/escalations/retry-flowback.md`
- 回流模板：`shared/escalations/ESCALATION_TEMPLATE.md`
- 文档关系维护：`security/runtime-maintenance-policy.md`
- 文档导航规范：`index/NAVIGATION.md`

## 受保护范围

- `agents/`
- `prompts/`
- `memory/`
- `kb/`
- `project/`
- `project/context.md`
- `project/change-log.md`
- `project/requirements/`
- `project/plans/`
- `shared/tasks/`
- `shared/handoffs/`
- `shared/escalations/`
- `shared/locks/`
- `shared/`
- `shared/prompt-evolution/`
- `security/`
- `hooks/`
- `tools/commands/`
- `tools/bin/`
- `skills/agents/`
- `skills/shared/`
- `.claude/settings.json`
- `.claude/settings.local.example.json`
- `CLAUDE.md`
- `index/`

## ADR

- ADR 规范：`security/adr.md`
- ADR 索引：`project/adr/index.md`
- ADR 模板：`project/adr/template.md`
- 已采纳 ADR：`project/adr/accepted/`
- 已拒绝 ADR：`project/adr/rejected/`
- 文档路径与关系图：`index/NAVIGATION.md`

## 安全

- 文件所有权：`security/file-ownership.md`
- 敏感文件：`security/sensitive-files.md`
- 删除规则：`security/delete-policy.md`
- 任务规则：`security/task-policy.md`
- 通用开发规则：`security/development-policy.md`
- Web 前端开发规则：`security/development-frontend-web-policy.md`
- 小程序开发规则：`security/development-frontend-miniapp-policy.md`
- 强类型系统后端开发规则：`security/development-backend-systems-policy.md`
- 弱类型/服务端工程开发规则：`security/development-backend-service-policy.md`
- 锁规则：`security/lock-policy.md`
- 状态规则：`security/state-policy.md`
- 回流规则：`security/escalation-policy.md`
- 工作区规则：`security/workspace-policy.md`
- 上下文压缩规则：`security/context-compression-policy.md`
- 文档导航规则：`index/NAVIGATION.md`
- 提示词治理规则：`security/prompt-policy.md`
- 提示词注入规则：`security/prompt-injection-policy.md`
- 提示词进化规则：`security/prompt-evolution-policy.md`
- Agent 专属动作规则：`security/agent-playbooks/`

## Skills

- Skills 总入口：`skills/index.md`
- Skills 总表：`skills/registry.json`
- 共享 Skills 索引：`skills/shared/index.md`
- Agent Skills 索引：`skills/agents/<agent>/index.md`
- Agent 本体指针：`agents/<agent>/skills.md`

## MCP

- MCP 总入口：`mcp/index.md`
- MCP 共享清单：`mcp/shared/index.md`
- MCP Agent 绑定总索引：`mcp/agents/index.md`
- MCP Agent 绑定文件：`mcp/agents/<agent>/index.md`
- MCP 安全规则：`security/mcp-policy.md`

## 项目知识图谱

- 项目图谱：`project/graph.md`
- 接口契约工作区：`shared/contracts/index.md`
- 接口契约模板：`shared/contracts/API_CONTRACT_TEMPLATE.md`
- 接口契约规则：`security/interface-contract-policy.md`
- 项目图谱模板：`templates/project-graph/template.md`
- 初始化脚本：`tools/bin/ai-teams-init-project.sh`
- 全局知识图谱：`kb/graph.md`

## 提示词

- 提示词总索引：`prompts/index.md`
- 提示词图谱：`prompts/graph.md`
- 活动版本注册表：`prompts/registry.json`
- 公共 system/task/retry 片段：`prompts/common/`
- 12 个 Agent 提示词：`prompts/agents/<agent>/`
- 变量、输出和评测 Schema：`prompts/schemas/`
- 运行期事件、候选和评审：`shared/prompt-evolution/`
- 事件 Hook：`hooks/scripts/prompt-evolution-event.mjs`
- Agent 任务合同 Hook：`hooks/scripts/prompt-contract-check.mjs`
- 提示词工具：`tools/bin/ai-teams-prompt-*.mjs`
- 活动提示词编译器：`tools/bin/ai-teams-prompt-compile.mjs`
- 提示词指令：`tools/commands/ai/prompt-*.md`


<!-- AI-TEAMS:codegraph-status:BEGIN -->
## CodeGraph 自动检测

- last_checked: 2026-06-02 12:57:53
- target: AI-Teams 当前工程根目录
- command: not-found
- npx: /usr/local/bin/npx
- index: present
- mcp: documented
- report: logs/command/codegraph-status-20260602-125753.md

<!-- AI-TEAMS:codegraph-status:END -->
