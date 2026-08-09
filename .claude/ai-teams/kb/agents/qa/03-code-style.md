---
id: "kb-agents-qa-03-code-style"
title: "QA 测试代码与报告格式"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# QA 测试代码与报告格式

## 测试代码

- 什么时候使用：需要新增或调整测试时。
- Codex 要遵守：测试必须可重复、可独立运行、命名清晰；不要依赖本机私有路径、账号、密钥或外部不稳定状态。

## 验收报告

- 什么时候使用：QA 完成或阻塞时。
- Codex 要遵守：报告必须包含范围、命令、结果、失败项、未覆盖项、风险、下一步。

## 浏览器自动化

- 什么时候使用：Web 或小程序 WebView 类验证、页面交互、截图、控制台错误检查。
- Codex 要遵守：优先使用 QA Chrome MCP；不可用时写明回退原因和手工验证方式。
