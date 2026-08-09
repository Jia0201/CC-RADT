---
id: "kb-agents-dev-frontend-miniapp-00-index"
title: "Dev-Frontend-Miniapp 知识库索引"
type: "knowledge-index"
scope: "agent"
owner: "doc"
status: active
---

# Dev-Frontend-Miniapp 知识库索引

Dev-Frontend-Miniapp 负责微信小程序、支付宝小程序、uni-app 及小程序平台适配开发。本知识库只保存小程序平台强相关规则，不写平台百科。

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | uni-app、微信小程序、支付宝小程序官方来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 登录、授权、支付、订阅、分享、生命周期、分包和平台差异规则 |
| [03-code-style](./03-code-style.md) | 小程序和 uni-app 代码风格 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于小程序代码审查的清单 |
| [05-do-not](./05-do-not.md) | 小程序开发禁区 |

## 使用规则

- 什么时候使用：Lead 或 Plan-PM 分派微信小程序、支付宝小程序、uni-app、平台适配、登录授权、支付、订阅消息、分包、包体积任务时。
- Codex 生成代码时要遵守：先确认目标平台和平台限制，再读 [development-frontend-miniapp-policy](../../../security/development-frontend-miniapp-policy.md) 与本知识库；不得把 Web 浏览器能力直接套到小程序。
