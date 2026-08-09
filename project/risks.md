---
id: "project-risks"
title: "风险"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 风险

## 当前风险

- 部分指令仍是文档级说明；项目初始化、打包、升级、回滚、日志压缩和 CodeGraph 检测已具备最小脚本，MCP / Skills 安装与自学习自动化仍待实现。
- 当前目录不是 Git 仓库，`git status` 只能作为可选检查，无法提供版本管理状态。
- Hook 脚本已具备最小检查能力，但尚未与具体编辑器事件深度绑定。
- CodeGraph 状态需要通过 `tools/bin/ai-teams-codegraph-status.sh` 对目标项目执行检测后才可信。
- 模板和工具目录已中文化，核心工具已有最小实现，后续仍需增强 MCP / Skills 安装、安全验证和自动化测试。

## 缓解方式

- 对目标项目先运行项目初始化，建立语言、框架、命令和风险画像。
- 对升级操作先运行 dry-run，确认快照和变更清单。
- 对 Hook 操作保留人工确认环境变量，避免误删或误改受保护范围。
- 每次关键结构改动后运行 `bash tools/bin/ai-teams-check.sh`。

