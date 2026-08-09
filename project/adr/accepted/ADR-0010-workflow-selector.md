---
id: ADR-0010
title: 工作流选择器
type: adr
scope: project
status: accepted
date: 2026-06-27
owner: doc
decision_by: lead
---
# ADR-0010：工作流选择器

## 1. 背景

AI-Teams 的多 Agent 协作链路已经覆盖需求澄清、计划、开发、QA、Doc、Memory、Role 和 Security-Reviewer。完整链路适合高风险或中等复杂任务，但如果所有任务都强制进入完整重流程，会产生三个长期问题：

- 简单问答、小修和单域任务被过度流程化，Lead、PD、Plan-PM、Doc、Memory、Security-Reviewer 都会消耗不必要上下文。
- 高风险任务和普通任务使用同一入口，容易让删除、权限、Hooks、MCP、Skills、settings、迁移等变更没有足够早的安全前置。
- 任务关闭时缺少统一记忆判断，可能把无长期价值的过程写成记忆，也可能漏掉应该沉淀的项目事实或恢复材料。

因此需要一个轻量但明确的工作流选择器，让 Lead 在收到需求后先选择任务形态，再决定 Agent 组合、下发机制和收尾门。

## 2. 决策

> 我们决定：在 `playbook.md` 中维护 `WF-01` 到 `WF-12` 工作流选择器，默认不再把所有任务套入完整重流程。Lead 必须先选择工作流，再按工作流决定 Agent 组合、任务单深度、QA/Doc/Security/Role 分档和 M0-M3 Memory 收尾门。

工作流按任务复杂度和风险分层：

- 简单问答、低风险小修和单技术域任务走轻量流。
- Bug、前后端联调、需求澄清和标准功能开发走对应标准流。
- 删除、权限、Hooks、MCP、Skills、settings、迁移、安全边界等高风险变更强制升级 `WF-11`。
- 文档、索引、标准 Markdown、KB、project、memory 和 ADR 治理走 `WF-12`。

所有工作流关闭前必须给出 Memory 结论，但只有 M2/M3 才产生候选记忆或正式记忆。

## 3. 原因

- 轻量任务需要快速反馈；完整链路会放大协作成本，并把无关上下文带入当前任务。
- 中等复杂任务仍需要 PD、Plan-PM、Dev、QA、Doc、Memory 和 Security-Reviewer 的协作，但应由工作流明确触发，而不是默认全量启动。
- 高风险任务必须在执行前识别和升级，避免执行后才补安全审查。
- M0-M3 收尾门把“是否值得记忆”变成每次关闭都要回答的问题，同时避免把 project 事实、共享记忆和 Agent 记忆混在一起。
- QA/Doc/Security/Role 分档允许同一工作流按风险和产物深度调整参与程度，减少过度维护。

## 4. 影响范围

- 目录：`playbook.md`、`agents/`、`index/`、`kb/`、`project/`、`memory/`、`shared/`、`security/`。
- Agent：Lead、PD、Plan-PM、四个 Dev、QA、Doc、Memory、Role、Security-Reviewer。
- 规则：工作流选择、下发机制、运行期维护、Agent Playbook、安全升级和收尾条件。
- 记忆：M0-M3 Memory 收尾门区分不写记忆、记忆检查、候选记忆和正式记忆。
- 知识库：`kb/graph.md` 登记工作流节点关系，`project/graph.md` 登记项目运行时读取关系。
- 安全：`WF-11` 成为高风险自动升级入口，Security-Reviewer 在 S2 前置审查。

## 5. 后果

### 正面影响

- 小任务可以快速完成，不再被完整重流程拖慢。
- Lead 能用统一编号记录实际工作流，方便 QA、Doc、Memory 和 Security-Reviewer 追踪。
- 高风险变更更早进入安全前置。
- Memory 结论成为关闭条件，减少遗漏和误写。
- 文档关系图可以直接看到 WF、Agent、shared、memory、security 和 project 的关系。

### 负面影响

- Lead 必须先判断工作流，选择错误会影响 Agent 组合和验证深度。
- 索引、图谱和 Agent workflow 指针需要随着工作流变化同步维护。
- 轻量流如果误用于复杂任务，可能遗漏任务单、锁、QA 或安全证据。

### 需要注意

- 工作流选择器不是第二套安全规则；安全规则本体仍在 `security/`。
- `project/` 是项目画像区，不承载工程规则本体。
- `WF-01` 和轻量流也必须在最终回复中说明实际采用的工作流和 Memory 结论。
- 一旦触发高风险条件，无论当前选择哪个工作流，都必须升级 `WF-11`。

## 6. 关联

- 相关规则：[playbook](../../../playbook.md), [runtime-maintenance-policy](../../../security/runtime-maintenance-policy.md), [task-policy](../../../security/task-policy.md), [index](../../../security/agent-playbooks/index.md)。
- 相关目录：`agents/`, `shared/`, `memory/`, `kb/`, `project/`, `security/`。
- 相关 Agent：Lead、PD、Plan-PM、Dev、QA、Doc、Memory、Role、Security-Reviewer。
- 相关索引：[INDEX](../../../index/INDEX.md), [AGENTS](../../../index/AGENTS.md), [FILES](../../../index/FILES.md), [graph](../../../kb/graph.md), [graph](../../graph.md)。
- 替代关系：扩展 [ADR-0007-lightweight-index](./ADR-0007-lightweight-index.md) 和 [ADR-0009-rule-routing](./ADR-0009-rule-routing.md) 的按需读取思想，不替代它们。
