---
id: "tools-health-readme"
title: "健康检查工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 健康检查工具

## 用途

保存结构自检和工程健康检查说明。实际脚本位于 `tools/bin/ai-teams-check.sh` 和 `tools/bin/ai-teams-status.sh`。

## 状态

v1.0 结构自检和状态查看脚本已创建。

## 输入

- 当前 AI-Teams 工程目录。
- `MANIFEST.json`
- `index/`
- Agent、指令、模板、MCP、Skills、Hook 和日志目录。

## 输出

- 结构自检结果。
- 状态摘要。
- 缺失文件或目录列表。

## 安全边界

- 不读取敏感文件内容。
- Git 辅助状态不可用时不失败；没有 Git 的目标项目必须继续完成初始化、规划、开发和验收。
- 自检只验证工程结构和关键脚本，不替代完整功能验收。

## 可执行入口

```bash
bash tools/bin/ai-teams-check.sh
bash tools/bin/ai-teams-status.sh
```
