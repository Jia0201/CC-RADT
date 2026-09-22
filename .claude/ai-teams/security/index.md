---
id: "security-index"
title: "安全索引"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 安全索引

本目录保存 AI-Teams 的安全规则、动作规则和安全边界。Security-Reviewer 管理规则本体，Lead 在调度和高风险操作前必须检查。

## 文件

| 文件 | 用途 |
|---|---|
| [file-ownership](./file-ownership.md) | 文件 Owner 和跨 Owner 写入边界 |
| [sensitive-files](./sensitive-files.md) | 敏感文件识别与处理 |
| [delete-policy](./delete-policy.md) | 删除分级、确认、快照、回滚 |
| [upgrade-policy](./upgrade-policy.md) | 外部升级、指纹信任、数据保护与事务恢复边界 |
| [task-policy](./task-policy.md) | 任务单与执行方案规则 |
| [project-policy](./project-policy.md) | 目标项目初始化、运行期项目画像和项目管理更新规则 |
| [runtime-maintenance-policy](./runtime-maintenance-policy.md) | Doc / Memory / Role 在运行期维护索引、图谱、记忆、项目文档和 Agent 指引的规则 |
| [development-policy](./development-policy.md) | 四个开发 Agent 的通用开发底线和专属规则入口 |
| [development-frontend-web-policy](./development-frontend-web-policy.md) | Dev-Frontend-Web 的 Web 前端开发规则 |
| [development-frontend-miniapp-policy](./development-frontend-miniapp-policy.md) | Dev-Frontend-Miniapp 的小程序开发规则 |
| [development-backend-systems-policy](./development-backend-systems-policy.md) | Dev-Backend-Systems 的强类型系统后端开发规则 |
| [development-backend-service-policy](./development-backend-service-policy.md) | Dev-Backend-Service 的弱类型/服务端工程开发规则 |
| [interface-contract-policy](./interface-contract-policy.md) | 前后端字段契约、变更兼容、QA 门禁和 Doc 更新职责 |
| [mcp-policy](./mcp-policy.md) | MCP 发现、登记、分配、启用和密钥边界规则 |
| [rule-policy](./rule-policy.md) | 自建 rules 创建、审查、启用和 KB 边界规则 |
| [lock-policy](./lock-policy.md) | 锁、多文件锁、死锁处理 |
| [state-policy](./state-policy.md) | 任务计划和流水线状态更新规则 |
| [state-transaction-policy](./state-transaction-policy.md) | 状态事件、状态事务和文件级原子写入规则 |
| [escalation-policy](./escalation-policy.md) | 首次失败后的 Lead 接管、一次定向重试和回流规则 |
| [supervision-policy](./supervision-policy.md) | 10 秒心跳、任务跑偏、权限/错误检查和 Lead 主动接管 |
| [workspace-policy](./workspace-policy.md) | shared 工作区写入和归档边界 |
| [context-compression-policy](./context-compression-policy.md) | 上下文压缩 Hook 和手动压缩安全规则 |
| [导航规范](../index/NAVIGATION.md) | 标准 Markdown 链接与文档关系维护规则 |
| [prompt-policy](./prompt-policy.md) | system/task 提示词分层、Owner、版本和上下文边界 |
| [prompt-injection-policy](./prompt-injection-policy.md) | 直接与间接提示词注入、外部内容和工具输出的信任边界 |
| [prompt-evolution-policy](./prompt-evolution-policy.md) | E0-E3 失败驱动候选、评测、激活、监控和回滚 |
| [adr](./adr.md) | ADR 创建和验收规范 |
| [index](./agent-playbooks/index.md) | Agent 专属动作规范 |

## 核心规则

- 敏感文件默认只检测存在，不读取内容。
- 修改受保护范围前检查 [file-ownership](./file-ownership.md)、[lock-policy](./lock-policy.md) 和必要的 [state-transaction-policy](./state-transaction-policy.md)。
- 删除用户项目文件必须获得用户明确确认。
- 高风险文件修改必须说明原因、影响和验证结果。
- 开发类任务必须读取 [development-policy](./development-policy.md) 和对应专属开发规则，前端 Web / 小程序、强类型后端 / 弱类型服务端必须分开执行。
- 涉及跨端、跨服务或公共接口时，必须读取 [interface-contract-policy](./interface-contract-policy.md)，并以 [index](../shared/contracts/index.md) 中已登记契约作为实现、Mock、测试和发布依据。
- 涉及目标项目分析、开发、测试、重构、审计、文档治理或初始化时，必须读取 [project-policy](./project-policy.md)，区分 AI-Teams harness 工程和目标项目。
- 非平凡任务必须读取 [runtime-maintenance-policy](./runtime-maintenance-policy.md)，确认 Doc、Memory、Role 是否需要并行维护索引、图谱、记忆、project 和 Agent 指引。
- MCP 使用、安装、登记和跨 Agent 调用必须读取 [mcp-policy](./mcp-policy.md)；MCP / Skills 安装不得自动执行未知第三方代码。
- 新增自建 rules 必须读取 [rule-policy](./rule-policy.md)；`rule/custom/` 只做路由，动作规则放 `security/`，知识沉淀放 `kb/`。
- `.claude/` 只放 Claude Code 官方入口：settings 与扁平 `.claude/agents/*.md`；规则、记忆、知识库、共享工作区和组件正文仍在 AI-Teams 工程目录。
- 每个 Agent 的 playbook 规则本体位于 `security/agent-playbooks/<agent>.md`；Agent 目录下的 `playbook.md` 只作为指针。
- ADR 规范位于 `security/adr.md`；长期结构性决策记录在 `project/adr/`，由 Doc 维护、Lead 决策。
- 提示词源码位于 `prompts/`，运行期失败事实位于 `shared/prompt-evolution/`；Hook 不得编辑 prompt，Agent 不得修改自己的活动 system prompt。

## 工作流安全分档

Lead 必须先按 [playbook](../playbook.md) 选择 `WF-01` 到 `WF-12`，再决定安全和监督深度。安全模块负责定义这些动作规则，KB 只保存知识，不保存动作规则本体。

| 分档 | 位置 | 含义 |
|---|---|---|
| QA：`Q0/Q1/Q2` | [qa](./agent-playbooks/qa.md) | 不参与 / 轻量检查 / 完整验证 |
| Doc：`D0/D1/D2` | [doc](./agent-playbooks/doc.md) | 不更新 / 更新 project 事实 / 更新索引图谱和知识候选 |
| Memory：`M0/M1/M2/M3` | [refresh-rules](../memory/refresh-rules.md) | 不写记忆 / 记忆检查 / 候选记忆 / 正式记忆 |
| Security：`S0/S1/S2` | [security-reviewer](./agent-playbooks/security-reviewer.md) | 不介入 / 轻量审查 / 前置安全审查 |
| Role：`R0/R1/R2` | [role](./agent-playbooks/role.md) | 不介入 / 检查指针 / 更新 Agent 指引 |

删除、权限、Hooks、MCP、Skills、settings、敏感边界、数据迁移、鉴权、支付、用户数据、生产配置或不可逆命令，必须升级为 `WF-11` 并进入 `S2` 前置安全审查。

## Agent 执行前必须检查

1. 根动作链：[playbook](../playbook.md)
2. Agent 专属规则：`security/agent-playbooks/<agent>.md`
3. 任务与执行方案规则：[task-policy](./task-policy.md)
4. 项目管理规则：[project-policy](./project-policy.md)
5. 运行期维护规则：[runtime-maintenance-policy](./runtime-maintenance-policy.md)
6. 开发类任务规则：[development-policy](./development-policy.md) 和对应专属规则：
   - [development-frontend-web-policy](./development-frontend-web-policy.md)
   - [development-frontend-miniapp-policy](./development-frontend-miniapp-policy.md)
   - [development-backend-systems-policy](./development-backend-systems-policy.md)
   - [development-backend-service-policy](./development-backend-service-policy.md)
7. MCP 使用与安装规则：[mcp-policy](./mcp-policy.md)
8. 自建规则管理：[rule-policy](./rule-policy.md)
9. 接口契约治理规则：[interface-contract-policy](./interface-contract-policy.md)
10. 文件所有权：[file-ownership](./file-ownership.md)
11. 锁规则：[lock-policy](./lock-policy.md)
12. 状态规则：[state-policy](./state-policy.md)
13. 状态事件与事务规则：[state-transaction-policy](./state-transaction-policy.md)
14. 敏感文件与删除规则：[sensitive-files](./sensitive-files.md)、[delete-policy](./delete-policy.md)
15. 提示词、模型调用合同或失败驱动优化：[prompt-policy](./prompt-policy.md)、[prompt-injection-policy](./prompt-injection-policy.md)、[prompt-evolution-policy](./prompt-evolution-policy.md)
