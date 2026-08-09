---
id: ADR-0002
title: 指令位置归入 tools
type: adr
scope: project
status: accepted
date: 2026-06-02
owner: doc
decision_by: lead
---
# ADR-0002：指令位置归入 tools

## 1. 背景

AI-Teams 的指令既包含用户可读的命令说明，也包含可执行脚本。若把指令主体放入 Claude Code 配置目录下的 commands 子目录，会把配置层误当成工程本体，和“`.claude/` 只保留 settings”的边界冲突。

## 2. 决策

> 我们决定：指令说明统一放在 `tools/commands/`，AI 指令文档放在 `tools/commands/ai/`，可执行脚本放在 `tools/bin/`。

`.claude/` 不保存指令主体，不保存工作流和规则副本。

## 3. 原因

- 指令属于工程工具体系，放在 `tools/` 更符合工程语义。
- `tools/commands/` 负责说明，`tools/bin/` 负责执行，读写边界清楚。
- Claude Code、Codex、OpenCode 适配时可以从同一主工程位置读取。
- 避免 `.claude/` 成为第二套工程目录。

## 4. 影响范围

- 目录：`tools/commands/`, `tools/commands/ai/`, `tools/bin/`, `.claude/`。
- Agent：Lead、Doc、Security-Reviewer。
- 指令：全部 16 个当前指令。
- 规则：指令新增和安装必须遵守安全边界。
- 工具：自检脚本检查 16 个指令文档。
- 安全：未知第三方指令或脚本不得自动执行。

## 5. 后果

### 正面影响

- 指令位置统一。
- `.claude/` 最小化边界稳定。
- 后续迁移到其他编辑器时更容易适配。

### 负面影响

- 与 Claude Code 原生命令目录不同，需要入口文档明确指向 `tools/commands/`。

### 需要注意

- 不得在 Claude Code 配置目录下重新创建 commands 工程本体副本。
- 指令文档和可执行脚本修改后必须更新 `index/COMMANDS.md`。

## 6. 关联

- 相关规则：[file-ownership](../../../security/file-ownership.md), [sensitive-files](../../../security/sensitive-files.md)
- 相关目录：`tools/commands/`, `tools/bin/`
- 相关 Agent：Lead, Doc, Security-Reviewer
- 相关任务：`.claude/` 瘦身与主工程本体归位
- 替代关系：无
