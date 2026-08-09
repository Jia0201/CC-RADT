---
id: "kb-agents-dev-backend-service-code-style"
title: "Dev-Backend-Service 代码风格"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Service 代码风格

## Python

- 什么时候使用：Python API、脚本、任务队列、数据处理、FastAPI、SQLAlchemy。
- Codex 生成代码时要遵守：优先项目风格；无规范时按 PEP 8；导入有序，函数职责单一，异常具体，类型提示服务于可读性。

## FastAPI / Pydantic

- 什么时候使用：API 路由、依赖注入、请求响应模型、校验。
- Codex 生成代码时要遵守：请求/响应模型明确；不要把数据库模型直接暴露为外部响应；异常状态码清晰。

## SQLAlchemy / Alembic

- 什么时候使用：ORM、事务、迁移脚本。
- Codex 生成代码时要遵守：事务边界显式；查询避免 N+1；迁移脚本命名可读，升级/降级可解释。

## Go

- 什么时候使用：Go API、服务、worker、SDK、CLI、云原生组件。
- Codex 生成代码时要遵守：`gofmt`；错误显式返回；context 贯穿请求链路；接口小而清晰；包名短且语义明确。

## Node.js / TypeScript

- 什么时候使用：Node.js API、BFF、Webhook、worker、SDK、CLI、MCP server、Express / Fastify / NestJS 服务。
- Codex 生成代码时要遵守：优先项目 ESLint、Prettier、tsconfig 和包管理器；不得用 `any` 掩盖 API 契约；异步函数必须处理错误、超时和取消；模块系统保持项目一致，不混用 CJS/ESM。

## Express / Fastify / NestJS

- 什么时候使用：路由、中间件、插件、controller、provider、guard、pipe、schema。
- Codex 生成代码时要遵守：输入 schema、鉴权、错误响应和中间件顺序必须明确；不要绕过框架 DI、生命周期或错误处理机制。

## 测试命名

- 什么时候使用：新增或修改测试。
- Codex 生成代码时要遵守：测试名说明场景；断言具体；fixture 不隐藏关键输入；Node.js 异步测试必须 await/return promise；外部依赖使用 mock、fake 或集成测试标记。

## 注释

- 什么时候使用：复杂事务、并发、迁移、协议兼容、非显然业务约束。
- Codex 生成代码时要遵守：注释解释原因和边界，不复述代码表面行为。
