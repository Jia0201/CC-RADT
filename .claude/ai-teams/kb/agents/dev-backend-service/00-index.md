---
id: "kb-agents-dev-backend-service-index"
title: "Dev-Backend-Service 知识库索引"
type: "knowledge-index"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Service 知识库索引

Dev-Backend-Service 负责 Python、Go、Node.js / TypeScript、服务端工程、API 和云原生服务开发。本知识库只保存与服务端工程强相关的可复用规则，不写百科教材。

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | 官方文档与权威规范入口 |
| [02-engineering-rules](./02-engineering-rules.md) | API、错误处理、配置、日志、迁移、云原生规则 |
| [03-code-style](./03-code-style.md) | Python / Go / Node.js / TypeScript 代码风格和生成约束 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于代码审查的清单 |
| [05-do-not](./05-do-not.md) | 服务端开发禁区 |

## 使用规则

- 什么时候使用：Lead 或 Plan-PM 分派 Python、Go、Node.js / TypeScript、API、数据库迁移、Docker、Kubernetes、云原生服务、服务端测试任务时。
- Codex 生成代码时要遵守：先读任务单、项目命令、[development-backend-service-policy](../../../security/development-backend-service-policy.md) 和本知识库；不得扩大到 C/C++/Java 系统后端职责。
