---
id: agents-main-index
title: Agent 主索引
type: agent-index
scope: project
owner: role
status: active
---
# Agent 主索引

本文件是 AI-Teams Agent 总索引。Claude Code 官方运行入口在 `.claude/agents/<agent>.md`；AI-Teams 组件主文件在 `agents/<agent>/<agent>.md`，结构文件固定为 `role.md`、`workflow.md`、`memory.md`、`kb.md`、`skills.md`、`mcp.md` 和 `playbook.md`。不要使用 `agents/<agent>/index.md`。

所有 Agent 启动后先读取 [index](../rule/index.md)、自己的 `rule/agents/<agent>.md` 和 [index](../rule/tasks/index.md)。项目类任务再从 [index](../rule/project/index.md) 进入，只读取当前任务需要的项目事实；不得默认加载整个 `project/`。

所有 Agent 还必须从 [index](../prompts/index.md) 和 `prompts/registry.json` 读取自己的活动 system/task/retry 版本。Lead 使用渲染器生成 task/user prompt；Agent 只能提交失败事实与建议，不得修改或激活自己的活动 system prompt。

如果任务命中运行期新增规则，Agent 只读取 [index](../rule/custom/index.md) 中匹配的自建规则；自建规则只做路由，动作规则仍以 `security/` 为准。

最小规则路由示例：Lead 先读 `rule/agents/lead.md`，PD 先读 `rule/agents/pd.md`，Plan-PM 先读 `rule/agents/plan-pm.md`，开发 Agent 先读自己的 `rule/agents/<agent>.md`，再按任务进入 `rule/project/`、`rule/security/`、`rule/shared/`、`rule/memory/`、`rule/tools/` 或 `rule/catalog/`。

## 官方运行入口

`.claude/agents/*.md` 是 Claude Code 官方扫描的 subagent 主定义。它负责让 12 个 AI-Teams 员工、颜色和 Lead 调度白名单真正生效；它必须明确指向 AI-Teams 工程大脑中的规则、记忆、知识库、共享工作区、项目画像、Hooks、MCP 和 Skills。

| Agent | 官方运行入口 | AI-Teams 组件主文件 |
|---|---|---|
| Lead | `.claude/agents/lead.md` | [lead](./lead/lead.md) |
| PD | `.claude/agents/pd.md` | [pd](./pd/pd.md) |
| Plan-PM | `.claude/agents/plan-pm.md` | [plan-pm](./plan-pm/plan-pm.md) |
| Dev-Frontend-Web | `.claude/agents/dev-frontend-web.md` | [dev-frontend-web](./dev-frontend-web/dev-frontend-web.md) |
| Dev-Frontend-Miniapp | `.claude/agents/dev-frontend-miniapp.md` | [dev-frontend-miniapp](./dev-frontend-miniapp/dev-frontend-miniapp.md) |
| Dev-Backend-Systems | `.claude/agents/dev-backend-systems.md` | [dev-backend-systems](./dev-backend-systems/dev-backend-systems.md) |
| Dev-Backend-Service | `.claude/agents/dev-backend-service.md` | [dev-backend-service](./dev-backend-service/dev-backend-service.md) |
| QA | `.claude/agents/qa.md` | [qa](./qa/qa.md) |
| Memory | `.claude/agents/memory.md` | [memory](./memory/memory.md) |
| Doc | `.claude/agents/doc.md` | [doc](./doc/doc.md) |
| Role | `.claude/agents/role.md` | [role](./role/role.md) |
| Security-Reviewer | `.claude/agents/security-reviewer.md` | [security-reviewer](./security-reviewer/security-reviewer.md) |

维护要求：

- `.claude/agents/` 保持扁平，只放 12 个 Agent 主定义文件。
- 不在 `.claude/agents/` 下创建 `index.md` 或 `role.md`、`workflow.md` 等组件文件。
- 修改 `agents/<agent>/<agent>.md`、`security/agent-playbooks/<agent>.md`、`memory/`、`kb/`、`skills/`、`mcp/` 或 `hooks/` 指针后，Role 必须检查对应 `.claude/agents/<agent>.md` 是否仍然指向正确入口。
- Doc 必须同步检查 [AGENTS](../index/AGENTS.md)、[FILES](../index/FILES.md)、[graph](../kb/graph.md) 和 标准 Markdown 链接。
- Role 必须通过 `tools/bin/ai-teams-prompt-compile.mjs` 将活动 system prompt 编译到 `.claude/agents/*.md`，保留 Claude Code frontmatter；新版本只在下一次调用或新会话生效。

## Agent 提示词

| Agent | Prompt 入口 |
|---|---|
| Lead | [index](../prompts/agents/lead/index.md) |
| PD | [index](../prompts/agents/pd/index.md) |
| Plan-PM | [index](../prompts/agents/plan-pm/index.md) |
| Dev-Frontend-Web | [index](../prompts/agents/dev-frontend-web/index.md) |
| Dev-Frontend-Miniapp | [index](../prompts/agents/dev-frontend-miniapp/index.md) |
| Dev-Backend-Systems | [index](../prompts/agents/dev-backend-systems/index.md) |
| Dev-Backend-Service | [index](../prompts/agents/dev-backend-service/index.md) |
| QA | [index](../prompts/agents/qa/index.md) |
| Memory | [index](../prompts/agents/memory/index.md) |
| Doc | [index](../prompts/agents/doc/index.md) |
| Role | [index](../prompts/agents/role/index.md) |
| Security-Reviewer | [index](../prompts/agents/security-reviewer/index.md) |

## 颜色与样式

Claude Code subagent 支持 `color` frontmatter。AI-Teams 在 `.claude/agents/*.md`、每个 Agent 主文档和 `.claude/settings.json` 的 Agent 注册中同步保存 `color` 与 `style`，用于官方 subagent 颜色显示和后续索引治理。

Claude Code 官方当前只提供 `red`、`blue`、`green`、`yellow`、`purple`、`orange`、`pink`、`cyan` 八种颜色，而 AI-Teams 有 12 个 Agent，因此颜色复用是有意设计，不是唯一身份标识。运行时必须按 Agent 名称和职责识别员工；`style` 只用于 AI-Teams 内部治理，不冒充 Claude Code 官方字段。

| Agent | Color | Style |
|---|---|---|
| Lead | red | commander |
| PD | pink | product-discovery |
| Plan-PM | orange | planning-manager |
| Dev-Frontend-Web | cyan | web-frontend |
| Dev-Frontend-Miniapp | purple | miniapp-frontend |
| Dev-Backend-Systems | blue | systems-backend |
| Dev-Backend-Service | green | service-backend |
| QA | yellow | quality-gate |
| Memory | green | memory-keeper |
| Doc | cyan | documentation |
| Role | orange | role-governance |
| Security-Reviewer | red | security-gate |

| Agent | 主文件 | 组件入口 | Playbook | 正式记忆 / 知识库 | Skills / MCP |
|---|---|---|---|---|---|
| Lead | [lead](./lead/lead.md) | [role](./lead/role.md) · [workflow](./lead/workflow.md) · [memory](./lead/memory.md) · [kb](./lead/kb.md) · [skills](./lead/skills.md) · [mcp](./lead/mcp.md) | [playbook](./lead/playbook.md) / [lead](../security/agent-playbooks/lead.md) | [MEMORY](../memory/agents/lead/MEMORY.md) / [index](../kb/agents/lead/index.md) | `skills/agents/lead/` / `mcp/agents/lead/` |
| PD | [pd](./pd/pd.md) | [role](./pd/role.md) · [workflow](./pd/workflow.md) · [memory](./pd/memory.md) · [kb](./pd/kb.md) · [skills](./pd/skills.md) · [mcp](./pd/mcp.md) | [playbook](./pd/playbook.md) / [pd](../security/agent-playbooks/pd.md) | [MEMORY](../memory/agents/pd/MEMORY.md) / [index](../kb/agents/pd/index.md) | `skills/agents/pd/` / `mcp/agents/pd/` |
| Plan-PM | [plan-pm](./plan-pm/plan-pm.md) | [role](./plan-pm/role.md) · [workflow](./plan-pm/workflow.md) · [memory](./plan-pm/memory.md) · [kb](./plan-pm/kb.md) · [skills](./plan-pm/skills.md) · [mcp](./plan-pm/mcp.md) | [playbook](./plan-pm/playbook.md) / [plan-pm](../security/agent-playbooks/plan-pm.md) | [MEMORY](../memory/agents/plan-pm/MEMORY.md) / [index](../kb/agents/plan-pm/index.md) | `skills/agents/plan-pm/` / `mcp/agents/plan-pm/` |
| Dev-Frontend-Web | [dev-frontend-web](./dev-frontend-web/dev-frontend-web.md) | [role](./dev-frontend-web/role.md) · [workflow](./dev-frontend-web/workflow.md) · [memory](./dev-frontend-web/memory.md) · [kb](./dev-frontend-web/kb.md) · [skills](./dev-frontend-web/skills.md) · [mcp](./dev-frontend-web/mcp.md) | [playbook](./dev-frontend-web/playbook.md) / [dev-frontend-web](../security/agent-playbooks/dev-frontend-web.md) | [MEMORY](../memory/agents/dev-frontend-web/MEMORY.md) / [index](../kb/agents/dev-frontend-web/index.md) | `skills/agents/dev-frontend-web/` / `mcp/agents/dev-frontend-web/` |
| Dev-Frontend-Miniapp | [dev-frontend-miniapp](./dev-frontend-miniapp/dev-frontend-miniapp.md) | [role](./dev-frontend-miniapp/role.md) · [workflow](./dev-frontend-miniapp/workflow.md) · [memory](./dev-frontend-miniapp/memory.md) · [kb](./dev-frontend-miniapp/kb.md) · [skills](./dev-frontend-miniapp/skills.md) · [mcp](./dev-frontend-miniapp/mcp.md) | [playbook](./dev-frontend-miniapp/playbook.md) / [dev-frontend-miniapp](../security/agent-playbooks/dev-frontend-miniapp.md) | [MEMORY](../memory/agents/dev-frontend-miniapp/MEMORY.md) / [index](../kb/agents/dev-frontend-miniapp/index.md) | `skills/agents/dev-frontend-miniapp/` / `mcp/agents/dev-frontend-miniapp/` |
| Dev-Backend-Systems | [dev-backend-systems](./dev-backend-systems/dev-backend-systems.md) | [role](./dev-backend-systems/role.md) · [workflow](./dev-backend-systems/workflow.md) · [memory](./dev-backend-systems/memory.md) · [kb](./dev-backend-systems/kb.md) · [skills](./dev-backend-systems/skills.md) · [mcp](./dev-backend-systems/mcp.md) | [playbook](./dev-backend-systems/playbook.md) / [dev-backend-systems](../security/agent-playbooks/dev-backend-systems.md) | [MEMORY](../memory/agents/dev-backend-systems/MEMORY.md) / [index](../kb/agents/dev-backend-systems/index.md) | `skills/agents/dev-backend-systems/` / `mcp/agents/dev-backend-systems/` |
| Dev-Backend-Service | [dev-backend-service](./dev-backend-service/dev-backend-service.md) | [role](./dev-backend-service/role.md) · [workflow](./dev-backend-service/workflow.md) · [memory](./dev-backend-service/memory.md) · [kb](./dev-backend-service/kb.md) · [skills](./dev-backend-service/skills.md) · [mcp](./dev-backend-service/mcp.md) | [playbook](./dev-backend-service/playbook.md) / [dev-backend-service](../security/agent-playbooks/dev-backend-service.md) | [MEMORY](../memory/agents/dev-backend-service/MEMORY.md) / [index](../kb/agents/dev-backend-service/index.md) | `skills/agents/dev-backend-service/` / `mcp/agents/dev-backend-service/` |
| QA | [qa](./qa/qa.md) | [role](./qa/role.md) · [workflow](./qa/workflow.md) · [memory](./qa/memory.md) · [kb](./qa/kb.md) · [skills](./qa/skills.md) · [mcp](./qa/mcp.md) | [playbook](./qa/playbook.md) / [qa](../security/agent-playbooks/qa.md) | [MEMORY](../memory/agents/qa/MEMORY.md) / [index](../kb/agents/qa/index.md) | `skills/agents/qa/` / `mcp/agents/qa/` |
| Memory | [memory](./memory/memory.md) | [role](./memory/role.md) · [workflow](./memory/workflow.md) · [memory](./memory/memory.md) · [kb](./memory/kb.md) · [skills](./memory/skills.md) · [mcp](./memory/mcp.md) | [playbook](./memory/playbook.md) / [memory](../security/agent-playbooks/memory.md) | [MEMORY](../memory/agents/memory/MEMORY.md) / [index](../kb/agents/memory/index.md) | `skills/agents/memory/` / `mcp/agents/memory/` |
| Doc | [doc](./doc/doc.md) | [role](./doc/role.md) · [workflow](./doc/workflow.md) · [memory](./doc/memory.md) · [kb](./doc/kb.md) · [skills](./doc/skills.md) · [mcp](./doc/mcp.md) | [playbook](./doc/playbook.md) / [doc](../security/agent-playbooks/doc.md) | [MEMORY](../memory/agents/doc/MEMORY.md) / [index](../kb/agents/doc/index.md) | `skills/agents/doc/` / `mcp/agents/doc/` |
| Role | [role](./role/role.md) | [role](./role/role.md) · [workflow](./role/workflow.md) · [memory](./role/memory.md) · [kb](./role/kb.md) · [skills](./role/skills.md) · [mcp](./role/mcp.md) | [playbook](./role/playbook.md) / [role](../security/agent-playbooks/role.md) | [MEMORY](../memory/agents/role/MEMORY.md) / [index](../kb/agents/role/index.md) | `skills/agents/role/` / `mcp/agents/role/` |
| Security-Reviewer | [security-reviewer](./security-reviewer/security-reviewer.md) | [role](./security-reviewer/role.md) · [workflow](./security-reviewer/workflow.md) · [memory](./security-reviewer/memory.md) · [kb](./security-reviewer/kb.md) · [skills](./security-reviewer/skills.md) · [mcp](./security-reviewer/mcp.md) | [playbook](./security-reviewer/playbook.md) / [security-reviewer](../security/agent-playbooks/security-reviewer.md) | [MEMORY](../memory/agents/security-reviewer/MEMORY.md) / [index](../kb/agents/security-reviewer/index.md) | `skills/agents/security-reviewer/` / `mcp/agents/security-reviewer/` |

## 维护规则

- Role 负责 Agent 文件结构和职责边界维护。
- Lead 负责 Agent 调度和最终验收。
- Memory 负责正式 Agent 记忆；`agents/<agent>/memory.md` 只维护结构内导航。
- Doc 负责正式 Agent 知识库；`agents/<agent>/kb.md` 只维护结构内导航。
- Skills 和 MCP 的正式 registry 分别以 `skills/registry.json` 和 `mcp/registry.json` 为准。
- Agent 级 Skills 和 MCP 目录分别为 `skills/agents/<agent>/` 和 `mcp/agents/<agent>/`，主文档必须指向具体目录。
- Playbook 规则本体在 `security/agent-playbooks/`；`agents/<agent>/playbook.md` 只维护 Agent 目录内指针。
- Agent、playbook、记忆、知识库、Skills、MCP 路径变更后，Doc 必须检查 [graph](../kb/graph.md) 和 [导航规范](../index/NAVIGATION.md)。
- 运行期维护按 [runtime-maintenance-policy](../security/runtime-maintenance-policy.md) 执行：Doc 管 `project/`、索引、图谱和 文档链接；Memory 管记忆、恢复点、上下文压缩和记忆索引；Role 管 Agent 指引、职责边界、组件指针和专属 playbook 关联；Security-Reviewer 管越界、锁、删除、敏感文件和高风险动作。
- 新增或修改规则、Tools、Hooks、MCP、Skills、目录结构、playbook 或 Agent 职责后，Role 必须检查相关 Agent 主文档和组件文件是否需要更新。
- 提示词活动版本以 `prompts/registry.json` 为唯一注册表；Agent 文件不维护第二份版本状态。
- Memory Agent 的 `agents/memory/memory.md` 同时是该 Agent 主文件和结构内记忆指针文件。
- Role Agent 的 `agents/role/role.md` 同时是该 Agent 主文件和结构内职责边界文件。
- `.claude/agents/` 只保留 Claude Code 官方 subagent 主定义，用于加载 12 个 AI-Teams 员工、颜色和 Lead 调度白名单；不要在其中放 `role.md`、`workflow.md`、`memory.md` 等组件文件。
- `agents/<agent>/` 保留 AI-Teams 组件文档、职责边界、工作流、记忆指针、知识库指针、Skills 指针、MCP 指针和 playbook 指针。
- `.claude/rules/` 是 Claude Code 官方轻量规则适配层；规则导航本体在 `rule/`。`.claude/` 不维护 commands、workflows、skills 或其他工程本体目录。
