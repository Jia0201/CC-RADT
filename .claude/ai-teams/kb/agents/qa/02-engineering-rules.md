---
id: "kb-agents-qa-02-engineering-rules"
title: "QA 工程验收知识"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# QA 工程验收知识

## 什么时候使用

开发、文档治理、初始化、升级、回滚、MCP/Skills 变更后，QA 必须做相应验收。

## Codex 生成内容时要遵守什么

1. 先确认验收对象：代码、脚本、配置、文档、索引、打包产物。
2. 再确认验收命令：优先使用 `project/verification.md` 和项目已有脚本。
3. 没有自动测试时，生成最小人工验收清单，不伪造执行结果。
4. 对失败项写复现步骤、实际结果、期望结果、影响范围和建议 Owner。
5. Dev 修复 2 次失败后，按回流机制交给 Lead 仲裁。
