---
id: "kb-agents-lead-01-source-map"
title: "Lead 权威来源"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Lead 权威来源

## 什么时候使用

Lead 做任何路由、仲裁、关闭任务判断前，先用本文件确认应读取哪些工程文件。

## 来源

| 来源 | 使用场景 | Codex 生成内容时要遵守什么 |
|---|---|---|
| [CLAUDE](../../../CLAUDE.md) | 进入工程、识别 AI-Teams 大脑和目标项目边界 | 不把 CLAUDE 当长规则手册；只作为入口地图 |
| [playbook](../../../playbook.md) | 多 Agent 协作主流程、重试、QA、收尾 | 非平凡任务必须创建任务单、执行方案、状态更新和交接 |
| [index](../../../security/index.md) | 动作规则总入口 | 高风险操作前必须检查对应安全规则 |
| [lead](../../../security/agent-playbooks/lead.md) | Lead 专属动作规范 | Lead 只能调度和验收，不替代 Owner 长期维护文件 |
| [index](../../../shared/index.md) | 实时任务、锁、回流、状态板 | 状态变更必须可追溯到任务单、执行方案、交接或回流记录 |
| [index](../../../project/index.md) | 目标项目画像和运行期项目上下文 | 所有项目类任务必须读取 project，并让 Doc 并行维护 |
| [index](../../../memory/index.md) | 共享记忆和 Agent 记忆入口 | Lead 只提交候选判断，不直接写长期记忆 |
| [graph](../../graph.md) | 标准 Markdown 知识图谱关系 | 变更 Agent、project、shared、security 后检查图谱指针 |
