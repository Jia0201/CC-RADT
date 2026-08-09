---
id: "rule-project-backend-syntax"
title: "项目后端语法与工程规范"
type: "rule"
scope: "project"
owner: "doc"
status: active
---
# 项目后端语法与工程规范

- 语言、框架和版本先查 [stack](../../../project/stack.md)，项目约定先查 [imported-rules](../../../project/imported-rules.md)。
- 错误处理、日志、配置、事务、迁移、并发、资源释放、测试和构建必须沿用项目现有模式。
- 项目没有明确规则时，才读取对应后端 Agent KB 的官方规范。
- 不硬编码密钥，不忽略错误，不改变未确认的数据库或 API 契约，不跳过测试。

<!-- AI-TEAMS:project-rule-backend-syntax:BEGIN -->
## 自动识别语法线索

| 扩展名/文件 | 数量 |
|---|---|
| `.json` | 4 |
| `.md` | 4 |

这些只是文件线索，正式语法和工程规范仍需从项目规则、配置和专业 Agent 复核。
<!-- AI-TEAMS:project-rule-backend-syntax:END -->
