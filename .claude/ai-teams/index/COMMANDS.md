---
id: "index-commands"
title: "指令索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---

# 指令索引

安装包包含 23 个运行与维护指令，不包含打包安装包或精简安装包的发布维护指令。

| No. | 指令能力 | 文件 |
|---:|---|---|
| 1 | 项目初始化 | tools/commands/ai/init-project.md |
| 2 | 外部升级器操作说明（工程内不执行） | tools/commands/ai/upgrade-existing.md |
| 3 | 多余日志清除指令 | tools/commands/ai/logs-clean.md |
| 4 | 自学习指令 | tools/commands/ai/self-learn.md |
| 5 | MCP 查询指令 | tools/commands/ai/mcp-list.md |
| 6 | Skills 查询指令 | tools/commands/ai/skills-list.md |
| 7 | 安装 Skills 指令 | tools/commands/ai/skills-install.md |
| 8 | 安装 MCP 指令 | tools/commands/ai/mcp-install.md |
| 9 | 查询 Hooks 指令 | tools/commands/ai/hooks-list.md |
| 10 | 查询定时任务指令 | tools/commands/ai/cron-list.md |
| 11 | 查询所有 Agent，Agent 状态指令 | tools/commands/ai/agents-status.md |
| 12 | 回滚指令 | tools/commands/ai/rollback.md |
| 13 | 读取记忆指令 | tools/commands/ai/memory-read.md |
| 14 | 刷新记忆指令 | tools/commands/ai/memory-refresh.md |
| 15 | 上下文压缩指令 | tools/commands/ai/context-compact.md |
| 16 | 自建规则创建指令 | tools/commands/ai/rule-create.md |
| 17 | 提示词状态 | tools/commands/ai/prompt-status.md |
| 18 | 提示词进化候选 | tools/commands/ai/prompt-evolve.md |
| 19 | 提示词差异 | tools/commands/ai/prompt-diff.md |
| 20 | 提示词评测 | tools/commands/ai/prompt-eval.md |
| 21 | 提示词激活 | tools/commands/ai/prompt-activate.md |
| 22 | 提示词回滚 | tools/commands/ai/prompt-rollback.md |
| 23 | 提示词历史 | tools/commands/ai/prompt-history.md |

## 常用脚本

| 指令 | 可执行脚本 | 状态 |
|---|---|---|
| 项目初始化 | tools/bin/ai-teams-init-project.sh | 可生成扫描报告并合并更新项目文档、索引和记忆 |
| CodeGraph 状态检测 | tools/bin/ai-teams-codegraph-status.sh | 可检测 CLI、`.codegraph/` 和写入索引 |
| 外部升级器操作说明 | tools/bin/ai-teams-upgrade.sh | 退役入口，仅中文说明、零写入；不支持 dry-run 或 apply |
| 回滚指令 | tools/bin/ai-teams-rollback.sh | 支持快照列表、回滚计划和显式确认 apply |
| 多余日志清除指令 | tools/bin/ai-teams-logs-clean.sh | 支持计划、归档和普通日志清理 |
| MCP 查询指令 | tools/bin/ai-teams-mcp-list.sh | 可查询共享 MCP、Agent MCP 和 CodeGraph 状态 |
| 安装 MCP 指令 | tools/bin/ai-teams-mcp-install.sh | 可受控写入 MCP registry 和元数据 |
| Skills 查询指令 | tools/bin/ai-teams-skills-list.sh | 可查询共享 Skills 和 Agent Skills |
| 安装 Skills 指令 | tools/bin/ai-teams-skills-install.sh | 可从本地 Skill 目录复制到工程内并更新 registry |
| 上下文压缩指令 | tools/bin/ai-teams-context-compact.sh | 可生成会话恢复摘要，不直接写正式记忆 |
| 自建规则创建指令 | tools/bin/ai-teams-rule-create.mjs | 可创建 rule/custom/ 路由文档并刷新自建规则索引 |
| 提示词状态 / 差异 / 历史 | tools/bin/ai-teams-prompt-status.mjs 等 | 只读检查活动版本、候选、哈希、编译同步和历史 |
| 提示词渲染 / 编译 | tools/bin/ai-teams-prompt-render.mjs、tools/bin/ai-teams-prompt-compile.mjs | 生成结构化任务提示词，并同步活动系统提示词到 Agent 入口 |
| 提示词进化 / 评测 / 激活 / 回滚 | tools/bin/ai-teams-prompt-evolve.mjs 等 | 生成候选、运行回归评测、受控审批激活和回滚 |
