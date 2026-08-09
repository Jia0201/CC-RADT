---
id: "kb-agents-dev-backend-service-do-not"
title: "Dev-Backend-Service 禁止事项"
type: "do-not"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Service 禁止事项

## 安全禁区

- 什么时候使用：任何服务端代码、配置、部署、测试生成。
- Codex 生成代码时要遵守：不得硬编码密钥、appsecret、token、数据库密码、云凭证；不得读取敏感文件内容。

## API 契约禁区

- 什么时候使用：修改接口、proto、schema、错误码、鉴权逻辑。
- Codex 生成代码时要遵守：不得擅自改变 API 契约；不得无说明删除字段、改状态码、放宽鉴权或改变权限语义。

## 错误处理禁区

- 什么时候使用：外部调用、数据库、缓存、队列、文件、网络、并发。
- Codex 生成代码时要遵守：不得跳过错误处理；Go 不写 `_ = err`；Python 不写裸 `except` 后静默；Node.js / TypeScript 不吞掉 Promise rejection，不用空 `catch` 掩盖失败。

## Node.js / TypeScript 禁区

- 什么时候使用：生成 Node.js API、后台任务、MCP 服务、CLI 服务端脚本或 TypeScript 服务模块。
- Codex 生成代码时要遵守：不得绕过 `tsconfig`、ESLint、测试和 lockfile；不得混用 CommonJS / ESM 模块系统；不得用 `any`、动态 `eval`、字符串拼接 SQL 或全局可变状态偷懒；不得把服务端 token、JWT secret、数据库连接串、支付密钥写入前端包、源码常量或日志。
- 什么时候使用：处理 HTTP 请求、数据库访问、外部 API、队列、文件流和定时任务。
- Codex 生成代码时要遵守：必须处理超时、取消、重试边界和幂等性；不得无限制并发请求；不得在未验证输入的情况下写数据库或调用外部服务。

## 测试禁区

- 什么时候使用：生成或修改测试、修复失败测试。
- Codex 生成代码时要遵守：不得生成未测试代码后声称已验证；不得删除断言、降低测试强度或伪造测试结果；Node.js 异步测试必须 `await` 或 `return` Promise，不得让测试在异步断言完成前结束。

## 数据与部署禁区

- 什么时候使用：数据库迁移、Docker、Kubernetes、配置变更。
- Codex 生成代码时要遵守：不得无回滚方案修改 schema；不得把 Secret 写进镜像、配置样例或日志；不得绕过健康检查。
