---
id: "security-file-ownership"
title: "文件所有权"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 文件所有权

文件所有权用于明确写入边界，不是复杂权限系统。跨 Owner 修改必须有任务单、执行方案或 Lead 明确路由。

## 根入口

| 路径 | Owner | 写入规则 |
|---|---|---|
| `CLAUDE.md` | Lead | 主工程短入口，只导入 `index/ENTRY.md`；安装包不创建或覆盖目标项目的 `CLAUDE.md` |
| `index/ENTRY.md` | Lead / Doc | AI-Teams 可移植入口地图，保持短小并使用标准 Markdown 路径 |
| `.claude/settings.json` | Security-Reviewer | 只保存 Claude Code 官方配置、强制权限与 Hook；Lead 提出调度需求，Security-Reviewer 复核写入 |
| `.claude/settings.local.example.json` | Security-Reviewer | 只保存官方本地配置示例，不保存真实密钥或 AI-Teams 规则正文 |
| `.claude/agents/` | Role | Claude Code 官方 Agent 入口；Security-Reviewer 复核工具和权限边界 |
| `.claude/rules/` | Doc / Security-Reviewer | Claude Code 官方规则适配层；只写轻量路由和 `paths` 作用域，不复制规则本体 |

## Agent 与规则

| 路径 | Owner | 写入规则 |
|---|---|---|
| `agents/` | Role | Agent 本体、职责、组件指针 |
| `agents/index.md` | Role / Lead | Agent 团队索引 |
| `agents/*/playbook.md` | Role / Security-Reviewer | 只作为 playbook 指针 |
| `playbook.md` | Lead / Security-Reviewer | 多 Agent 动作链入口 |
| `security/` | Security-Reviewer | 安全规则和动作规则本体 |
| `security/agent-playbooks/` | Security-Reviewer / Role | Agent 专属动作规范 |
| `rule/` | Doc / Role | Doc 管目录、任务、项目、知识、安全、共享、记忆和工具路由；Role 管 `rule/agents/` |
| `rule/catalog/` | Doc | AI-Teams 非敏感目录和文件完整索引，由刷新脚本生成 |
| `rule/project/` | Doc / 专业 Agent | 目标项目结构、文件、前端、UI、后端、接口、决策和方案路由；专业 Agent 提供事实 |
| `rule/agents/` | Role | 12 个 Agent 的最小读取集合、写入边界和能力入口 |

## 工作区与状态

| 路径 | Owner | 写入规则 |
|---|---|---|
| `shared/` | Lead | 工作区总入口 |
| `shared/tasks/` | Lead / Plan-PM | 任务单和执行方案 |
| `shared/handoffs/` | 各 Agent | 阶段交接，追加式写入 |
| `shared/broadcasts/` | Lead / Security-Reviewer / Doc / Memory | 多 Agent 广播 |
| `shared/decisions/` | Lead | 当前协作取舍 |
| `shared/escalations/` | Lead / Security-Reviewer | 回流、升级、resolved 归档 |
| `shared/locks/` | Lead / Security-Reviewer | 锁登记和锁模板 |
| `shared/task-plan.md` | Plan-PM / Lead | 实时任务计划状态板 |
| `shared/pipeline-status.md` | Lead | 实时 Agent 流水线状态板 |
| `shared/supervision/` | Lead | 并行监督、10 秒心跳和接管状态；Hook 可原子刷新运行态 |
| `shared/events/` | 各 Agent / Hook 追加 | 追加式状态、失败和接管事件，不回写他人事件 |

## 记忆、知识与项目

| 路径 | Owner | 写入规则 |
|---|---|---|
| `memory/` | Memory | 正式记忆、候选记忆、会话恢复材料 |
| `memory/MEMORY.md` | Memory | 共享正式记忆 |
| `memory/agents/*/MEMORY.md` | Memory | Agent 可提出候选和来源，正式记忆仍由 Memory 筛选写入 |
| `kb/` | Doc | 知识库、候选知识和知识图谱 |
| `kb/graph.md` | Doc | 知识图谱关系入口 |
| `project/` | Doc | 目标项目管理空间、项目事实、项目状态、项目规则和项目图谱 |
| `project/index.md` | Doc | 项目管理索引 |
| `project/PROJECT.md` | Doc | 目标项目管理入口 |
| `project/context.md` | Doc | 目标项目路径、安装形态、当前阶段和运行期上下文 |
| `project/project-profile.md` | Doc / PD | 初始化项目画像和项目基本信息；PD 提供业务画像来源 |
| `project/imported-rules.md` | Doc / Security-Reviewer | 目标项目已有 AI/编码规则吸收区；Security 校验敏感边界 |
| `project/rules/` | Doc / Security-Reviewer | 目标项目规则索引；规则来源由对应 Agent 提供 |
| `project/requirements/` | PD / Doc | 需求材料、业务边界、验收口径；Doc 维护项目索引和图谱链接 |
| `project/plans/` | Plan-PM / Doc | 项目计划、里程碑、依赖和执行顺序；Doc 维护项目索引和图谱链接 |
| `project/architecture.md` | Doc | 架构入口、模块边界、文档入口 |
| `project/commands.md` | Doc / QA / Plan-PM | 构建、测试、lint、type-check、启动命令；QA/PM 提供来源 |
| `project/verification.md` | Doc / QA | 验证策略、验收方式和缺口；QA 提供验证事实 |
| `project/dependencies.md` | Doc / Dev / QA | 依赖入口和依赖线索，不读取敏感内容；Dev/QA 提供来源 |
| `project/risks.md` | Doc / Security-Reviewer | 风险、敏感边界、删除风险、权限风险；Security 提供风险结论 |
| `project/upgrade-state.md` | Doc / Lead / Security-Reviewer | 升级状态和升级保护规则；Lead 决策，Security 校验 |
| `index/NAVIGATION.md` | Doc | 标准 Markdown 路径、索引和关系图维护规范 |
| `project/graph.md` | Doc | 目标项目知识图谱 |
| `project/adr/` | Doc / Lead | 长期结构性决策记录；Lead 决策，Doc 维护 |

## 工具与扩展

| 路径 | Owner | 写入规则 |
|---|---|---|
| `tools/commands/` | Lead / Doc | 指令说明 |
| `tools/bin/` | Lead / Security-Reviewer | 可执行脚本 |
| `hooks/` | Security-Reviewer / Lead | Hook 说明、脚本、配置示例、模板 |
| `cron/` | Lead / Security-Reviewer | 定时任务说明 |
| `templates/` | Doc | 模板 |
| `skills/` | Doc / Role | Skills registry 和 Agent Skills 指针 |
| `mcp/` | Security-Reviewer / Doc | MCP registry、Agent MCP、CodeGraph 文档 |
| `index/` | Doc / Lead | 工程索引 |
| `logs/` | 各 Agent 追加，Doc 管理索引 | 日志只追加，Doc 维护日志入口和归档索引 |

## 跨 Owner 写入规则

1. 先检查任务单和执行方案。
2. 再检查 `shared/locks/LOCKS.md`。
3. 涉及受保护范围时登记锁。
4. 写入后更新相关索引、状态板或交接。
5. 无法判断 Owner 时交给 Lead、Doc 和 Security-Reviewer。

## Hook 执行方式

- 敏感文件与已确认的活动锁冲突使用技术阻断。
- 当前 Agent 与目录 Owner 不一致时，PreToolUse Hook 返回 `ask`，要求人工确认任务路由、Owner 和锁；不是用普通退出码伪装阻断。
- Owner 一致且没有活动锁冲突时允许写入，不要求每个文件都先创建独占锁。
- 多 Agent 同时写同一范围时必须登记锁；`shared/locks/LOCKS.md` 本身不能被“先有锁才能写锁”的循环规则阻断。

## project/ 写入规则

- `project/` 记录目标项目事实，不记录任务流水。
- Dev / QA / PD / Plan-PM / Security-Reviewer 发现稳定项目事实时，先写入交接、任务单、执行方案或验证记录，由 Doc 合并到 `project/`。
- 初始化写入由 `tools/bin/ai-teams-init-project.sh` 执行，运行期写入按 [project-policy](./project-policy.md) 处理。
- 如果 AI-Teams harness 工程路径和目标项目路径不清楚，Lead 必须先询问用户，不得自行猜测。
