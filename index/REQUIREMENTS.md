---
id: "index-requirements"
title: "需求验收索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# 需求验收索引

## 来源

- 需求文档：`~/Downloads/ai_teams_codex_6_batches_v1.0/AI-Teams 工程需求文档-v1.0.md`
- 重点章节：第 4 节使用方式、第 5 节设计原则、第 6 节目录结构、第 7 节根文件要求、第 8 节 Agent 团队。

## 当前真实状态

当前按用户分段需求推进。AI-Teams 根目录保存工程本体；`.claude/` 只保存 Claude Code 官方识别所需的 settings、subagent 和 rule 适配入口，不复制工程正文。

1. README 已补充项目根目录安装和项目外层安装说明。
2. 初始化指令已明确 `--target`、安装形态和不得破坏用户项目。
3. Lead 调度、工作流和设计边界已沉淀到 `agents/lead/lead.md` 与 `index/ENTRY.md`；源工程根 `CLAUDE.md` 只做官方导入。
4. `.claude/` 保存 `settings.json`、12 个官方 subagent 入口和轻量 rule 适配器；Agent、指令、规则、记忆、知识库和工作区正文仍由 AI-Teams 主目录管理。
5. 12 个 Agent 本体位于 `agents/<agent>/<agent>.md`，并由 `agents/index.md` 统一索引。
6. 25 个指令说明位于 `tools/commands/ai/`，并由 `tools/commands/index.md` 统一索引；安装包移除 2 个发布维护指令后保留 23 个运行指令。
7. `rule/` 作为按需读取层，包含工程目录、12 个 Agent 专属最短读取链、任务路由、项目结构与文件、前端 UI/语法、后端接口/语法、决策、方案、知识、安全、共享工作区、记忆、工具和自建规则路由。
8. 会话记录、上下文压缩和恢复点归入 `memory/conversations/`，由 Memory 管控但不等同正式记忆。
9. 本轮不覆盖用户正式输出目录，只用临时安装包验证 rule 能力、命令数量、Claude Code 适配器和包内自检。

## 验收矩阵入口

- 结构自检：`tools/bin/ai-teams-check.sh`
- 需求缺口报告：`logs/audit/requirements-gap-remediation-report.md`
- 第 4-8 节报告：`logs/audit/requirements-section-04-08-report.md`
- 最终创建报告：`logs/audit/creation-report-v1.0.md`
- CodeGraph 调用索引：[CODEGRAPH](./CODEGRAPH.md)
- 文档关系图索引：[导航规范](./NAVIGATION.md)

## 需求对齐优先级

1. 等待用户继续发送下一段正式需求。
2. 继续按章节验证主工程本体。
3. 最后统一处理发布版本。
