---
id: "kb-agents-dev-backend-service-source-map"
title: "Dev-Backend-Service 权威来源"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Service 权威来源

`01-source-map.md` 只登记官方文档、标准规范和主流工程规范，不放随机博客。

| 来源 | 地址 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|---|
| Python 官方文档 | https://docs.python.org/3/ | Python 标准库、异常、上下文管理、typing、asyncio | 使用当前项目 Python 版本支持的语法；不臆造不存在的标准库 API |
| PEP 8 | https://peps.python.org/pep-0008/ | Python 命名、格式、导入、可读性 | 优先项目风格；无项目规范时按 PEP 8 生成 |
| pytest | https://docs.pytest.org/ | Python 单元测试、fixture、参数化、断言 | 不写无法运行的测试；fixture 边界清晰，断言具体 |
| FastAPI | https://fastapi.tiangolo.com/ | FastAPI API、依赖注入、Pydantic、OpenAPI | 明确请求/响应模型、状态码、异常和依赖边界 |
| SQLAlchemy | https://docs.sqlalchemy.org/ | ORM、查询、事务、连接管理 | 不把业务逻辑藏进隐式查询副作用；事务边界可见 |
| Alembic | https://alembic.sqlalchemy.org/ | 数据库迁移、版本脚本、回滚 | 迁移必须说明升级/降级、兼容性和数据风险 |
| Go 官方文档 | https://go.dev/doc/ | Go 语言、模块、工具链、测试 | 使用项目 Go 版本支持的语法；不吞错误 |
| Effective Go | https://go.dev/doc/effective_go | Go 习惯用法、接口、错误、并发 | 生成 Go 代码要简洁、显式错误处理、接口不过度抽象 |
| Go Code Review Comments | https://go.dev/wiki/CodeReviewComments | Go 代码审查和常见风格问题 | 命名、错误、context、并发和测试按审查规则检查 |
| Google Go Style | https://google.github.io/styleguide/go/ | 大型 Go 项目风格、包边界、可读性 | 保持包边界和命名一致，不滥用全局状态 |
| Node.js 官方文档 | https://nodejs.org/docs/latest/api/ | Node.js 运行时、fs/http/stream/crypto、AbortController、模块系统 | 使用目标项目 Node 版本支持的 API；异步错误和资源释放必须明确 |
| npm 官方文档 | https://docs.npmjs.com/ | package scripts、依赖、lockfile、发布与审计 | 遵循项目包管理器和 lockfile；不绕过 npm/pnpm/yarn 约定 |
| TypeScript Handbook | https://www.typescriptlang.org/docs/ | TypeScript 类型、模块、配置、类型收窄 | 不使用 `any` 掩盖契约；类型应表达 API 边界和错误路径 |
| Express 官方文档 | https://expressjs.com/ | Express 路由、中间件、错误处理 | 中间件顺序、错误处理和响应结束路径必须清晰 |
| Fastify 官方文档 | https://fastify.dev/docs/latest/ | Fastify schema、插件、生命周期、日志 | schema、插件作用域、异步 hook 和错误响应必须明确 |
| NestJS 官方文档 | https://docs.nestjs.com/ | NestJS module、provider、controller、pipe、guard | 不绕过 DI、guard、pipe；模块边界和 provider 生命周期要清楚 |
| Prisma 官方文档 | https://www.prisma.io/docs | Node.js 数据访问、schema、migration、事务 | schema/migration/transaction 必须说明兼容和回滚风险 |
| TypeORM 官方文档 | https://typeorm.io/ | Node.js ORM、实体、迁移、事务 | 事务边界显式；迁移不能夹带不可回滚数据风险 |
| Jest 官方文档 | https://jestjs.io/docs/getting-started | Node.js / TypeScript 单元测试 | 测试必须有具体断言；mock 不得隐藏关键契约 |
| Vitest 官方文档 | https://vitest.dev/guide/ | Vite/TypeScript 服务端测试、mock、覆盖率 | 遵循项目 test runner；异步测试必须等待 promise/事件完成 |
| OpenAPI Specification | https://spec.openapis.org/oas/latest.html | REST API 契约、schema、错误响应 | API 变更必须同步契约，说明兼容性 |
| gRPC Docs | https://grpc.io/docs/ | RPC、proto、状态码、流式调用 | 不擅自改变 proto 契约；错误码和超时明确 |
| Docker Docs | https://docs.docker.com/ | Dockerfile、镜像、Compose、构建 | 不硬编码密钥；镜像层、用户权限和启动命令清晰 |
| Kubernetes Docs | https://kubernetes.io/docs/ | Deployment、Service、ConfigMap、Secret、探针 | 配置和 Secret 分离；探针和资源约束可解释 |
| OWASP Top 10 | https://owasp.org/www-project-top-ten/ | API 安全、输入校验、鉴权、敏感数据 | 不生成绕过鉴权、泄露敏感信息或弱输入校验的代码 |
