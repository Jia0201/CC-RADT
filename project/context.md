---
id: "project-context"
title: "目标项目运行期上下文"
type: "project-state"
scope: "project"
owner: "doc"
status: active
---
# 目标项目运行期上下文

本文件记录 AI-Teams 当前正在管理的目标项目上下文。初始化会写入目标项目路径和基础画像；后续业务执行中，Doc 负责维护本文件，Lead 在关闭非平凡任务前检查 Doc 是否已处理或明确跳过更新。

## 当前状态

- AI-Teams harness 工程：当前 AI-Teams 根目录
- 目标项目：当前 AI-Teams 根目录
- 初始化状态：已初始化为主工程自检上下文
- 说明：主工程阶段允许目标项目等于 AI-Teams 自身；正式版安装到用户项目后，必须用 `--target` 写入真实目标项目路径。

## 运行期更新规则

- 新项目接入后，Doc 更新目标项目路径、安装形态、当前阶段和主要约束；Lead 负责确认路径和初始化状态。
- 每次需求进入时，Hook 先刷新 [change-log](./change-log.md)；Doc 按文件影响分类判断是否更新 UI、接口、依赖、验证、数据库或风险画像。
- PD 输出新需求后，关联到 `project/requirements/`。
- Plan-PM 生成执行计划后，关联到 `project/plans/`。
- Dev / QA / Security-Reviewer 发现稳定项目事实或风险后，先写入交接，再由 Doc 合并。
- Memory 并行判断是否需要写入恢复点、记忆候选或上下文压缩材料。
- Doc 更新项目图谱后，检查 `project/graph.md` 与 `kb/graph.md` 的关系。
