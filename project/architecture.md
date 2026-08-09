---
id: "project-architecture"
title: "架构"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 架构

## 总览

AI-Teams 围绕“入口索引 + Agent 团队 + 版本化提示词 + 指令工具 + 共享工作区 + 记忆 + 知识库 + 安全治理 + 日志 + 扩展工具”组织。AI-Teams 主目录保存 Harness 工程大脑；`.claude/` 只保存 Claude Code 官方识别所需的配置、Agent 入口和轻量规则适配器。

## 核心组成

- 根入口：`README.md`、`CLAUDE.md`、`MANIFEST.json`、`VERSION`。
- 索引层：`index/` 保存工程入口、项目摘要、Agent 导航、指令导航、文件地图和运行状态。
- Agent 层：`agents/` 定义 12 个默认 Agent，主索引为 `agents/index.md`。
- 提示词层：`prompts/` 保存 12 个 Agent 的活动系统提示词、任务提示词、重试提示词、评测集、注册表和版本历史。
- 指令层：`tools/commands/ai/` 保存 25 个用户指令说明，`tools/bin/` 保存可执行脚本；安装包只保留 23 个运行指令。
- 协作层：`shared/` 保存任务、交接、广播、决策、锁和共享工作区。
- 记忆层：`memory/` 保存共享记忆、Agent 记忆、候选记忆、归档、刷新规则和会话恢复材料。
- 知识库层：`kb/` 保存共享知识、Agent 知识、候选知识和图谱入口。
- 治理层：`security/`、`logs/`、`hooks/` 和 `cron/` 管理安全、追溯、自动化和维护。
- 决策层：`project/adr/` 记录长期结构性决策原因，由 Doc 维护、Lead 决策。
- 扩展层：`templates/`、`skills/`、`mcp/`、`tools/` 和 `lab/` 支持标准化创建、外部能力、工程工具、实验和验证。

## 关键边界

- 日志不等于记忆。
- 记忆不等于知识库。
- `memory/conversations/` 是会话恢复材料，不等同正式记忆。
- 索引不保存长内容。
- ADR 只记录长期结构性决策原因，不替代日志、记忆、知识库和共享状态。
- lab 内容默认不进入正式版。
- 敏感文件默认只检测存在，不读取内容。
- `.claude/agents/` 是 Claude Code 官方发现入口，由 `prompts/registry.json` 的活动系统提示词编译生成；Agent 本体、提示词版本、指令、记忆、知识库和安全规则仍在 AI-Teams 主目录维护。
- `.claude/rules/` 只保存短适配器，不复制完整规则正文；`.claude/` 不保存指令脚本、记忆、知识库或 Skills 本体。
