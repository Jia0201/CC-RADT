---
id: "kb-agents-qa-01-source-map"
title: "QA 权威来源"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# QA 权威来源

| 来源 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|
| 项目测试脚本与 README | 任何验收前 | 优先运行项目已有测试，不替换用户项目测试体系 |
| [verification](../../../project/verification.md) | 项目验收口径 | 不用 AI-Teams 默认口径覆盖项目自己的验收要求 |
| Chrome MCP 官方能力 / [index](../../../mcp/agents/qa/index.md) | Web UI、浏览器回归、截图和交互测试 | 只测试授权页面、localhost 或用户明确指定页面 |
| `pytest` / Go test / JUnit / Vitest 等项目测试框架 | 对应语言或框架项目 | 按项目已有依赖和命令运行，不凭空新增重型框架 |
| OWASP Top 10 | Web/API 安全回归 | 安全发现写风险和复现，不泄露敏感内容 |
| [development-policy](../../../security/development-policy.md) | 开发规则验收 | QA 发现开发 Agent 违规时必须回流 |
