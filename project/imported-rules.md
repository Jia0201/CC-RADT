---
id: "project-imported-rules"
title: "项目既有规则吸收区"
type: "project-rule"
scope: "project"
owner: "doc"
status: active
---
# 项目既有规则吸收区

本文件用于承接目标项目已经存在的 AI/编码规则入口，例如 `CLAUDE.md`、`AGENTS.md`、`.qcoder`、`.qwen`、`.cursorrules`、`.cursor/rules/`、`.github/copilot-instructions.md`、`GEMINI.md` 等。

## 使用规则

- 初始化时只读取非敏感命名的规则文件。
- 读取内容仅用于让 AI-Teams 理解目标项目已有开发规则、禁区、命令约束和协作习惯。
- 不读取 `.env`、密钥、证书、token、credentials 等敏感文件内容。
- 如果规则文件过大，只吸收前段内容并标记截断。
- 本文件属于目标项目画像，不属于知识库，不写入长期记忆。
- Doc 负责合并和去重；Security-Reviewer 负责检查敏感边界和高风险规则冲突。
- 初始化脚本只提供扫描辅助，最终规则吸收必须经过 Agent 复核。

## 当前吸收状态

尚未初始化目标项目。

