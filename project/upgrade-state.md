---
id: "project-upgrade-state"
title: "升级状态"
type: "project-rule"
scope: "project"
owner: "doc"
status: active
---
# 升级状态

## 当前版本

1.1.0

## 最近升级

从 1.0.0 升级至 1.1.0，增加只读研发观察台并完善运行链路。

## 状态说明

升级流程当前以文档和工具骨架形式预留，真实执行逻辑后续由“已在项目中运行升级指令”实现。

## 升级保护规则

- 本文件由 Doc 维护；Lead 提供升级决策，Security-Reviewer 校验风险边界。
- 不修改用户项目源代码。
- 不覆盖用户项目配置、业务文档、本地密钥、私有 MCP、私有 Skills。
- 保留用户已有 `CLAUDE.md` 中非 AI-Teams 区块。
- 升级前创建快照，先执行 dry-run，再输出变更清单。
- 升级完成后写入日志、更新 manifest、更新索引，并提供回滚方案。
