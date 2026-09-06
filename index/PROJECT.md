---
id: "index-project"
title: "项目索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# 项目索引

## 项目知识图谱

- 项目图谱：[graph](../project/graph.md)
- 项目管理索引：[index](../project/index.md)
- 项目运行期上下文：[context](../project/context.md)
- 需求前代码变化：[change-log](../project/change-log.md)
- 图谱模板：`templates/project-graph/template.md`
- 初始化入口：`tools/commands/ai/init-project.md`
- 初始化脚本：`tools/bin/ai-teams-init-project.sh`

## 项目

- 名称：AI-Teams
- 版本：1.1.0
- 阶段：v1.1.0 已完成验证并正式发布，发布映射见 `tools/release/publications/v1.1.0.md`
- 首选编辑器：Claude Code
- 兼容预留：Codex、OpenCode

## 项目管理文件

- `project/PROJECT.md`：项目管理入口
- `project/index.md`：项目管理索引
- `project/context.md`：目标项目运行期上下文
- `project/change-log.md`：每次需求进入前刷新最近已合入提交、变更文件和影响分类
- `project/rules/index.md`：项目规则索引
- `project/project-profile.md`：项目画像
- `project/requirements/index.md`：需求索引
- `project/plans/index.md`：计划索引
- `project/stack.md`：技术栈
- `project/commands.md`：项目命令
- `project/architecture.md`：架构
- `project/verification.md`：验证方式
- `project/dependencies.md`：依赖
- `project/risks.md`：风险
- `project/upgrade-state.md`：升级状态
- `project/adr/index.md`：ADR 总索引
- `project/adr/template.md`：ADR 标准模板
- `index/NAVIGATION.md`：标准 Markdown 路径、索引和关系图规范

## 运行期规则

- 项目初始化只写第一轮画像；后续任务执行必须继续维护 `project/`。
- Doc 是 `project/` 的正式维护者，负责项目上下文、规则、状态、风险、验证和项目图谱。
- Lead 关闭非平凡任务前按 [project-policy](../security/project-policy.md) 检查 Doc 是否已处理或明确跳过项目更新。
- Dev / QA / PD / Plan-PM / Security-Reviewer 发现稳定项目事实时，先写交接、任务单、执行方案或验证记录，由 Doc 合并到 `project/`。

## 验证

见 `project/verification.md` 和 `tools/bin/ai-teams-check.sh`。

## CodeGraph

见 `index/CODEGRAPH.md` 和 `index/FILES.md`。

## 标准 Markdown

见 `index/NAVIGATION.md` 和 `kb/graph.md`。

## ADR

见 `project/adr/index.md` 和 `security/adr.md`。
