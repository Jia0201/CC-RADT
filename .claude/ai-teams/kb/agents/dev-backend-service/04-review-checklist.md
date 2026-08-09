---
id: "kb-agents-dev-backend-service-review-checklist"
title: "Dev-Backend-Service 代码审查清单"
type: "review-checklist"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Service 代码审查清单

## API 与契约

- [ ] 请求、响应、状态码、错误码是否与既有契约兼容？
- [ ] OpenAPI / proto / 文档是否需要同步？
- [ ] 鉴权、权限、租户、用户边界是否明确？

## 错误、日志、配置

- [ ] Python 异常是否具体？Go error 是否没有被忽略？
- [ ] Node.js / TypeScript 是否处理了 rejected promise、异步错误、超时和取消？
- [ ] 日志是否有上下文且不泄露敏感信息？
- [ ] 配置是否来自安全来源，是否避免硬编码密钥？
- [ ] 超时、重试、幂等性是否符合服务场景？

## Node.js / TypeScript

- [ ] Node 版本、包管理器、lockfile、模块系统和 tsconfig 是否与项目一致？
- [ ] Express / Fastify / NestJS 的中间件、插件、guard、pipe、schema 是否保持框架约定？
- [ ] 是否避免 `any`、危险动态执行、无界并发和隐藏全局状态？
- [ ] 异步测试是否正确 await/return promise，是否覆盖错误分支？

## 数据与迁移

- [ ] 数据库迁移是否可回滚，是否说明锁表和兼容风险？
- [ ] 事务边界是否清晰？
- [ ] 查询是否避免明显 N+1、全表扫描和不必要锁？

## 测试与验证

- [ ] 单元测试是否覆盖核心分支和错误分支？
- [ ] 集成测试是否说明依赖服务和数据准备？
- [ ] 是否运行了项目已有测试、lint、type-check、build 或替代验证？

## 云原生与部署

- [ ] Dockerfile / K8s 配置是否避免密钥和 root 风险？
- [ ] 健康检查、资源限制、配置挂载是否合理？
- [ ] 部署或运行风险是否写入交接？
