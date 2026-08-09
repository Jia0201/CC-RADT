---
id: "security-runtime-maintenance-policy"
title: "运行期维护规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 运行期维护规则

本文件定义 AI-Teams 在真实软件项目中持续保持“活文档”的规则。索引、图谱、项目文档、记忆和 Agent 指引必须随任务执行、文件变化和项目理解变化同步更新，不能只在初始化时生成一次。

## 1. 目标

1. 让 `project/` 随目标项目开发持续变新。
2. 让 `rule/`、`index/`、`project/graph.md`、`kb/graph.md` 和 标准 Markdown 链接持续指向正确文件。
3. 让 `memory/` 在对话中断、上下文压缩和任务恢复时可用。
4. 让 Agent 职责、MCP、Skills、知识库、记忆和 playbook 指针随工程变化同步更新。
5. 让 `shared/` 中的任务、方案、锁、状态和交接成为真实协作入口，而不是孤立状态板。

## 2. 触发条件

发生以下事件时，必须触发运行期维护检查：

| 触发事件 | 主要维护者 | 必须检查 |
|---|---|---|
| 项目初始化写入 `project/` | Doc | `rule/project/`、`project/index.md`、`project/context.md`、`project/project-profile.md`、`project/graph.md`、`project/rules/index.md` |
| 新需求、方案、任务单或执行方案产生 | Doc / Memory / Role | `project/requirements/`、`project/plans/`、`shared/task-plan.md`、Agent 读取指引 |
| 新建、移动、删除或重命名工程文件 | Doc / Role | `rule/catalog/`、`rule/agents/`、`index/FILES.md`、`index/INDEX.md`、`kb/graph.md`、相关 Agent 指针 |
| Agent 职责、目录、Skills、MCP 或 playbook 变化 | Role / Doc | `agents/index.md`、`agents/<agent>/`、`security/agent-playbooks/`、`skills/registry.json`、`mcp/registry.json` |
| 目标项目规则、验证方式、命令、架构或风险变化 | Doc | `project/rules/index.md`、`project/commands.md`、`project/architecture.md`、`project/verification.md`、`project/risks.md` |
| 页面布局、视觉规范、组件模式或交互状态变化 | Frontend Dev / Doc / QA | `project/ui-style.md`、`project/verification.md`、`project/graph.md` |
| API、DTO、Schema、字段、枚举或错误结构变化 | Dev / QA / Doc | `project/api-contracts.md`、`shared/contracts/`、`project/verification.md`、`project/graph.md` |
| 每次需求进入、Git 分支/HEAD/upstream 或工作区变化 | Doc / Lead / Dev / QA | `project/change-log.md`、`project/context.md`、`shared/events/git-state.json`、`logs/hook/`；按新增提交文件分类刷新项目画像，不读取 diff 或历史代码 |
| QA 发现缺陷模式或验收缺口 | Doc / Memory | `project/verification.md`、`project/risks.md`、知识候选、记忆候选 |
| 上下文过长、任务中断或恢复材料产生 | Memory | `memory/context-compression.md`、`memory/conversations/`、`memory/archive/index.md` |
| 重复出现的需求模式或解决方案 | Doc / Memory | 知识候选、长期恢复记忆候选，不能直接写入动作规则 |
| 安全、锁、删除、敏感文件或越界风险变化 | Security-Reviewer / Doc | `security/` 规则、`project/risks.md`、`shared/escalations/` |

## 3. 职责分工

### 3.1 Doc

Doc 是运行期文档网络维护者。

Doc 必须：

1. 并行维护 `project/`，让目标项目画像、规则、命令、验证、架构、风险和图谱随任务变化更新。
2. 维护 `rule/`、`index/INDEX.md`、`index/FILES.md`、`index/NAVIGATION.md`、`project/graph.md` 和 `kb/graph.md` 的链接完整性。
3. 在新增文件后补充合适的索引入口；在移动/删除文件后清理旧链接。
4. 对 标准 Markdown 链接、必要元数据和关系图关系做一致性检查。
5. 将可复用技术知识放入知识候选或正式 KB；动作规则仍归 `security/`、`playbook.md`、`shared/` 管理。
6. 任务关闭前向 Lead 提供“项目文档/索引/图谱已更新或无需更新”的结论。
7. 每次需求开始时读取 `project/change-log.md`；UI、API、依赖、测试、数据库、安全或文档关系有变化时，向对应 Agent 收集事实后更新相关 `project/` 文件。

Doc 不得：

1. 把任务流水账写进 `project/`。
2. 把动作规则写进 KB。
3. 把未验证的猜测写成项目事实。
4. 替代 Memory 写正式记忆。

### 3.2 Memory

Memory 是运行期恢复能力维护者。

Memory 必须：

1. 并行判断任务中是否产生长期恢复所需事实、用户偏好、关键决策或上下文恢复材料。
2. 在写入记忆、处理候选、生成恢复点或 Hook 提示后，检查是否需要上下文压缩或归档。
3. 更新 `memory/index.md`、`memory/MEMORY.md`、`memory/agents/<agent>/MEMORY.md`、`memory/conversations/` 和 `memory/archive/index.md` 的关系。
4. 对过期或被替代的记忆做“保留历史原因/指向新事实”的处理，不主动删除。
5. 将项目事实交给 Doc 合并到 `project/`，只把长期恢复所需的非敏感事实写入记忆。

Memory 不得：

1. 保存敏感文件内容。
2. 把压缩摘要直接当正式记忆。
3. 把项目事实和 KB 内容混写到记忆里。
4. 把 `agents/memory/memorys/` 当作记忆数据目录；该目录只是 Memory Agent 指引。正式记忆数据目录是 `memory/`，Memory 自身长期记忆入口是 `memory/agents/memory/MEMORY.md`。

### 3.3 Role

Role 是运行期 Agent 指引维护者。

Role 必须：

1. 在 Agent 职责、文件结构、MCP、Skills、KB、Memory、playbook 或项目管理职责变化后更新 Agent 文档。
2. 维护 `agents/index.md`、`agents/<agent>/<agent>.md` 和组件文件中的指针完整性。
3. 检查新增规则或流程是否需要更新 Agent 读取顺序、禁止事项、交接规则和协作边界。
4. 发现 Agent 多次误用 `project/`、`memory/`、`kb/`、`shared/` 或 `security/` 时，提出角色修订。
5. 任务关闭前向 Lead 提供“Agent 指引已更新或无需更新”的结论。

Role 不得：

1. 接管 Lead 调度。
2. 绕过 Lead 修改核心 Agent 边界。
3. 把角色规则写入 KB 或记忆。

## 4. 实时维护动作链

每次触发维护检查时，按以下动作链执行：

1. **识别事件**：确认是项目事实、索引变化、记忆变化、Agent 指引变化、规则变化、风险变化还是图谱变化。
2. **确定 Owner**：按 [file-ownership](./file-ownership.md) 和本文件分配 Doc、Memory、Role 或 Security-Reviewer。
3. **检查锁**：涉及共享状态或多文件写入时，按 [lock-policy](./lock-policy.md) 登记锁。
4. **更新本体文件**：先更新事实源文件，再更新索引和图谱。
5. **更新索引**：先运行 `node tools/bin/ai-teams-rule-refresh.mjs --target <目标项目> --write` 刷新 `rule/`，再检查 `index/INDEX.md`、`index/FILES.md`、相关目录索引和 Agent 指针。
6. **更新图谱**：项目事实更新 `project/graph.md`；工程知识关系更新 `kb/graph.md`；路径与导航约定更新 `index/NAVIGATION.md`。
7. **更新状态**：按 [state-policy](./state-policy.md) 更新 `shared/task-plan.md`、`shared/pipeline-status.md` 或 `shared/supervision/current.md`。
8. **写交接**：在 `shared/handoffs/` 或任务日志中写清来源、更新文件、跳过项和后续风险。
9. **关闭检查**：Lead 关闭任务前确认 Doc、Memory、Role 相关维护项已完成、跳过或回流。

## 5. 索引更新最低要求

新增或更新文件后，Doc/Role 至少检查：

| 变化类型 | 必查文件 |
|---|---|
| 新增工程入口、规则、工具、指令 | `rule/engineering/`、`rule/tools/`、`rule/catalog/`、`index/ENTRY.md`、`index/INDEX.md`、`index/FILES.md`、`kb/graph.md` |
| 新增 Agent 文件或调整 Agent 职责 | `rule/agents/`、`agents/index.md`、`agents/<agent>/`、`security/agent-playbooks/<agent>.md`、`kb/graph.md` |
| 新增项目事实或初始化结果 | `rule/project/`、`project/index.md`、`project/context.md`、`project/PROJECT.md`、`project/graph.md` |
| 新增或变更 UI / 接口契约事实 | `project/ui-style.md`、`project/api-contracts.md`、`shared/contracts/index.md`、`project/graph.md` |
| 新增记忆或压缩材料 | `memory/index.md`、`memory/context-compression.md`、`memory/archive/index.md` |
| 新增知识库文件 | `kb/index.md`、`kb/agents/index.md`、`kb/graph.md` |
| 新增 MCP 或 Skills | `mcp/index.md`、`skills/index.md`、对应 Agent 指针、registry |
| 新增 Hook/Cron/Tools | `hooks/index.md`、`cron/schedules.md`、`tools/commands/index.md` 或 `tools/` 索引 |
| 安全、锁、状态或共享协议变化 | `rule/security/`、`rule/shared/`、`security/index.md`、`shared/index.md` |
| 记忆、恢复或压缩入口变化 | `rule/memory/`、`memory/index.md`、`memory/context-compression.md` |

## 6. 任务关闭门禁

Lead 关闭非平凡任务前必须确认：

1. Doc 已处理 `project/`、索引、图谱或明确说明无需更新。
2. Memory 已处理记忆候选、上下文压缩、恢复点或明确说明无需更新。
3. Role 已处理 Agent 指引变化或明确说明无需更新。
4. Security-Reviewer 已处理越界、锁、删除、敏感文件和高风险动作检查。
5. `shared/supervision/current.md` 中相关状态不再是 `pending`。
6. 任何 `blocked` 状态必须回流，不得直接关闭。

## 7. 禁止事项

1. 不允许只修改正文而不检查索引和图谱。
2. 不允许只写日志而不更新项目事实或交接。
3. 不允许把 `shared/task-plan.md`、`shared/pipeline-status.md` 当成静态示例。
4. 不允许把 KB 当动作规则存放处。
5. 不允许把记忆归档理解为删除；归档是保留历史、降低干扰和指向新事实。
6. 不允许在未初始化目标项目时假设项目结构。
