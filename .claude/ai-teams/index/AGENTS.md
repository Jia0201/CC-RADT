---
id: "index-agents"
title: "Agent 索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# Agent 索引

Agent 团队级索引见 [index](../agents/index.md)。本文件只保留全局导航摘要。

Claude Code 官方运行入口是 `.claude/agents/<agent>.md`。每个 Agent 进入后先读 `rule/agents/<agent>.md` 获取最小上下文，再读取 `agents/<agent>/` 中的职责与组件文件。官方入口负责生效，`rule/agents/` 负责按需路由，组件目录负责 Harness 本体。

每个 Agent 的版本化 system/task/retry prompt 位于 `prompts/agents/<agent>/`，活动版本由 `prompts/registry.json` 解析。`.claude/agents/*.md` 是活动 system prompt 的编译产物；失败事件进入 `shared/prompt-evolution/`，不得由 Agent 自己热改 active。

| Agent | 角色 | Color / Style | 官方运行入口 | AI-Teams 组件主文件 | Playbook | 管理范围 |
|---|---|---|---|---|---|---|
| Lead | 主调度、决策、验收 | red / commander | `.claude/agents/lead.md` | [lead](../agents/lead/lead.md) | [playbook](../agents/lead/playbook.md) / [lead](../security/agent-playbooks/lead.md) | `shared/`, `index/STATUS.md`，关闭前检查 `project/` 是否已由 Doc 处理 |
| PD | 需求解析 | pink / product-discovery | `.claude/agents/pd.md` | [pd](../agents/pd/pd.md) | [playbook](../agents/pd/playbook.md) / [pd](../security/agent-playbooks/pd.md) | `project/requirements/` |
| Plan-PM | 计划管理与任务策划 | orange / planning-manager | `.claude/agents/plan-pm.md` | [plan-pm](../agents/plan-pm/plan-pm.md) | [playbook](../agents/plan-pm/playbook.md) / [plan-pm](../security/agent-playbooks/plan-pm.md) | `project/plans/`, `shared/tasks/` |
| Dev-Frontend-Web | Vue / React / Angular | cyan / web-frontend | `.claude/agents/dev-frontend-web.md` | [dev-frontend-web](../agents/dev-frontend-web/dev-frontend-web.md) | [playbook](../agents/dev-frontend-web/playbook.md) / [dev-frontend-web](../security/agent-playbooks/dev-frontend-web.md) | 任务范围，项目发现写交接 |
| Dev-Frontend-Miniapp | 微信小程序 / 支付宝小程序 | purple / miniapp-frontend | `.claude/agents/dev-frontend-miniapp.md` | [dev-frontend-miniapp](../agents/dev-frontend-miniapp/dev-frontend-miniapp.md) | [playbook](../agents/dev-frontend-miniapp/playbook.md) / [dev-frontend-miniapp](../security/agent-playbooks/dev-frontend-miniapp.md) | 任务范围，项目发现写交接 |
| Dev-Backend-Systems | C / C++ / Java | blue / systems-backend | `.claude/agents/dev-backend-systems.md` | [dev-backend-systems](../agents/dev-backend-systems/dev-backend-systems.md) | [playbook](../agents/dev-backend-systems/playbook.md) / [dev-backend-systems](../security/agent-playbooks/dev-backend-systems.md) | 任务范围，项目发现写交接 |
| Dev-Backend-Service | Python / Go / Node.js / TypeScript | green / service-backend | `.claude/agents/dev-backend-service.md` | [dev-backend-service](../agents/dev-backend-service/dev-backend-service.md) | [playbook](../agents/dev-backend-service/playbook.md) / [dev-backend-service](../security/agent-playbooks/dev-backend-service.md) | 任务范围，项目发现写交接 |
| QA | 测试与代码评审 | yellow / quality-gate | `.claude/agents/qa.md` | [qa](../agents/qa/qa.md) | [playbook](../agents/qa/playbook.md) / [qa](../security/agent-playbooks/qa.md) | QA 报告，验证事实交给 Doc 合并 `project/verification.md` |
| Memory | 记忆管理 | green / memory-keeper | `.claude/agents/memory.md` | [memory](../agents/memory/memory.md) | [playbook](../agents/memory/playbook.md) / [memory](../security/agent-playbooks/memory.md) | `memory/`, `memory/conversations/`，并行检测压缩/候选/保留策略 |
| Doc | 文档、知识库、模板 | cyan / documentation | `.claude/agents/doc.md` | [doc](../agents/doc/doc.md) | [playbook](../agents/doc/playbook.md) / [doc](../security/agent-playbooks/doc.md) | `project/`, `kb/`, `templates/`, `index/`, `logs/` 索引 |
| Role | Agent 管理 | orange / role-governance | `.claude/agents/role.md` | [role](../agents/role/role.md) | [playbook](../agents/role/playbook.md) / [role](../security/agent-playbooks/role.md) | `agents/`, `.claude/agents/`, `agents/index.md`，运行期 Agent 指引维护 |
| Security-Reviewer | 安全审查 | red / security-gate | `.claude/agents/security-reviewer.md` | [security-reviewer](../agents/security-reviewer/security-reviewer.md) | [playbook](../agents/security-reviewer/playbook.md) / [security-reviewer](../security/agent-playbooks/security-reviewer.md) | `security/`, `hooks/`，风险事实交给 Doc 合并 `project/risks.md` |

## 工作流参与关系

全局工作流选择器位于 [playbook.md 3.4](../playbook.md#3.4-工作流选择器)。Lead 先选 `WF-01` 到 `WF-12`，再决定是否需要任务单、并行监督、QA/Doc/Memory/Security/Role 档位和 Agent 组合。设计原因见 ADR-0010（源工程设计记录）。

| 工作流 | 名称 | 核心参与 Agent | 说明 |
|---|---|---|---|
| WF-01 | 快速问答流 | Lead | 只读解释、简单判断或用户明确要求只回答；Q0/D0/M0/S0。 |
| WF-02 | 小修快跑流 | Lead, 对应 Dev, QA | 单文件小 bug、文案或低风险配置；Doc/Security 按 D0/D1、S0/S1 判断。 |
| WF-03 | 前端单任务流 | Lead, Dev-Frontend-Web, QA | Web 页面、组件、样式、表单和交互。 |
| WF-04 | 小程序单任务流 | Lead, Dev-Frontend-Miniapp, QA | 小程序平台能力、授权、支付、分享和分包。 |
| WF-05 | 后端服务流 | Lead, Dev-Backend-Service, QA | Python、Go、Node.js、API、数据库、日志和配置。 |
| WF-06 | 系统后端流 | Lead, Dev-Backend-Systems, QA | Java、C、C++、Spring 和强约束服务。 |
| WF-07 | 前后端联调流 | Lead, 前端 Dev, 后端 Dev, QA, Doc | 接口字段、页面字段、契约不一致和联调缺口。 |
| WF-08 | Bug 修复流 | Lead, QA, 对应 Dev, QA | QA 先复现或确认失败面，再交对应 Dev 修复并回归。 |
| WF-09 | 需求澄清流 | Lead, PD, Plan-PM | 需求目标、验收标准或业务规则不完整时先澄清。 |
| WF-10 | 标准功能开发流 | Lead, PD, Plan-PM, Dev, QA, Doc, Memory, Security-Reviewer | 中等复杂功能、多文件或多 Agent 任务的默认标准流。 |
| WF-11 | 高风险变更流 | Lead, Security-Reviewer, Plan-PM, Dev/Doc/Role, QA | 删除、权限、Hooks、MCP、settings、迁移和安全边界强制升级。 |
| WF-12 | 文档与知识图谱流 | Lead, Doc, Memory, Role, Security-Reviewer | README、索引、标准 Markdown、KB、project、memory 和 ADR 治理。 |

| Agent | 高频参与工作流 | 参与方式 |
|---|---|---|
| Lead | WF-01..WF-12 | 选择工作流、确定下发机制、检查关闭条件。 |
| PD | WF-09, WF-10 | 输出需求卡、业务边界、验收口径和待确认问题。 |
| Plan-PM | WF-09, WF-10, WF-11 | 输出执行卡、任务单、依赖和锁范围；高风险流在 Security 前置后计划。 |
| Dev-Frontend-Web | WF-02, WF-03, WF-07, WF-08, WF-10, WF-11 | Web 实现、联调修复和项目发现交接。 |
| Dev-Frontend-Miniapp | WF-02, WF-04, WF-07, WF-08, WF-10, WF-11 | 小程序实现、平台差异说明和联调修复。 |
| Dev-Backend-Service | WF-02, WF-05, WF-07, WF-08, WF-10, WF-11 | 服务端、API、数据库和配置类实现。 |
| Dev-Backend-Systems | WF-02, WF-06, WF-07, WF-08, WF-10, WF-11 | 系统级后端、强约束服务和稳定性风险说明。 |
| QA | WF-02..WF-08, WF-10, WF-11 | Q1/Q2 验证、Bug 复现、回归和证据沉淀。 |
| Memory | WF-10, WF-12；M1-M3 收尾门按需参与 | 判断共享记忆、Agent 独立记忆、项目事实和恢复材料。 |
| Doc | WF-07, WF-10, WF-12；D1/D2 按需参与 | 维护 `project/`、索引、图谱、KB 和 ADR。 |
| Role | WF-11, WF-12；R1/R2 按需参与 | 检查或更新 Agent 指引、职责边界和工作流指针。 |
| Security-Reviewer | WF-10, WF-11, WF-12；S1/S2 按需参与 | 轻量审查或前置审查敏感范围、权限、命令和越界风险。 |

## Agent 目录标准

每个 Agent 的目标文件结构如下：

- 主文件：`agents/<agent>/<agent>.md`
- 职责边界：`agents/<agent>/role.md`
- 工作流：`agents/<agent>/workflow.md`
- 记忆指针：`agents/<agent>/memory.md`
- 知识库指针：`agents/<agent>/kb.md`
- Skills 指针：`agents/<agent>/skills.md`
- MCP 指针：`agents/<agent>/mcp.md`
- Playbook 指针：`agents/<agent>/playbook.md`
- Agent 专属动作规则：`security/agent-playbooks/<agent>.md`
- 正式记忆：`memory/agents/<agent>/MEMORY.md`
- 正式知识库：`kb/agents/<agent>/index.md`
- Skills 目录：`skills/agents/<agent>/`
- MCP 目录：`mcp/agents/<agent>/`

标准 Markdown 链接引用单个 Agent 时应指向主文件或上述具体组件文件；`agents/index.md` 只表示团队级索引。

## 官方运行入口维护规则

- `.claude/agents/*.md` 必须保留 `name`、`description`、`color`；Lead 还必须保留 `tools: Agent(pd, plan-pm, dev-frontend-web, dev-frontend-miniapp, dev-backend-systems, dev-backend-service, qa, memory, doc, role, security-reviewer)`。
- `.claude/agents/*.md` 必须包含“Claude Code 官方运行入口”段，明确读取 `index/ENTRY.md`、对应 `agents/<agent>/<agent>.md`、`security/index.md`、`security/agent-playbooks/<agent>.md`、`shared/index.md`、`project/index.md`、`memory/`、`kb/`、`skills/`、`mcp/`、`hooks/`。
- `.claude/agents/` 不创建 `index.md`，也不放组件文件；官方扫描目录保持扁平 12 个 Agent 文件。
- 修改 `agents/<agent>/<agent>.md` 后，Role 必须同步检查 `.claude/agents/<agent>.md` 是否需要更新；Doc 必须检查 [graph](../kb/graph.md)、[FILES](./FILES.md) 和本索引。
- 修改或激活 Prompt 后，Role 运行 `tools/bin/ai-teams-prompt-compile.mjs`，QA 验证回归，Security-Reviewer 检查注入与权限，Doc 更新 [graph](../prompts/graph.md) 和全局图谱。

## 项目管理责任

Agent 执行项目类任务前先读取 [index](../rule/project/index.md)，再按 Agent 和任务路由选择 `project/context.md`、当前任务单及必要的 UI、接口、架构、验证或风险文件。需要精确文件位置时才读取 [files](../rule/project/files.md)。Doc 是 `project/` 和项目规则索引的维护者；Lead 关闭任务前检查是否已处理或明确跳过。

非平凡项目任务默认同时让 Doc、Memory、Security-Reviewer 作为并行监督 Agent 参与：Doc 管项目文档和图谱，Memory 管记忆候选/压缩/保留策略，Security-Reviewer 管越界和风险。涉及 Agent、索引、规则、Tools、Hooks、MCP、Skills、目录结构、playbook 或职责边界变化时，Role 也必须按 [runtime-maintenance-policy](../security/runtime-maintenance-policy.md) 参与并输出 Agent 指引维护结论。

## CodeGraph 使用责任

- Dev 和 QA 在代码定位、调用关系、影响分析时优先使用 `index/CODEGRAPH.md` 定义的 CodeGraph 流程。
- Lead 在任务分派时记录 CodeGraph 是否适用。
- Doc 将经过验证的 CodeGraph 结论沉淀到知识库候选或正式知识库。

## MCP 绑定责任

MCP 总入口见 [index](../mcp/index.md)，共享 MCP 目录见 [index](../mcp/shared/index.md)，Agent 绑定总索引见 [index](../mcp/agents/index.md)。每个 Agent 执行前读取自己的 `agents/<agent>/mcp.md`，需要启用 MCP 时再读取 `mcp/agents/<agent>/index.md`。

| Agent | MCP 绑定入口 | 重点能力 |
|---|---|---|
| Lead | [index](../mcp/agents/lead/index.md) | MCP 盘点、GitHub 协作、受限文件访问、文档参考 |
| PD | [index](../mcp/agents/pd/index.md) | Context7、Figma、Canva 待确认、受限文件访问 |
| Plan-PM | [index](../mcp/agents/plan-pm/index.md) | Context7、GitHub、受限文件访问、CodeGraph |
| Dev-Frontend-Web | [index](../mcp/agents/dev-frontend-web/index.md) | Chrome MCP、Figma、shadcn、Context7、Node REPL、CodeGraph |
| Dev-Frontend-Miniapp | [index](../mcp/agents/dev-frontend-miniapp/index.md) | Chrome MCP、Figma、Context7、CodeGraph |
| Dev-Backend-Systems | [index](../mcp/agents/dev-backend-systems/index.md) | MySQL、Context7、GitHub、CodeGraph |
| Dev-Backend-Service | [index](../mcp/agents/dev-backend-service/index.md) | MySQL、Node REPL、Context7、GitHub、CodeGraph |
| QA | [index](../mcp/agents/qa/index.md) | Chrome MCP 浏览器自动化、MySQL 只读校验、GitHub、Context7、CodeGraph |
| Memory | [index](../mcp/agents/memory/index.md) | 受限文件访问 |
| Doc | [index](../mcp/agents/doc/index.md) | Context7、Figma、Canva 待确认、受限文件访问、MCP 盘点 |
| Role | [index](../mcp/agents/role/index.md) | 受限文件访问、MCP 盘点 |
| Security-Reviewer | [index](../mcp/agents/security-reviewer/index.md) | mcporter、Chrome MCP、MySQL、GitHub、filesystem、Node REPL |

MCP 使用、安装和跨 Agent 调用必须遵循 [mcp-policy](../security/mcp-policy.md)；密钥值、token、数据库密码和远程私有 URL 不得进入工程文件。
