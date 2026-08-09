---
id: "project-stack"
title: "技术栈"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 技术栈

## 当前栈

- 文档与协议：Markdown、JSON、Shell 脚本。
- 主要编辑器：Claude Code。
- 兼容预留：Codex、OpenCode。
- 执行脚本：`tools/bin/*.sh` 和 `hooks/scripts/*.sh`。
- 外部能力 registry：`mcp/registry.json`、`skills/registry.json`。

## 识别状态

- 当前主工程是 Harness 骨架工程，没有应用运行时依赖。
- 真实项目技术栈由项目初始化指令在目标项目中扫描后写入。
- CodeGraph 状态当前记录为 `unknown`，后续由 CodeGraph 检测逻辑更新。

