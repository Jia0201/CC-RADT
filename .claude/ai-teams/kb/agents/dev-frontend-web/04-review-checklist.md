---
id: "kb-agents-dev-frontend-web-review-checklist"
title: "Dev-Frontend-Web 代码审查清单"
type: "review-checklist"
scope: "agent"
owner: "doc"
status: active
---

# Dev-Frontend-Web 代码审查清单

## 组件与状态

- [ ] 组件职责清晰，没有把页面、请求、渲染、复杂业务都塞进一个组件。
- [ ] props、emits、slot、context 或 service 边界清楚。
- [ ] 局部状态、共享状态和服务端缓存没有混用。
- [ ] React Hooks / Vue watch / Angular subscription 没有生命周期泄漏。

## 路由、权限与接口

- [ ] 新增页面已接入路由、菜单、权限、404 或未授权处理。
- [ ] API 请求使用统一封装，包含错误、超时、加载和重复提交处理。
- [ ] 没有擅自改变 API 契约；接口字段变更已同步类型和调用方。
- [ ] 前端没有硬编码 token、密钥、私有 base URL 或服务端配置。

## 表单、交互与可访问性

- [ ] 表单包含前端校验、后端错误展示、提交中状态和防重复提交。
- [ ] 加载、空状态、错误状态、禁用状态和成功反馈完整。
- [ ] 键盘操作、焦点、语义标签和可访问名称没有明显缺失。
- [ ] 样式没有造成移动端溢出、遮挡、闪动或布局跳变。

## 测试与构建

- [ ] 新增逻辑有单元、组件或端到端测试覆盖。
- [ ] 测试断言用户行为和关键状态，不只是快照或空测试。
- [ ] lint、typecheck、build 或项目指定验证命令已执行或说明未执行原因。
- [ ] 依赖新增有必要性，未引入重复框架、过重包或未维护包。
