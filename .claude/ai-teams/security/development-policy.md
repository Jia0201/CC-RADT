---
id: "security-development-policy"
title: "开发规则与禁区"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 开发规则与禁区

本文件定义四个开发 Agent 的通用开发规则、禁区、规范和语法要求。它是安全模块中的开发动作规则，不替代各 Agent 的职责边界，也不替代项目自身代码规范。

适用 Agent：

- [Dev-Frontend-Web 前端 Web Agent](../agents/dev-frontend-web/dev-frontend-web.md)：专属规则见 [development-frontend-web-policy](./development-frontend-web-policy.md)
- [Dev-Frontend-Miniapp 小程序 Agent](../agents/dev-frontend-miniapp/dev-frontend-miniapp.md)：专属规则见 [development-frontend-miniapp-policy](./development-frontend-miniapp-policy.md)
- [Dev-Backend-Systems 系统后端 Agent](../agents/dev-backend-systems/dev-backend-systems.md)：强类型后端专属规则见 [development-backend-systems-policy](./development-backend-systems-policy.md)
- [Dev-Backend-Service 服务端 Agent](../agents/dev-backend-service/dev-backend-service.md)：弱类型/服务端专属规则见 [development-backend-service-policy](./development-backend-service-policy.md)

## 1. 执行前必须读取

开发 Agent 接到开发、修复、重构、集成、测试补充或代码审查相关任务时，必须先读取：

1. Lead 分派的任务单和执行方案。
2. 本 Agent 主文档、`role.md`、`workflow.md`、`playbook.md`。
3. 根动作链 [playbook](../playbook.md)。
4. 专属动作规则 `security/agent-playbooks/<agent>.md`。
5. 本规则 [development-policy](./development-policy.md)。
6. 本 Agent 专属开发规则：
   - Dev-Frontend-Web：[development-frontend-web-policy](./development-frontend-web-policy.md)
   - Dev-Frontend-Miniapp：[development-frontend-miniapp-policy](./development-frontend-miniapp-policy.md)
   - Dev-Backend-Systems：[development-backend-systems-policy](./development-backend-systems-policy.md)
   - Dev-Backend-Service：[development-backend-service-policy](./development-backend-service-policy.md)
7. 文件所有权、锁、敏感文件和删除规则：[file-ownership](./file-ownership.md)、[lock-policy](./lock-policy.md)、[sensitive-files](./sensitive-files.md)、[delete-policy](./delete-policy.md)。
8. 项目命令、架构、风险和 CodeGraph 状态：[commands](../project/commands.md)、[architecture](../project/architecture.md)、[risks](../project/risks.md)、[CODEGRAPH](../index/CODEGRAPH.md)。

## 2. 通用开发规则

1. 严格遵循项目现有开发规范、样式规范、目录结构、命名习惯和测试习惯。
2. 项目没有明确规范时，参考 Alibaba 开发规范；前端和小程序同时遵循项目已有 UI / 样式规范。
3. 代码修改必须贴合任务边界，不主动扩大为无关重构。
4. 修改公共接口、公共组件、数据结构、数据库迁移、构建配置、部署配置或跨模块契约前，必须说明影响范围并等待 Lead 或 Plan-PM 确认。
5. 涉及大范围代码理解、调用关系、影响分析或跨模块变更时，先检查 CodeGraph；不可用时说明回退到 `rg`、索引和人工阅读。
6. 每次开发交接必须提供变更文件、行为变化、验证命令、未验证项、风险和建议 QA 关注点。
7. 无法运行测试或构建时，必须说明原因、替代验证方式和残余风险。

## 3. 语法要求

1. 不提交伪代码、半截代码、占位函数、未闭合语法、无效 import、无效类型声明或无法解释的空实现。
2. 新增代码必须符合目标语言语法和当前项目版本，不使用项目未声明支持的语言特性。
3. 修改依赖、构建配置或语言版本前必须确认项目约束。
4. TypeScript / JavaScript 代码需要关注类型、模块导入、异步错误处理、构建产物和 lint 规则。
5. Python 代码需要关注类型提示、异常处理、上下文管理、依赖导入、格式化和测试入口。
6. Go 代码需要关注 `gofmt`、错误返回、并发安全、包边界、接口契约和测试入口。
7. Java 代码需要关注包名、泛型、异常、线程安全、资源关闭、构建工具和 Alibaba Java 规范。
8. C / C++ 代码需要关注内存生命周期、资源释放、线程安全、未定义行为、编译目标和 ABI 兼容。

## 4. 开发禁区

未经 Lead 明确授权，开发 Agent 禁止：

1. 读取 `.env`、密钥、证书、token、credentials 等敏感文件内容。
2. 删除用户项目文件或执行不可逆清理命令。
3. 绕过锁机制修改受保护范围。
4. 直接修改正式记忆、正式知识库、安全规则、Hook 脚本、MCP / Skills registry。
5. 将测试失败、构建失败或无法验证的结果描述为已通过。
6. 为了通过测试而删除断言、降低验证强度、屏蔽错误或伪造结果。
7. 在未确认影响范围时改动公共 API、数据库结构、鉴权逻辑、支付逻辑、权限逻辑、配置读取和部署流程。
8. 引入未知第三方依赖、远程脚本或自动执行安装命令。

## 5. 专属开发规则入口

四个开发 Agent 必须读取自己的专属规则文件，不得只读取本通用文件：

| Agent | 类型 | 专属规则 |
|---|---|---|
| Dev-Frontend-Web | Web 前端 | [development-frontend-web-policy](./development-frontend-web-policy.md) |
| Dev-Frontend-Miniapp | 小程序前端 | [development-frontend-miniapp-policy](./development-frontend-miniapp-policy.md) |
| Dev-Backend-Systems | 强类型系统后端 | [development-backend-systems-policy](./development-backend-systems-policy.md) |
| Dev-Backend-Service | 弱类型/服务端工程 | [development-backend-service-policy](./development-backend-service-policy.md) |

说明：前端 Web 与小程序平台规则必须区分；后端强类型系统开发与弱类型/服务端工程规则必须区分。

## 6. 验证要求

开发 Agent 完成任务后必须至少做一项验证：

1. 运行项目已有测试、构建、lint、type-check、编译或格式化检查。
2. 如果无法运行，说明原因并提供替代验证方式。
3. 涉及 UI 或平台能力时，说明浏览器、设备、平台或真机验证情况。
4. 涉及后端或系统能力时，说明接口、并发、兼容、性能或部署风险。
5. 交接中不得遗漏失败命令、未验证项和残余风险。

## 7. 回流条件

出现以下任一情况，开发 Agent 必须停止扩大修改并回流给 Lead：

1. 需求边界不清或验收标准冲突。
2. 涉及敏感文件、删除、鉴权、支付、权限、数据迁移或部署高风险行为。
3. 多文件锁冲突、Owner 冲突或潜在死锁。
4. 首次失败后根因不清，或一次定向重试仍失败。
5. 需要跨 Dev Agent、QA、Security-Reviewer 或 Doc 协同才能继续。
