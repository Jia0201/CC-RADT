---
id: "kb-agents-dev-frontend-miniapp-source-map"
title: "Dev-Frontend-Miniapp 权威来源地图"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---

# Dev-Frontend-Miniapp 权威来源地图

`01-source-map.md` 只登记官方文档和平台规范，不放随机博客。

## 平台与框架

| 来源 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|
| [uni-app 官方文档](https://uniapp.dcloud.net.cn/) | uni-app 跨端页面、组件、API、条件编译和平台适配任务 | 先确认目标平台；条件编译只包裹平台差异，不掩盖业务差异 |
| [微信小程序框架文档](https://developers.weixin.qq.com/miniprogram/dev/framework/) | 微信小程序页面、组件、生命周期、路由、分包任务 | 遵守微信小程序运行模型和审核边界；不得假设浏览器 DOM 能力 |
| [微信小程序 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/) | 调用微信登录、授权、支付、订阅消息、上传下载等 API | 必须检查 API 权限、回调错误、用户拒绝和平台限制 |
| [支付宝小程序开放文档](https://opendocs.alipay.com/mini) | 支付宝小程序页面、组件、API、能力接入任务 | 必须区分支付宝和微信 API 差异，不得复用平台不兼容代码 |

## 关键能力

| 来源 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|
| [微信小程序登录能力](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html) | 微信登录、code 换 session、用户身份接入任务 | `appsecret` 和换取 session 的逻辑只能在服务端；前端只传临时 code |
| [微信小程序支付能力](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/payment.html) | 微信支付下单、调起支付、支付结果处理任务 | 支付签名、商户密钥和订单校验必须在服务端；前端只调起支付 |
| [微信订阅消息](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html) | 订阅消息授权和发送链路任务 | 必须处理用户拒绝、模板限制和服务端发送职责 |
| [微信分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html) | 包体积、首屏性能、分包路由任务 | 必须控制主包体积，公共资源和分包依赖不能随意重复 |
| [支付宝小程序 API](https://opendocs.alipay.com/mini/api) | 支付宝小程序 API 调用和平台能力任务 | API 调用必须按支付宝参数、权限和错误码处理，不得照搬微信 API |
