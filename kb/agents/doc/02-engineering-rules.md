---
id: "kb-agents-doc-02-engineering-rules"
title: "Doc 工程文档知识"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Doc 工程文档知识

## project 管理

- 什么时候使用：初始化、需求变化、架构变化、命令变化、验证变化、风险变化。
- Codex 要遵守：`project/` 是目标项目认知入口，由 Doc 持续维护；所有 Agent 都要频繁读取。

## 索引维护

- 什么时候使用：新增、迁移、删除、重命名文件。
- Codex 要遵守：更新 `index/FILES.md`、相关目录 index、`kb/graph.md` 或 `project/graph.md`。

## 知识沉淀

- 什么时候使用：QA 多次遇到同类问题、项目规则稳定、可复用经验形成。
- Codex 要遵守：先放候选或项目文档，验证后再进入 KB；动作规则不写入 KB。

## 运行期维护

- 什么时候使用：项目初始化写入、需求/计划/任务变化、文件新增/迁移/删除/重命名、Agent/MCP/Skills/Hook/Tools/规则变化、QA 发现稳定缺陷模式。
- Codex 要遵守：运行规则读取 [runtime-maintenance-policy](../../../security/runtime-maintenance-policy.md)；Doc 先更新事实源文件，再检查 `index/INDEX.md`、`index/FILES.md`、相关目录索引、`project/graph.md`、`kb/graph.md` 和 文档链接。项目事实写 `project/`，可复用知识写 KB，动作规则仍放 `security/`、`playbook.md`、`shared/`。
- 交接要求：向 Lead 输出“已更新 / 无需更新 / blocked”的维护结论，写明检查过的索引和图谱。

## ADR

- 什么时候使用：目录结构、Agent 位置、指令位置、记忆层级、锁、图谱、MCP/Skills 机制发生长期结构变化。
- Codex 要遵守：按 `security/adr.md` 编号、归档、索引。
