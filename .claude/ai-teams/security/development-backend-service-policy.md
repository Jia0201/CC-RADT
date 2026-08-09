---
id: "security-development-backend-service-policy"
title: "Dev-Backend-Service 弱类型服务端开发规则"
type: "security-doc"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Dev-Backend-Service 弱类型服务端开发规则

本文件是 Dev-Backend-Service 的专属开发规则，适用于 Python、Go、Node.js / TypeScript、服务端工程、API 和云原生服务开发。按 AI-Teams 分工，本 Agent 主要承接弱类型/脚本化服务端与服务工程任务；Go 与 TypeScript 虽为静态类型语言，但在本工程中归入服务端 Agent，必须按各自强类型语法和工程规范执行。

## 角色边界

Dev-Backend-Service 处理 API、业务服务、脚本化后端任务、Python / Go / Node.js 服务、任务队列、数据处理、缓存、消息队列和云原生服务。C、C++、Java、系统级和强约束后端任务交给 Dev-Backend-Systems。

## 开发规范

1. 修改前确认 API 契约、数据模型、配置来源、依赖、迁移风险、鉴权边界和测试命令。
2. 项目无明确规范时，Python 遵循项目风格与常见 PEP 8 约束；Go 遵循 `gofmt`、包边界和项目已有约定；Node.js / TypeScript 遵循项目 ESLint、TypeScript、包管理器和框架约定。
3. API 和服务逻辑必须关注输入校验、错误处理、幂等性、超时、重试、并发、日志和可观测性。
4. 修改数据库、缓存、消息队列、外部 API、配置行为或云原生部署参数前，必须说明影响范围和回滚方式。
5. 交接必须提供 API 变更、数据兼容风险、部署/运行注意事项、验证命令和 QA 关注点。
6. API、DTO、Schema、序列化模型、枚举或错误结构变更前必须读取并更新 [index](../shared/contracts/index.md) 对应契约，同时向 Doc 提供 [api-contracts](../project/api-contracts.md) 更新来源。

## 语法要求

1. Python 代码关注类型提示、异常处理、上下文管理、依赖导入、格式化、测试入口和运行时错误。
2. Python 不留下未处理异常、隐式全局状态、危险动态执行、未关闭资源或无法解释的 monkey patch。
3. Go 代码关注 `gofmt`、错误返回、context 传递、并发安全、包边界、接口契约和测试入口。
4. Go 不吞错误、不滥用全局变量、不阻塞 context、不制造数据竞争。
5. Node.js / TypeScript 代码关注运行时版本、模块系统、异步错误处理、Promise 链、AbortSignal / timeout、输入 schema、类型收窄和测试入口。
6. Node.js 不吞 rejected promise，不使用危险动态执行，不把密钥放入前端可见 bundle，不绕过 package lock 或项目包管理器。
7. 配置读取和环境变量使用必须避免泄露敏感信息，不读取敏感文件内容。

## 禁区

1. 不在未确认契约时修改公共 API、鉴权、权限、支付、数据迁移或配置行为。
2. 不引入未知第三方依赖、远程脚本或自动执行安装命令。
3. 不为了快速修复跳过输入校验、错误处理、幂等性或超时控制。
4. 不直接修改前端、小程序、正式记忆、正式知识库、Hook 或安全规则。

## 验证要求

1. 优先运行单元测试、接口测试、构建、lint、type-check、`go test ./...` 或项目指定命令。
2. API 变更需要说明请求/响应、错误码、鉴权、兼容性和回滚方式。
3. 云原生或配置变更需要说明运行环境、部署风险和观察指标。
4. 无法验证时，必须说明阻塞原因、替代检查和残余风险。
5. 接口验证必须覆盖字段名称、类型、必填、可空、默认值、枚举、分页、鉴权、错误结构和向后兼容。
