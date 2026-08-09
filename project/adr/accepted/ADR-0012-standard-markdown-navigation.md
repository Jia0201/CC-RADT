---
id: ADR-0012
title: 采用标准 Markdown 与 Claude Code 原生导航
type: adr
status: accepted
date: 2026-07-20
owner: doc
decision_by: lead
---

# ADR-0012：采用标准 Markdown 与 Claude Code 原生导航

## 1. 背景

工程曾同时维护运行路径、编辑器专用链接、标签注册和额外配置。重复关系增加了上下文、维护和断链成本，也让 Claude Code 的真实加载入口不够清晰。

## 2. 决策

> 我们决定：AI-Teams 只保留 Claude Code 原生入口、真实仓库路径、标准 Markdown 相对链接与 Mermaid 关系图。

安装布局不再生成 AI-Teams 自己的第二份 `CLAUDE.md`。目标项目自己的根 `CLAUDE.md` 保持唯一；AI-Teams 通过 `.claude/settings.json`、`.claude/agents/` 和 `.claude/rules/` 接入。

## 3. 原因

- Claude Code 能直接解析这些入口，不需要额外转换。
- 减少启动上下文和多套索引的同步成本。
- 避免目标项目与 Harness 存在多个同名指令入口。
- 普通 Markdown 链接在代码托管、编辑器和审查工具中均可验证。

## 4. 影响范围

- 目录：`.claude/`、`index/`、`shared/`、`project/`、`kb/`、`templates/`。
- Agent：Doc 维护标准链接与关系图；Role 维护 Agent 入口。
- 工具：初始化、打包、自检、索引刷新和提示词编译。
- 安全：禁止恢复编辑器专用链接或机器绝对路径。

## 5. 后果

### 正面影响

- Claude Code 指令来源唯一且可通过 `/memory` 核对。
- 文档关系更轻量，断链可由脚本直接检查。

### 负面影响

- 旧文档需要一次性迁移。

### 需要注意

- `@path` 导入会占用启动上下文，只在短入口中使用。
- 任务细则优先放按路径加载的 `.claude/rules/` 或按需 Skills。

## 6. 关联

- 相关规范：[文档导航规范](../../../index/NAVIGATION.md)
- 相关规则：[运行期维护策略](../../../security/runtime-maintenance-policy.md)
- 相关入口：[全局导航](../../../index/INDEX.md)
