---
id: "index-commands"
title: "指令索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# 指令索引

| No. | 指令能力 | 文件 |
|---:|---|---|
| 1 | 一键打包指令（正式版） | `tools/commands/ai/package-formal.md` |
| 2 | 一键打包指令（精简版） | `tools/commands/ai/package-simplify.md` |
| 3 | 项目初始化 | `tools/commands/ai/init-project.md` |
| 4 | 外部升级器操作说明（工程内不执行） | `tools/commands/ai/upgrade-existing.md` |
| 5 | 多余日志清除指令 | `tools/commands/ai/logs-clean.md` |
| 6 | 自学习指令 | `tools/commands/ai/self-learn.md` |
| 7 | MCP 查询指令 | `tools/commands/ai/mcp-list.md` |
| 8 | Skills 查询指令 | `tools/commands/ai/skills-list.md` |
| 9 | 安装 Skills 指令 | `tools/commands/ai/skills-install.md` |
| 10 | 安装 MCP 指令 | `tools/commands/ai/mcp-install.md` |
| 11 | 查询 Hooks 指令 | `tools/commands/ai/hooks-list.md` |
| 12 | 查询定时任务指令 | `tools/commands/ai/cron-list.md` |
| 13 | 查询所有 Agent，Agent 状态指令 | `tools/commands/ai/agents-status.md` |
| 14 | 回滚指令 | `tools/commands/ai/rollback.md` |
| 15 | 读取记忆指令 | `tools/commands/ai/memory-read.md` |
| 16 | 刷新记忆指令 | `tools/commands/ai/memory-refresh.md` |
| 17 | 上下文压缩指令 | `tools/commands/ai/context-compact.md` |
| 18 | 自建规则创建指令 | `tools/commands/ai/rule-create.md` |
| 19 | 提示词状态 | `tools/commands/ai/prompt-status.md` |
| 20 | 提示词进化候选 | `tools/commands/ai/prompt-evolve.md` |
| 21 | 提示词差异 | `tools/commands/ai/prompt-diff.md` |
| 22 | 提示词评测 | `tools/commands/ai/prompt-eval.md` |
| 23 | 提示词激活 | `tools/commands/ai/prompt-activate.md` |
| 24 | 提示词回滚 | `tools/commands/ai/prompt-rollback.md` |
| 25 | 提示词历史 | `tools/commands/ai/prompt-history.md` |

## 实现状态

当前 25 个指令文档已存在，其中以下核心运维指令已具备最小可执行脚本：

| 指令 | 可执行脚本 | 状态 |
|---|---|---|
| 项目初始化 | `tools/bin/ai-teams-init-project.sh` | 可生成扫描报告并合并更新项目文档、索引和记忆 |
| CodeGraph 状态检测 | `tools/bin/ai-teams-codegraph-status.sh` | 可检测 CLI、`.codegraph/` 和写入索引 |
| 一键打包指令（正式版） | `tools/bin/ai-teams-package.sh formal --install-layout claude-subdir --output <输出目录> --verify` | 已启用，生成 `.claude/ai-teams` 低侵入安装包 |
| 一键打包指令（精简版） | `tools/bin/ai-teams-package.sh simplify` | 后续继续收敛 |
| 外部升级器操作说明 | `tools/bin/ai-teams-upgrade.sh` | 退役入口，仅中文说明、零写入；不支持 dry-run 或 apply |
| 回滚指令 | `tools/bin/ai-teams-rollback.sh` | 支持快照列表、回滚计划和显式确认 apply |
| 多余日志清除指令 | `tools/bin/ai-teams-logs-clean.sh` | 支持计划、归档和普通日志清理 |
| MCP 查询指令 | `tools/bin/ai-teams-mcp-list.sh` | 可查询共享 MCP、Agent MCP 和 CodeGraph 状态 |
| 安装 MCP 指令 | `tools/bin/ai-teams-mcp-install.sh` | 可受控写入 MCP registry 和元数据，不自动运行未知第三方安装 |
| Skills 查询指令 | `tools/bin/ai-teams-skills-list.sh` | 可查询共享 Skills 和 Agent Skills |
| 安装 Skills 指令 | `tools/bin/ai-teams-skills-install.sh` | 可从本地 Skill 目录复制到工程内 `skills/agents/<agent>/<skill>/` 或 `skills/shared/<skill>/` 并更新 registry |
| 上下文压缩指令 | `tools/bin/ai-teams-context-compact.sh` | 可生成会话恢复摘要，不直接写正式记忆 |
| 自建规则创建指令 | `tools/bin/ai-teams-rule-create.mjs` | 可创建 `rule/custom/` 路由文档并刷新自建规则索引 |
| 提示词状态 / 差异 / 历史 | `tools/bin/ai-teams-prompt-status.mjs` 等 | 只读检查活动版本、候选、哈希、编译同步和历史 |
| 提示词渲染 / 编译 | `tools/bin/ai-teams-prompt-render.mjs`、`tools/bin/ai-teams-prompt-compile.mjs` | 生成结构化 task prompt，并将活动 system prompt 编译到官方 Agent 入口 |
| 提示词进化 / 评测 / 激活 / 回滚 | `tools/bin/ai-teams-prompt-evolve.mjs` 等 | 候选、回归评测、审批、原子激活和上一版本回滚 |

仍待实现：Hook 与编辑器事件深度绑定、自学习建议生成的自动化脚本、未知第三方 MCP / Skills 的人工审查流程增强。

## 索引更新规则

- 指令新增或修改后更新本文件。
- MCP / Skills 安装后更新 `index/AGENTS.md`、`mcp/registry.json` 或 `skills/registry.json`。
- CodeGraph 状态变化后更新 `index/CODEGRAPH.md` 和 `index/FILES.md`。
