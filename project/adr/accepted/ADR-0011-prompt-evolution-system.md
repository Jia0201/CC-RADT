---
id: ADR-0011
title: 提示词版本化与失败驱动进化
type: adr
scope: project
status: accepted
date: 2026-07-19
owner: doc
decision_by: lead
---
# ADR-0011：提示词版本化与失败驱动进化

## 1. 背景

AI-Teams 的 12 个 Agent 已有职责、工作流、规则、记忆、知识库、Skills 和 MCP，但缺少独立、可版本化的 system prompt 与 user/task prompt。把全部约束直接写入 `.claude/agents/*.md` 会导致来源不清、变更不可比较、失败无法回归、安装包无法稳定复现。

任务失败后直接让 Agent 修改自己的活动提示词同样不可接受：它会把单次异常误写成长期规则，绕过 Role、QA 和 Security-Reviewer，并可能在运行中改变行为边界。

## 2. 决策

> 我们决定：新增 `prompts/` 作为提示词源码、Schema、注册表、图谱与评测基线；`.claude/agents/*.md` 由活动 system prompt 编译生成。Agent 调用使用结构化 user/task prompt。失败信号先写入 `shared/prompt-evolution/`，经根因路由、候选、评测和审批后才能激活，新版本只在下一次 Agent 调用或新会话生效。

同时决定：

- Hook 只采集脱敏事实，不直接编辑提示词。
- Agent 可以提交失败证据和建议，但不能修改自己的活动 system prompt。
- Lead 负责根因与低风险激活，Role 负责提示词版本和 Agent 内部文档，QA 负责回归评测，Security-Reviewer 负责注入与越权审查，Doc 负责索引和图谱。
- 项目事实、知识缺口、工具问题、安全边界、记忆恢复和协作协议必须写回各自本体，不能把所有问题都堆进 prompt。
- 激活必须保留上一版本和回滚入口。

## 3. 原因

- system/user 分层符合模型调用边界：稳定身份与硬约束进入 system，具体任务、项目上下文、输入输出合同进入 user/task。
- 版本、哈希、评测和回滚让提示词变化可追溯、可复现。
- 根因路由可防止 prompt 膨胀，减少 token 消耗和规则重复。
- 运行中不热替换能避免同一任务前后行为不一致。
- `.claude/agents/` 仍是 Claude Code 官方扫描入口，AI-Teams 继续管理其源码和编译链。

## 4. 影响范围

- 目录：`prompts/`、`.claude/agents/`、`shared/prompt-evolution/`、`security/`、`hooks/`、`tools/`、`index/`、`project/`、`kb/`。
- Agent：全部 12 个 Agent，重点影响 Lead、Role、QA、Security-Reviewer、Doc、Memory、Plan-PM。
- 指令：提示词状态、进化、差异、评测、激活、回滚、历史。
- 安全：提示词注入、权限声明、敏感信息、活动版本写入权限。
- 打包：包含活动版本、上一回滚版本、注册表、渲染器、评测基线和进化规则；不包含运行期原始失败与草稿候选。

## 5. 后果

### 正面影响

- 每个 Agent 有独立、可评测、可回滚的提示词。
- 单次失败可以转化为回归用例，而不是立即污染长期规则。
- Agent 调度具备明确的任务合同，输出缺失和范围漂移更容易被拦截。
- 文档关系图可以追踪 Agent、prompt、规则、记忆、知识库、工具和工作区的关系。

### 负面影响

- 激活流程增加了 Role、QA 和 Security-Reviewer 的检查成本。
- Prompt 编译后需要下一次调用或新会话才完全生效。
- 注册表、版本文件、官方 Agent 入口与索引必须保持一致。

### 需要注意

- Prompt 不是第二知识库，也不是第二安全规则库。
- 模型能力不足时应调整模型路由，不能无限追加提示词。
- 高风险变更必须人工批准；低风险也必须先通过回归评测。
- 失败事件不得保存密钥、凭据、完整敏感文件内容或本机绝对路径。

## 6. 关联

- 相关规则：[prompt-policy](../../../security/prompt-policy.md), [prompt-evolution-policy](../../../security/prompt-evolution-policy.md), [prompt-injection-policy](../../../security/prompt-injection-policy.md)。
- 相关目录：`prompts/`, `shared/prompt-evolution/`, `.claude/agents/`, `tools/bin/`, `tools/commands/ai/`。
- 相关 Agent：Lead、Role、QA、Security-Reviewer、Doc、Memory、Plan-PM 和四个 Dev。
- 相关索引：[index](../../../prompts/index.md), [graph](../../../prompts/graph.md), [INDEX](../../../index/INDEX.md), [FILES](../../../index/FILES.md), [graph](../../../kb/graph.md), [graph](../../graph.md)。
- 替代关系：扩展 [ADR-0001-agent-directory](./ADR-0001-agent-directory.md)、[ADR-0007-lightweight-index](./ADR-0007-lightweight-index.md) 和 [ADR-0009-rule-routing](./ADR-0009-rule-routing.md)，不替代它们。
