---
id: "index-reading-modes"
title: "Agent 分级读取策略"
type: "index"
scope: "project"
owner: "lead"
status: active
---
# Agent 分级读取策略

本文件用于减少 Agent 每次任务的固定读取负担。Lead 分派任务时必须声明读取模式；Agent 可因风险升高主动升级读取模式，但不得在缺少必要规则时执行高风险写入。

## quick 模式

适用：简单解释、轻量查询、单文件低风险文档确认。

必读：

1. `index/ENTRY.md` 和 `rule/index.md`
2. `index/INDEX.md`
3. 当前 Agent 主文档：`agents/<agent>/<agent>.md`
4. 当前目标文件或用户指定文件

## task 模式

适用：普通非平凡任务、文档治理、脚本调整、低风险代码修改。

必读：

1. quick 模式全部文件
2. `playbook.md`
3. `agents/<agent>/playbook.md`
4. `security/agent-playbooks/<agent>.md`
5. `security/index.md`
6. `shared/index.md`
7. 如涉及目标项目，读取 `rule/agents/<agent>.md` 和 `rule/project/index.md`，再按路由选择项目文件；不默认加载整个 `project/`

## governance 模式

适用：安全规则、Hooks、MCP、Skills、Agent、memory、kb、shared、project、打包、升级、回滚、删除、跨目录多文件修改。

必读：

1. task 模式全部文件
2. `security/file-ownership.md`
3. `security/sensitive-files.md`
4. `security/delete-policy.md`
5. `security/lock-policy.md`
6. `security/state-policy.md`
7. `security/state-transaction-policy.md`
8. `security/task-policy.md`
9. `security/escalation-policy.md`
10. `security/runtime-maintenance-policy.md`
11. `shared/locks/LOCKS.md`
12. `shared/events/index.md`
13. `shared/transactions/index.md`
14. `shared/task-plan.md`
15. `shared/pipeline-status.md`
16. `shared/supervision/current.md`
17. 对应主题索引，例如 `mcp/index.md`、`skills/index.md`、`memory/index.md`、`kb/graph.md`

## 升级规则

- 发现敏感文件、删除、权限、锁冲突、状态冲突、MCP/Skills 安装、Hook 修改时，立即升级到 governance。
- 任务从只读变为写入时，至少升级到 task。
- 任务涉及目标项目实际代码时，必须读取 `project/` 关键文件和项目验证命令。
