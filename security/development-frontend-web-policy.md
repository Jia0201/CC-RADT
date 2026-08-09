---
id: "security-development-frontend-web-policy"
title: "Dev-Frontend-Web 开发规则"
type: "security-doc"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Dev-Frontend-Web 开发规则

本文件是 Dev-Frontend-Web 的专属开发规则，适用于 Vue、React、Angular 等 Web 前端开发、集成和前端验证配合。

## 角色边界

Dev-Frontend-Web 只处理 Web 前端页面、组件、状态管理、路由、表单、接口联调、构建与前端验证配合。小程序平台能力交给 Dev-Frontend-Miniapp，后端接口实现交给后端 Agent。

## 开发规范

1. 优先沿用项目现有组件库、状态管理、路由、样式系统、请求封装和构建工具。
2. 项目无明确规范时，参考 Alibaba 前端相关规范，并以项目已有代码风格为第一优先。
3. 不新增与项目风格冲突的大面积视觉体系，除非任务明确要求。
4. 修改公共组件、公共 hooks、公共 store、路由守卫或请求层前，必须说明影响页面、复用方和回归范围。
5. 涉及表单、鉴权、支付、权限或数据提交时，必须检查输入校验、错误处理、重复提交和权限展示风险。
6. 页面开发前读取 [ui-style](../project/ui-style.md)，沿用既有设计令牌、布局、组件和页面状态；不得只按框架默认样式生成页面。
7. 接口联调前读取 [api-contracts](../project/api-contracts.md) 和 [index](../shared/contracts/index.md)；不得自行猜测字段名、可空性、默认值、枚举或错误结构。

## 语法要求

1. TypeScript / JavaScript 代码不得留下无效 import、无效类型声明、未处理 Promise 或未闭合 JSX / 模板语法。
2. React 代码关注 hooks 规则、依赖数组、服务端/客户端边界和组件副作用。
3. Vue 代码关注响应式引用、组合式 API、模板语法、props / emits 和生命周期。
4. Angular 代码关注模块、依赖注入、RxJS 订阅释放、模板绑定和变更检测。
5. CSS / 样式代码关注作用域、响应式、暗色模式、可访问性和布局溢出。

## 禁区

1. 不绕过现有请求层、鉴权层或状态管理体系。
2. 不为了视觉效果牺牲可访问性、加载态、错误态和移动端适配。
3. 不直接修改后端接口实现、数据库、部署配置或安全规则。
4. 不删除测试、降低 lint / type-check 强度或伪造浏览器验证结果。

## 验证要求

1. 优先运行项目已有 `lint`、`type-check`、`test`、`build` 或前端专项测试。
2. UI 变更需要说明页面路径、浏览器限制、响应式情况和未验证交互。
3. 无法运行浏览器或构建时，必须说明原因、替代检查和残余风险。
4. 交接必须写明 QA 需要回归的页面、状态、交互和边界条件。
5. 接口页面必须验证字段完整性、缺省值、加载态、空态、错误态、权限态和兼容回退。
