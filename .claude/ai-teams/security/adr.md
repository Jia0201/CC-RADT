---
id: "security-adr"
title: "ADR 规范"
type: "security-doc"
scope: "project"
owner: "doc"
status: active
---
# ADR 规范

## 1. ADR 定义

ADR 是 Architecture Decision Record，架构决策记录。

在 AI-Teams 中，ADR 用来记录影响工程长期结构的关键决策。ADR 只回答一个问题：为什么工程最终选择了这个设计？

ADR 不记录普通任务过程，不记录临时讨论，不替代日志、记忆、知识库和规则。

## 2. 维护者与决策者

- 维护者：Doc Agent。
- 决策者：Lead 主 Agent。
- 说明：外部资料或草案中出现的主决策角色，在 AI-Teams v1.0 工程语义中统一由 Lead 主 Agent 承担，不新增第二个决策角色。

## 3. 存放目录

```text
project/adr/
├── index.md
├── template.md
├── accepted/
└── rejected/
```

| 路径 | 说明 |
|---|---|
| `project/adr/index.md` | ADR 总索引 |
| `project/adr/template.md` | ADR 标准模板 |
| `project/adr/accepted/` | 已采纳 ADR |
| `project/adr/rejected/` | 已拒绝 ADR |

## 4. 什么时候需要 ADR

以下情况需要写 ADR：

1. 目录结构发生长期变化。
2. Agent 主体位置或职责边界发生变化。
3. 指令集位置或组织方式发生变化。
4. memory / kb / shared / security 的核心结构发生变化。
5. Hooks、Cron、Tools、MCP、Skills 的核心机制发生变化。
6. 引入或移除 CodeGraph、文档关系系统 等关键工程能力。
7. 错误处理、重试回流、锁、索引等协议发生变化。
8. 某个设计已经反复争论，后续容易忘记原因。
9. 该决策会影响多个 Agent 的长期行为。

## 5. 什么时候不需要 ADR

以下情况不需要 ADR：

1. 普通任务执行。
2. 普通 Bug 修复。
3. 普通文档修改。
4. 普通日志记录。
5. 单次 Agent 失败。
6. 临时想法。
7. 未验证猜测。
8. 不影响长期结构的小调整。

| 内容 | 存放位置 |
|---|---|
| 任务过程 | `logs/` |
| 当前协作状态 | `shared/` |
| Agent 工作状态 | `memory/agents/<agent>/` 或任务指定共享文件 |
| 会话恢复材料 | `memory/conversations/` |
| 长期记忆 | `memory/` |
| 可复用知识 | `kb/` |
| 长期决策原因 | `project/adr/` |

## 6. ADR 状态

ADR 只保留两种状态：

```text
accepted
rejected
```

| 状态 | 含义 | 存放目录 |
|---|---|---|
| `accepted` | 已采纳，当前生效 | `project/adr/accepted/` |
| `rejected` | 已拒绝，仅保留原因 | `project/adr/rejected/` |

暂不设计 `proposed`、`deprecated`、`superseded` 等复杂状态。如果未来需要替代旧 ADR，直接创建新的 ADR，并在旧 ADR 的关联中写明被哪个 ADR 替代。

## 7. ADR 编号规范

ADR 使用连续编号。

```text
ADR-0001-title-kebab-case.md
ADR-0002-title-kebab-case.md
ADR-0003-title-kebab-case.md
```

编号规则：

1. 编号递增。
2. 编号不可复用。
3. 已拒绝 ADR 的编号也不可复用。
4. 文件名使用英文 kebab-case。
5. 标题正文可以使用中文。

## 8. ADR 元数据规范

ADR 只保留能支持识别、决策和维护的必要元数据：

- `id`
- `title`
- `type`
- `status`
- `date`
- `owner`
- `decision_by`

ADR 关系使用可解析的标准 Markdown 相对链接，不维护标签注册表或显式链接清单。

## 9. ADR 标准模板

ADR 模板位于 [template](../project/adr/template.md)，必须包含：

- 背景。
- 决策。
- 原因。
- 影响范围。
- 后果。
- 关联。

## 10. ADR 创建流程

### 10.1 创建

当需要记录关键工程决策时：

1. 从 `project/adr/template.md` 复制模板。
2. 分配下一个 ADR 编号。
3. 填写背景、决策、原因、影响范围、后果。
4. 由 Lead 确认状态。
5. 移动到 `accepted/` 或 `rejected/`。
6. 更新 `project/adr/index.md`。

### 10.2 采纳

采纳后：

1. 文件放入 `project/adr/accepted/`。
2. `status` 写为 `accepted`。
3. 如果影响安全规则，需要更新 `security/`。
4. 如果影响 Agent，需要更新 `agents/`。
5. 如果影响记忆，需要由 Memory Agent 写入长期记忆摘要。
6. 如果影响知识库，需要由 Doc Agent 判断是否沉淀到 `kb/`。

### 10.3 拒绝

拒绝后：

1. 文件放入 `project/adr/rejected/`。
2. `status` 写为 `rejected`。
3. 在原因或后果中写明拒绝原因。
4. 更新 `project/adr/index.md`。

## 11. ADR 与其他文件的关系

| 文件类型 | 作用 |
|---|---|
| ADR | 记录为什么选择这个长期设计 |
| security | 记录安全边界和必须遵守的治理规则 |
| memory | 记录 Agent 需要长期记住什么 |
| kb | 记录可复用知识 |
| logs | 记录执行过程 |
| shared | 记录当前协作状态 |

示例：

```text
ADR：为什么指令放 tools/commands/
security：以后指令创建和维护的边界
tools/commands：实际指令文件
memory：Agent 需要记住“指令主体在 tools/commands”
kb：沉淀为可复用的 Harness 指令组织知识
```

## 12. 初始 ADR

AI-Teams 当前阶段保留以下初始 ADR：

- ADR-0001-agent-directory（源工程设计记录）
- ADR-0002-command-location（源工程设计记录）
- ADR-0003-memory-layering（源工程设计记录）
- ADR-0012-standard-markdown-navigation（源工程设计记录）
- ADR-0005-retry-flowback（源工程设计记录）
- ADR-0006-lightweight-lock（源工程设计记录）
- ADR-0007-lightweight-index（源工程设计记录）

## 13. 验收标准

ADR 规范完成后，工程必须满足：

1. `project/adr/index.md` 存在。
2. `project/adr/template.md` 存在。
3. `project/adr/accepted/` 存在。
4. `project/adr/rejected/` 存在。
5. ADR 模板包含背景、决策、原因、影响、后果、关联。
6. ADR 不替代日志、记忆、知识库和规则。
7. 只有长期结构性决策才写 ADR。
