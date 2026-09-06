---
id: "index-status"
title: "CC-RADT 状态"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# CC-RADT 状态

## 当前状态

- 版本：1.1.0
- 阶段：CC-RADT v1.1.0 已在 GitHub 正式发布并设为最新版
- 发布映射与验证：[v1.1.0 发布记录](../tools/release/publications/v1.1.0.md)
- 当前批次：只读研发观察台、运行链路改进和安装包链路已完成
- 初始化策略：已切换为用户主动手动初始化；启动、恢复和普通请求不再自动询问、执行或写入初始化画像

## 当前锁

见 `shared/locks/LOCKS.md`。

## 最近事件

- 主框架：已完成
- Agent 体系：已完成
- 指令体系：已完成
- 核心治理：已完成
- 扩展与工具：已完成
- 结构自检：已完成
- 标准 Markdown 索引：已创建
- CodeGraph 调用索引：已创建
- 需求验收索引：已创建
- CodeGraph MCP 策略：已创建
- 项目初始化脚本：已创建
- CodeGraph 检测脚本：已创建
- 打包脚本：已创建
- 升级脚本：已创建
- 回滚脚本：已创建
- 日志清理脚本：已创建
- MCP 查询脚本：已创建
- MCP 安装脚本：已创建
- Skills 查询脚本：已创建
- Skills 安装脚本：已创建
- 精简版专属自检脚本：已创建
- 第 4-8 节使用方式、设计原则、目录结构、根文件和 Agent 文档结构：已对齐
- `.claude/`：已瘦身为 settings 配置入口
- Agent 本体：已归位到 `agents/<agent>/<agent>.md`
- Agent 主索引：已新增 `agents/index.md`
- 指令说明：已归位到 `tools/commands/ai/`
- 指令主索引：已新增 `tools/commands/index.md`
- 会话恢复材料：已归入 `memory/conversations/`，由 Memory 管控
- ADR 规范：已创建 `security/adr.md`
- ADR 目录：已创建 `project/adr/`
- 初始 accepted ADR：已创建 ADR-0001 到 ADR-0007
- 根 playbook：已扩展为多 Agent 完整协作动作链
- Agent 主文档：已补充 playbook、安全规则、记忆、知识库、Skills、MCP 具体指针
- Shared 工作区：已补充任务执行方案、锁模板、回流模板和 文档关系维护
- Security 模块：已补充任务、锁、状态、回流、工作区、上下文压缩和文档导航管理规则
- 上下文压缩：已补充 Hook 检测脚本、配置示例、提示模板和手动指令
- 指令数量：主工程已更新为 25 个指令文档，安装包保留 23 个运行与维护指令
- Agent 提示词：12 个 Agent 均已建立版本化 system、task、retry 提示词和评测集
- 提示词进化：已建立失败事实采集、根因路由、候选、评测、审批、激活、编译、监控与回滚链路
- 提示词运行边界：Hook 只记录脱敏事实，不直接修改提示词；活动版本只在后续调用或新会话生效
- 提示词命令：已新增状态、进化、差异、评测、激活、回滚和历史 7 个指令
- Rule 按需读取：已新增 `rule/custom/` 自建规则路由、`security/rule-policy.md` 和 `tools/bin/ai-teams-rule-create.mjs`
- Rule 完整覆盖：已包含工程结构与工作流、完整目录、12 个 Agent、任务、项目结构与文件、前端 UI/语法、后端接口/语法、决策、方案、知识、安全、共享工作区、记忆和工具索引
- Agent Rule 最短读取链：12 个 `rule/agents/<agent>.md` 均直接连接任务、项目、共享工作区、安全、自建规则和 `project/index.md`，避免默认全仓扫描
- Rule 初始化写入：项目初始化会生成或刷新 `rule/project/structure.md`、`files.md`、前端 UI/语法、后端接口/语法、决策和方案入口
- Rule 自检门禁：结构自检会校验 12 个 Agent 路由、Rule 创建/刷新脚本、Claude Code 规则适配器、索引图谱和安装包内命令数量
- 文档关系图：已补齐 Agent、shared、security、hooks、commands、documents、memory、playbook 关联
- Agent 职责：已补充 12 个 Agent 的专业能力细化，PD 增强产品经理职责，后端 Agent 增强开发职责
- 全局 playbook：已补充 Lead 全局主 Agent 调用流程和 Mermaid 调用链
- Skills 绑定：已为 12 个 Agent 复制工程内 Skills 副本，并登记到 `skills/registry.json`
- Skills 公开分发：保留 53 个经许可证核验的 Agent-Skill 绑定，第三方来源与许可证登记在 `THIRD_PARTY_NOTICES.md`；未确认再分发授权的副本不进入源码仓库或安装包
- Skills 索引：已创建 `skills/agents/<agent>/index.md` 并更新 `skills/registry.json`
- 知识图谱：已补充 Agent 图谱、记忆图谱、项目图谱、工作空间图谱、Skills 图谱和 标准 Markdown / Claude Code 文件引用规则
- 开发 Agent 知识库：已为四个开发 Agent 建立 `kb/agents/<agent>/index.md` 与 `00-index.md` 到 `05-do-not.md`
- 根 `AGENTS.md`：已删除，入口链统一为 `CLAUDE.md`、`agents/index.md`、`index/INDEX.md` 和 `tools/commands/index.md`
- README：已重写为 CC-RADT 中英文 GitHub 项目介绍；包含快速开始、团队、工作流、记忆、安全治理、提示词、Skills、MCP，并以四张生成图片替换 README Mermaid 流程图
- Git 与版本治理：已新增 `CHANGELOG.md`、贡献指南、提交/PR 模板、`security/version-control-policy.md`、版本报告工具和正式发布记录模板
- 正式包来源记录：打包生成 `RELEASE_RECORD.md`，严格发布模式要求干净 dev 分支、显式版本、Changelog 版本条目、源基线和完整自检
- 安装包打包：已启用 `.claude/ai-teams` 低侵入布局，默认输出根更新为 `$HOME/CC-RADT-dist`
- 安装包验收：已通过包内自检、SHA-256、路径、配置、提示词状态、指令、MCP 和干净运行态复验
- 正式版初始化链路：已改为目标项目根目录执行 `bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write`
- 根目录 `releases/` 旧链路：已取消，主工程不再通过 `releases/` 保存发布产物
- 运行期维护规则：已新增 `security/runtime-maintenance-policy.md`，Doc / Memory / Role / Security-Reviewer 的并行维护职责已纳入 playbook、CLAUDE、Agent 索引和知识图谱
- 并行监督：`shared/supervision/` 已加入 Role 触发式监督行，任务关闭前必须检查 Doc、Memory、Role、Security-Reviewer 的维护结论
- `.claude/settings.json`：已登记 Role 初始化复核与运行期并行监督，保持 12 Agent、默认多 Agent、手动初始化模式和安全规则入口
- MCP 安装包配置：当前 `.mcp.json` 打包后包含 10 个默认 MCP server，并由自检校验
- 路径与内部措辞扫描：当前源工程无本机绝对路径内容残留，当前安装包无本机绝对路径和内部链路措辞命中
- 需求前同事提交同步：`UserPromptSubmit` 已接入 `git-activity-watch`，每次需求进入时以 Git 为辅助增量刷新 `project/change-log.md` 和 `project/context.md`；最多读取 20 条提交元数据和 200 个文件名，不读取 diff、提交正文、历史代码或敏感文件内容，Git 不可用时静默跳过
- Agent 项目变化入口：12 个 Agent 主文档、组件 playbook、专属安全 playbook 和 Claude Code 官方 subagent 定义均已关联 `project/change-log.md`
- Git Hook 回归：已用临时仓库验证另一作者提交可识别为“同事/外部”，文件变化可写入 `project/`，结构自检已纳入该真实回归
- Security 运行态：敏感文件与高风险操作通过 `permissions.deny` 和 PreToolUse Hook 执行；阻断 Hook 已统一使用 Claude Code 规定的退出码 2
- Claude Code 配置：`.claude/settings.json` 已通过官方 JSON Schema 校验；`ai_teams` 仅保存工程元数据，执行约束由官方 settings 字段、Hooks、CLAUDE 导入和 Agent 定义承载
- 四层记忆：L1 会话恢复、L2 共享记忆、L3 Agent 独立记忆、L4 知识库已由 Memory Agent、文件入口与 PreCompact / PostCompact Hook 串联
- Lead 接管：已启用 10 秒心跳状态板；工具失败、权限拒绝、停滞、跑偏、安全、锁或 Owner 冲突会生成接管事件，最多允许一次定向重试
- 初始化验收：无 Git 项目真实 `--write` 回归通过，已写入技术栈、依赖、UI、API、命令、验证、规则、图谱和记忆候选，且不扫描 AI-Teams 本体、不修改业务文件
- 本轮开发记录包含 Java/Maven 消费端根目录自检、手动初始化、Agent / MCP 识别与业务文件零修改验证；正式发布验收单独记录
- 初始化扫描清洁度：初始化脚本与 Rule 刷新器均排除 `target/`、`build/`、`dist/`、`out/` 等构建产物，敏感规则不再误判正常鉴权源码
- CC Switch 实机链路：Claude Code `2.1.140` 已识别 12 个项目 Agent；Lead 自主选择 `WF-06`，并行调用 `dev-backend-systems` 与 `qa` 后正常汇总，未使用 `general-purpose`
- Lead 提示词：system prompt 已按候选、评测、审批、激活和编译流程升级到 `1.0.1`，每次 Agent 派发前强制使用任务提示词渲染器
- Lead 启动入口：已移除会抢占用户真实需求的 `initialPrompt`，保留 `settings.json` 默认 `agent: lead`
- 心跳准确性：Lead 等待不再创建子 Agent 状态；30 秒静默仅进入 `idle-review`；Agent 完成后清理接管标记
- 敏感 Hook：已使用精确敏感文件名/目录匹配，并新增正常鉴权源码放行回归
- Claude 入口：源工程仅保留根 `CLAUDE.md`；安装布局不创建第二份同名入口，通过 `.claude/settings.json`、`.claude/agents/`、`.claude/rules/` 和 `index/ENTRY.md` 接入工程大脑
- 当前正式安装包：[CC-RADT v1.1.0 Release](https://github.com/Jia0201/CC-RADT/releases/tag/v1.1.0)
- 本轮安装包回归：975 个文件、23 个运行指令、12 个 Agent、10 个 MCP、36 个活动提示词；除 checksum 自身外 974 个文件的 SHA-256 校验通过
- 提示词系统报告：`logs/audit/prompt-evolution-system-report-20260719.md`

## 下一阶段

按以下顺序继续推进:

1. 继续按后续需求修主工程本体。
2. 精简版、OpenCode 版本、Codex 版本后续单独收敛。
3. 根据真实项目试安装反馈继续增强初始化识别能力。

## 当前限制

- 当前只启用 formal 正式版打包链路。
- 精简版、OpenCode 版本、Codex 版本后续继续收敛。



























<!-- AI-TEAMS:index-stale:BEGIN -->
## 索引复核状态

- 时间：2026-06-14 19:12:39
- 状态：本轮 Security、Hooks、Memory、初始化、CLAUDE 入口、Lead 心跳和安装包索引已复核。
- 结果：关键入口、图谱指针和运行态自检一致。

<!-- AI-TEAMS:index-stale:END -->






















































<!-- AI-TEAMS:auto-status-event:BEGIN -->
## 最近自动状态

- 时间：2026-08-09 23:00:00
- 事件：README 图示、Git/版本治理和正式包来源记录链路已完成验证。

<!-- AI-TEAMS:auto-status-event:END -->
