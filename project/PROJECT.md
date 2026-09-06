---
id: "project-project"
title: "项目管理入口"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 项目管理入口

AI-Teams 主工程项目管理入口。

## 当前版本

1.1.0

## 当前阶段

v1.1.0 已完成验证并在 GitHub 正式发布，来源映射见 [发布记录](../tools/release/publications/v1.1.0.md)。

## 管理目标

- 维护 AI-Teams 主工程的项目画像、技术栈、常用命令、架构、验证方式、依赖、风险和升级状态。
- 支持正式版、精简版、升级、回滚、项目初始化和后续 v2 扩展。
- 为 Lead、PD、Plan-PM、Dev、QA、Doc、Memory、Role 和 Security-Reviewer 提供一致项目上下文。
- 在业务执行中持续记录目标项目事实，让 Agent 对目标项目的理解随任务推进逐步变厚。

## 关联文件

- `project/project-profile.md`
- `project/context.md`
- `project/change-log.md`
- `project/requirements/index.md`
- `project/plans/index.md`
- `project/stack.md`
- `project/commands.md`
- `project/architecture.md`
- `project/ui-style.md`
- `project/api-contracts.md`
- `project/verification.md`
- `project/dependencies.md`
- `project/risks.md`
- `project/upgrade-state.md`
- `project/rules/index.md`
- `project/adr/index.md`
- `project/adr/template.md`
- `index/NAVIGATION.md`
- `security/adr.md`
- `security/project-policy.md`

## 运行期管理规则

- 初始化只提供第一轮项目画像；后续任务执行中必须继续维护项目上下文。
- Doc 是 `project/` 的运行期管理者，负责维护项目入口、项目事实、状态、规则、风险、日志入口和项目图谱。
- 每次需求进入时先由 Hook 刷新 `project/change-log.md`；全体 Agent 在分析和执行前读取已合入变化，远端待同步提交不得当作当前项目事实。
- Lead 关闭非平凡任务前检查 Doc 是否已处理或明确跳过 `project/context.md`、`project/change-log.md`、需求、计划、命令、架构、验证、风险、规则和图谱更新。
- Dev / QA / PD / Plan-PM / Security-Reviewer 发现稳定项目事实时，先写入交接、任务单、执行方案或验证记录，再由 Doc 合并。
- Memory 并行判断项目执行中哪些内容属于长期恢复事实，不替代 Doc 写项目事实。
- Security-Reviewer 并行监督 Agent 越界、敏感文件、删除、锁、命令和权限风险，并把项目风险来源交给 Doc 合并。
- `project/` 不写任务过程流水，过程写入 `shared/` 或 `logs/`；长期恢复信息写 `memory/`，通用知识写 `kb/`。
- 详细规则见 [project-policy](../security/project-policy.md)。
