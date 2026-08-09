---
id: "kb-agents-dev-frontend-web-code-style"
title: "Dev-Frontend-Web 代码风格"
type: "code-style"
scope: "agent"
owner: "doc"
status: active
---

# Dev-Frontend-Web 代码风格

## TypeScript

- 什么时候使用：所有现代 Web 前端业务代码、组件 props、API DTO、状态和工具函数。
- Codex 生成代码时要遵守：类型表达业务契约；避免 `any`、隐式 `unknown` 泄露和无意义类型断言；接口变更必须同步调用方。

## Vue

- 什么时候使用：Vue SFC、组合式 API、Pinia、Vue Router 任务。
- Codex 生成代码时要遵守：`props`、`emits`、slot、computed、watch 职责清晰；副作用放在合适生命周期；模板不堆复杂业务表达式。

## React

- 什么时候使用：React 组件、Hooks、状态、上下文、表单和路由任务。
- Codex 生成代码时要遵守：Hooks 顶层调用；依赖数组真实反映依赖；组件渲染保持纯净；昂贵计算才使用 memo 化。

## Angular

- 什么时候使用：Angular 组件、服务、表单、路由、依赖注入任务。
- Codex 生成代码时要遵守：组件处理视图状态，service 处理业务与数据访问；模板避免复杂逻辑；RxJS 订阅必须有生命周期管理。

## 样式

- 什么时候使用：新增组件样式、响应式布局、主题或状态样式任务。
- Codex 生成代码时要遵守：遵循项目已有 CSS、Sass、Tailwind 或组件库规范；样式命名可维护；不得用全局覆盖破坏其他页面。

## Lint 与格式化

- 什么时候使用：代码生成、重构、提交前验证、规则调整任务。
- Codex 生成代码时要遵守：以项目 ESLint、typescript-eslint、eslint-plugin-vue、Prettier 配置为准；不得大面积关闭规则。
