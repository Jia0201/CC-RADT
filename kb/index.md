---
id: kb-index
title: 知识库
type: kb-index
scope: project
owner: doc
status: active
---

# 知识库

知识库用于保存稳定、可复用、经过验证的知识。

知识库与日志、原始对话和记忆候选相互独立。

## 入口

- [graph](./graph.md)：工程大脑知识图谱。
- [index](./shared/index.md)：共享知识库。
- [index](./agents/index.md)：Agent 独立知识库。
- [index](../project/adr/index.md)：长期结构性决策来源，不替代知识库。
- `kb/candidates/`：候选知识，正式写入前由 Doc 验证。
- `kb/archive/`：过期或被替代的知识。

## 写入边界

- 正式知识库由 Doc 管理。
- 未验证内容先进入 `kb/candidates/`。
- 记忆候选不得直接写入知识库，必须先由 Memory / Doc 判断。
- 日志、任务过程和原始会话不进入正式知识库。
- ADR 不替代知识库；ADR 记录为什么选择某个长期结构，知识库记录可复用知识。Doc 可把已验证 ADR 结论沉淀为知识条目。
- 敏感文件内容不得进入知识库。

## 共享知识

- [engineering-brain](./shared/engineering-brain.md)
- [markdown-document-standard](./shared/markdown-document-standard.md)
- [agent-collaboration-protocol](./shared/agent-collaboration-protocol.md)
- [memory-and-compression](./shared/memory-and-compression.md)
- [shared-workspace-protocol](./shared/shared-workspace-protocol.md)

## 开发 Agent 知识库

- [00-index](./agents/dev-backend-service/00-index.md)：Python、Go、Node.js / TypeScript、服务端工程、API、云原生服务开发。
- [00-index](./agents/dev-backend-systems/00-index.md)：C、C++、Java、系统级后端和强约束后端开发。
- [00-index](./agents/dev-frontend-web/00-index.md)：Vue、React、Angular、TypeScript Web 前端开发。
- [00-index](./agents/dev-frontend-miniapp/00-index.md)：微信小程序、支付宝小程序、uni-app 平台适配开发。

## 关键协作 Agent 知识库

- [00-index](./agents/lead/00-index.md)：多 Agent 调度、并行监督、回流仲裁和任务关闭。
- [00-index](./agents/pd/00-index.md)：需求澄清、产品目标、用户场景、范围边界和验收标准。
- [00-index](./agents/plan-pm/00-index.md)：任务拆解、依赖排序、并行边界、风险控制和验收安排。
- [00-index](./agents/qa/00-index.md)：测试设计、代码审查、回归验证和浏览器自动化验收。
- [00-index](./agents/memory/00-index.md)：共享记忆、Agent 记忆、候选记忆和上下文压缩。
- [00-index](./agents/doc/00-index.md)：`project/` 管理、文档治理、索引、ADR 和 文档关系图。
- [00-index](./agents/role/00-index.md)：Agent 职责边界、能力补强、Skills/MCP 绑定和运行期指引维护。
- [00-index](./agents/security-reviewer/00-index.md)：安全审查、敏感文件、权限边界、MCP/Hook 风险和开发禁区。
