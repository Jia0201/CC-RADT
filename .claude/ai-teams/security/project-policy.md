---
id: "security-project-policy"
title: "项目管理规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 项目管理规则

`project/` 是目标项目管理空间，用于让 AI-Teams 在持续执行中越来越了解目标项目。它不是 AI-Teams 工程本体的发布空间，也不替代 `memory/`、`kb/`、`logs/` 或 `shared/`。

Doc 是 `project/` 的运行期文档管理者。Lead 负责调度、决策和关闭验收，不直接承担 `project/` 的长期维护；PD、Plan-PM、Dev、QA、Memory、Security-Reviewer 按职责提供来源材料、验证结论、风险发现和候选沉淀。

## 1. 工程与项目边界

| 名称 | 含义 | 典型路径 |
|---|---|---|
| Harness 工程 | AI-Teams 工程大脑，包含 Agent、规则、工具、记忆和知识库 | 主工程根目录或 `.claude/ai-teams/` |
| 目标项目 | 用户真正要分析、修改、测试和交付的业务项目 | 初始化时由 `--target` 指定 |

Claude Code 每次接收需求时都必须区分这两个路径。无法判断目标项目路径时，Lead 先询问用户，不自行猜测。

## 1.1 项目优先与 Git 辅助原则

AI-Teams 以目标项目当前文件、用户当前需求、已确认项目文档和 `project/` 当前事实为主要依据。Git 只提供辅助环境信号，以及每次需求进入时有限的增量提交元数据和变更文件名。

必须遵守：

1. 目标项目没有 Git 时，初始化、规划、开发、QA 和文档治理都必须继续执行，不得失败。
2. Git 命令不可用、执行失败、权限不足或目标项目不是 Git 仓库时，默认跳过 Git 辅助检查。
3. 初始化扫描不得读取完整提交历史、提交正文、历史代码或大范围 diff；需求前同步最多读取 20 条增量提交的哈希、作者、时间、标题和 200 个变更文件名。
4. PD 和 Plan-PM 不得把 Git 历史当作需求、优先级、任务依赖或项目事实来源，除非用户明确要求分析 Git 历史。
5. `UserPromptSubmit` Hook 每次需求进入时检查新增提交和 upstream；已合入提交刷新 `project/change-log.md` 与 `project/context.md`，远端待同步提交不得当作当前项目事实。
6. 同步只允许执行非交互、短超时的 `git fetch --quiet --prune`；认证、网络、权限或 Git 命令失败时立即跳过，不得阻塞用户需求。
7. Doc 根据变更文件分类复核 `project/ui-style.md`、`project/api-contracts.md`、`project/dependencies.md`、`project/verification.md`、`project/architecture.md` 和 `project/risks.md`；不能仅凭提交标题改写项目事实。

## 2. project/ 管理职责

| 角色 | 职责 |
|---|---|
| Doc | 管理 `project/` 正式文档、项目索引、项目图谱、项目规则登记、项目状态、项目风险摘要和 标准 Markdown 链接 |
| Lead | 确认 harness 路径、目标项目路径、任务是否需要初始化、是否需要 Doc/Memory/Security 并行监督，关闭前检查是否完成项目更新 |
| PD | 提供需求、业务边界、用户角色、验收口径和需求变更来源 |
| Plan-PM | 提供执行计划、里程碑、依赖、锁范围和进度来源 |
| Dev | 提供代码结构、技术栈、实现约束、模块发现和命令发现，先写交接，不直接写正式项目事实 |
| QA | 提供验证策略、测试结果、缺陷模式和验收缺口 |
| Memory | 从项目执行中筛选长期恢复所需事实，不替代 Doc 写 `project/` |
| Security-Reviewer | 持续检查越界、敏感文件、删除、锁、命令、权限和安全风险，风险事实交给 Doc 合并到 `project/risks.md` |

### 2.1 常驻并行监督

非平凡项目任务启动后，Lead 必须让以下 Agent 以并行监督方式参与或至少进入状态板：

1. Doc：实时维护 `project/`、项目图谱、项目日志入口和文档一致性。
2. Memory：实时判断哪些材料应进入记忆候选、恢复点或上下文压缩。
3. Security-Reviewer：实时检查 Agent 是否越界、是否违反安全规则、是否存在锁冲突或敏感风险。

这三个 Agent 不替代执行 Agent 的代码、需求、计划或 QA 工作；它们负责让项目事实、记忆候选和安全边界在执行过程中持续闭环。

## 3. 初始化前规则

如果 `project/project-profile.md` 或 `project/context.md` 显示“尚未初始化目标项目”，且用户需求涉及项目分析、开发、测试、重构、审计、升级或文档治理，Lead 必须先执行以下动作：

1. 询问用户目标项目路径。
2. 确认 AI-Teams harness 工程路径。
3. 引导或执行初始化：

```bash
bash tools/bin/ai-teams-init-project.sh --target <目标项目路径> --write
```

低侵入布局下应在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

初始化只写入 AI-Teams 管理文件，不修改目标项目业务代码，不读取敏感文件内容。

初始化脚本只提供扫描辅助。初始化完成后，Lead 必须推动 Agent 介入复核：

1. Doc 复核并扩写 `project/PROJECT.md`、`project/context.md`、`project/project-profile.md`、`project/architecture.md`、`project/commands.md`、`project/dependencies.md`、`project/graph.md` 和 `project/rules/index.md`。
2. PD 复核需求入口、业务目标和已有需求材料。
3. Plan-PM 复核执行计划入口、项目阶段和依赖关系。
4. 两个前端 Dev 复核项目 UI 组件库、设计令牌、颜色、字体、间距、布局、响应式、页面状态和既有交互模式，并将来源交给 Doc 更新 `project/ui-style.md`。
5. 两个后端 Dev 复核目录结构、路由、Controller、Service、DTO、Schema、Model、OpenAPI/Proto、数据库迁移和接口契约入口，并将来源交给 Doc 更新 `project/api-contracts.md`。
6. QA 复核验证命令、验收方式、前后端字段契约、加载态、空态、错误态和边界值缺口。
7. Security-Reviewer 复核导入规则、敏感边界、删除风险和权限风险。
8. Memory 判断初始化材料中是否有长期恢复所需的非敏感事实；UI/API 自动扫描结果不得未经复核直接写成长期记忆。

## 4. 运行期项目更新规则

非平凡任务执行前，Lead / PD / Plan-PM / Dev / QA / Doc / Memory / Security-Reviewer 必须读取：

- `project/index.md`
- `project/PROJECT.md`
- `project/context.md`
- `project/project-profile.md`
- `project/imported-rules.md`
- `project/architecture.md`
- `project/ui-style.md`
- `project/api-contracts.md`
- `project/commands.md`
- `project/verification.md`
- `project/risks.md`
- `project/graph.md`
- `project/rules/index.md`

任务执行中发现以下信息时，必须在交接、任务单或日志中提出项目更新建议，由 Doc 按来源和 Owner 规则合并到对应文件：

| 信息类型 | 写入位置 | 主要来源 | 正式维护 |
|---|---|---|
| 目标项目根目录、安装形态、当前阶段 | `project/context.md` | Lead / Doc | Doc |
| 项目画像、技术栈、框架、包管理器 | `project/project-profile.md`、`project/stack.md` | 初始化脚本 / Doc / Dev | Doc |
| 业务目标、用户角色、功能范围、验收口径 | `project/requirements/` | PD | Doc 维护索引，PD 维护需求来源 |
| 任务拆解、实施顺序、依赖、锁范围 | `project/plans/` | Plan-PM | Doc 维护索引，Plan-PM 维护计划来源 |
| 架构入口、模块边界、关键目录、运行方式 | `project/architecture.md` | Doc / Dev / QA | Doc |
| UI 风格、布局、组件和页面状态 | `project/ui-style.md` | Frontend Dev / QA | Doc |
| 接口契约来源、字段模型和对接缺口 | `project/api-contracts.md`、`shared/contracts/` | PD / Plan-PM / Dev / QA | Doc 维护项目索引，契约执行按 Security 规则 |
| 构建、测试、lint、type-check、启动命令 | `project/commands.md` | Dev / QA / Plan-PM | Doc |
| 验证策略、已知缺口、人工验收方式 | `project/verification.md` | QA | Doc，QA 提供验证事实 |
| 敏感边界、高风险模块、删除风险、权限风险 | `project/risks.md` | Security-Reviewer | Doc，Security-Reviewer 提供风险结论 |
| 目标项目规则、其他 AI 工具规则入口 | `project/imported-rules.md` | 初始化脚本 / Security-Reviewer / Doc | Doc |
| 升级状态、导入规则和验证口径等项目规则 | `project/rules/index.md` 及其关联文件 | Doc / QA / Security-Reviewer / Lead | Doc |
| 项目知识图谱、节点和关系 | `project/graph.md` | Doc / 全体 Agent 交接 | Doc |

Dev、QA、PD、Plan-PM、Security-Reviewer 不把临时理解直接写成正式项目事实；它们必须在 `shared/handoffs/`、任务单、执行方案或验证报告中列出“项目发现”，由 Doc 审核、去重、标明来源后合并。

## 5. project/ 规则文件

以下文件属于目标项目规则、状态规则或登记规则，由 Doc 维护，安全或专业 Agent 提供来源：

| 文件 | 类型 | 来源/校验 |
|---|---|---|
| `project/imported-rules.md` | 已有项目规则吸收区 | Security-Reviewer 校验敏感边界，Doc 合并 |
| `project/verification.md` | 项目验证规则与验收口径 | QA 校验，Doc 合并 |
| `project/upgrade-state.md` | 项目升级状态和升级保护规则 | Lead 决策，Security-Reviewer 校验，Doc 合并 |
| `project/rules/index.md` | 项目规则索引 | Doc 管理 |

这些文件不是 KB。它们记录目标项目当前必须遵守的规则和状态；只有被验证为跨项目可复用的知识，才由 Doc 另行沉淀到 `kb/`。

## 6. 写入质量

写入 `project/` 时必须满足：

1. 只写目标项目事实、规则、约束、验证方式和项目画像。
2. 明确来源：初始化扫描、用户确认、代码验证、QA 结果或已有项目文档。
3. 不写敏感文件内容。
4. 不写未经确认的猜测；猜测只能作为“待确认”。
5. 不把任务过程流水写入 `project/`，过程写入 `logs/` 或 `shared/`。
6. 不把可复用知识写入 `project/` 代替 `kb/`。
7. 不把长期恢复偏好写入 `project/` 代替 `memory/`。

## 7. 任务关闭检查

Lead 关闭非平凡任务前必须检查：

- 是否产生新的项目事实。
- Doc 是否已处理或明确跳过 `project/` 更新。
- 是否需要更新 `project/context.md`。
- 是否需要补充需求、计划、命令、验证、架构或风险。
- 是否需要更新 UI 画像或接口契约索引。
- 是否需要 Doc 更新 `project/graph.md` 和 `kb/graph.md` 的链接关系。
- 是否需要 Memory 写入长期恢复信息。
- 是否需要 Security-Reviewer 将新的风险或越界发现交给 Doc 合并。

如果没有项目更新，也必须在交接或最终报告中说明“无新增项目管理更新”。
