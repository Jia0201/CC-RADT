---
id: "kb-agents-dev-frontend-web-source-map"
title: "Dev-Frontend-Web 权威来源地图"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---

# Dev-Frontend-Web 权威来源地图

`01-source-map.md` 只登记官方文档和主流工程规范，不放随机博客。

## 框架

| 来源 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|
| [Vue 官方文档](https://vuejs.org/guide/) | Vue 组件、组合式 API、响应式、模板和项目约定任务 | 优先遵循项目已有 Vue 版本与写法；不得混用 Options API / Composition API 风格，除非项目已有模式允许 |
| [Vue Router](https://router.vuejs.org/) | Vue 路由、嵌套路由、守卫、动态路由任务 | 路由变更必须检查权限、懒加载、404 和导航失败处理 |
| [Pinia](https://pinia.vuejs.org/) | Vue 全局状态、跨组件共享状态任务 | 只把跨页面或跨组件稳定状态放入 store；局部 UI 状态保留在组件内 |
| [React 官方文档](https://react.dev/) | React 组件、Hooks、状态、服务端/客户端边界任务 | Hooks 必须遵守调用规则；不得用副作用替代派生状态 |
| [Angular 官方文档](https://angular.dev/) | Angular 组件、服务、依赖注入、表单、路由任务 | 按 Angular 当前版本组织模块/standalone 结构，避免随意混用旧写法 |
| [Angular Style Guide](https://angular.dev/style-guide) | Angular 文件命名、目录、组件和服务组织任务 | 文件命名、职责拆分和依赖注入边界按官方风格执行 |

## 语言与工程工具

| 来源 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|
| [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | 类型设计、泛型、联合类型、类型收窄任务 | 不用 `any` 绕过类型；需要表达契约时优先定义明确类型 |
| [ESLint 官方文档](https://eslint.org/docs/latest/) | lint 规则、代码质量检查、项目规范维护任务 | 不通过禁用规则掩盖问题；需要禁用时必须说明局部原因 |
| [typescript-eslint](https://typescript-eslint.io/) | TypeScript ESLint 规则与类型感知 lint 任务 | 保持 parser、tsconfig、规则集与项目版本兼容 |
| [Prettier 官方文档](https://prettier.io/docs/) | 格式化、风格统一、团队格式规则任务 | 不手写与 Prettier 冲突的格式；格式问题交给工具 |
| [eslint-plugin-vue](https://eslint.vuejs.org/) | Vue 单文件组件 lint 与模板规则任务 | Vue 模板、props、emits、slot 规则遵循插件约束 |

## 测试与构建

| 来源 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|
| [Vite 官方文档](https://vite.dev/guide/) | Vite 构建、开发服务器、插件和环境变量任务 | 环境变量必须使用前端允许暴露的前缀；不得泄露服务端密钥 |
| [Vitest 官方文档](https://vitest.dev/) | 单元测试、组件逻辑测试任务 | 测试应覆盖输入、状态变化、错误和边界条件 |
| [Chrome MCP Server](https://github.com/hangwin/mcp-chrome) | 端到端检查、关键用户路径、截图、网络观察和浏览器回归任务 | 首次使用前引导用户安装 Chrome 扩展和 `mcp-chrome-bridge`；不只验证页面存在，必须验证用户可完成关键动作 |
| [Testing Library 文档](https://testing-library.com/docs/) | 组件测试、用户行为测试任务 | 优先按用户可见语义查询元素，避免只测实现细节 |
