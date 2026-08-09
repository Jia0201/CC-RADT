---
id: "kb-agents-dev-backend-systems-index"
title: "Dev-Backend-Systems 知识库索引"
type: "knowledge-index"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Systems 知识库索引

Dev-Backend-Systems 负责 C、C++、Java、系统级后端和强约束后端开发。本知识库只保存强类型、系统级、性能/稳定性敏感开发知识。

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | Java / C / C++ / 构建 / 安全规范权威来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 系统后端工程规则 |
| [03-code-style](./03-code-style.md) | Java、C、C++ 代码风格 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于强类型后端代码审查 |
| [05-do-not](./05-do-not.md) | 系统后端禁区 |

## 使用规则

- 什么时候使用：C、C++、Java、Spring Boot、SpringCloud、Maven、Gradle、CMake、Make、系统级性能、并发、资源安全任务。
- Codex 生成代码时要遵守：先读 [development-backend-systems-policy](../../../security/development-backend-systems-policy.md)；不得把 Python/Go 服务端规则套到强类型系统后端。
