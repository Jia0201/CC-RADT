---
id: "kb-agents-dev-backend-service-engineering-rules"
title: "Dev-Backend-Service 工程规则"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Service 工程规则

## API 设计

- 什么时候使用：新增或修改 REST / gRPC API、请求响应模型、错误码、接口文档时。
- Codex 生成代码时要遵守：先确认 API 契约、兼容性、鉴权和调用方；不得擅自改变请求/响应字段、状态码或 proto。

## 错误处理

- 什么时候使用：任何服务端输入、外部调用、数据库访问、任务队列、文件或网络操作。
- Codex 生成代码时要遵守：Python 不吞异常，Go 不忽略 error，Node.js 不吞 rejected promise；错误必须包含足够上下文，但不得泄露密钥、token、个人敏感信息。

## Node.js / TypeScript 服务

- 什么时候使用：新增或修改 Express、Fastify、NestJS、Node SDK、worker、CLI、BFF、Webhook、MCP 服务端、TypeScript API 模块时。
- Codex 生成代码时要遵守：先确认 Node 版本、包管理器、模块系统、tsconfig、lint/test/build 命令；异步流程必须显式处理错误、超时、取消和资源释放。

## Node.js 数据访问

- 什么时候使用：Prisma、TypeORM、Knex、数据库 client、缓存 client、消息队列 client。
- Codex 生成代码时要遵守：事务边界和连接生命周期可见；迁移和 schema 变更要说明兼容性；不得在请求路径中制造无界连接、无界并发或隐藏全局状态。

## 日志与可观测性

- 什么时候使用：服务入口、异常分支、外部依赖调用、异步任务、部署运行问题。
- Codex 生成代码时要遵守：日志结构清晰、级别合理、避免打印敏感信息；必要时保留 request id / trace id。

## 配置管理

- 什么时候使用：环境变量、配置文件、Feature Flag、Docker / Kubernetes 配置。
- Codex 生成代码时要遵守：配置来源显式；不得硬编码密钥、URL token、appsecret；默认值不能掩盖生产风险。

## 数据库迁移

- 什么时候使用：修改 schema、索引、约束、枚举、默认值、数据修复脚本。
- Codex 生成代码时要遵守：迁移必须说明升级、降级、数据兼容、锁表风险和回滚方式；不把迁移和业务逻辑混在一起。

## 单元测试与集成测试

- 什么时候使用：新增业务逻辑、API、数据访问、错误分支、外部依赖适配。
- Codex 生成代码时要遵守：单元测试覆盖核心分支；集成测试说明依赖；Node.js 异步测试必须等待 promise/事件完成；不得生成只测 happy path 的空泛测试。

## Docker / Kubernetes

- 什么时候使用：容器化、服务部署、健康检查、配置挂载、资源限制。
- Codex 生成代码时要遵守：镜像不包含密钥；非 root 运行优先；readiness/liveness、资源限制和配置边界可解释。
