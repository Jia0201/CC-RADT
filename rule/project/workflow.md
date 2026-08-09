---
id: "rule-project-workflow"
title: "目标项目工作流索引"
type: "rule"
scope: "project"
owner: "doc"
status: active
---
# 目标项目工作流索引

## 执行顺序

1. 读取 [context](../../project/context.md)、[change-log](../../project/change-log.md) 和当前任务对应的 Agent 路由。
2. 从 [imported-rules](../../project/imported-rules.md) 确认项目已有工程规范、语法和禁区。
3. 从 [commands](../../project/commands.md) 选择构建、测试、lint、类型检查或运行命令。
4. 从 [verification](../../project/verification.md) 获取验收标准，缺失时先由 QA/Doc 补齐。
5. 涉及接口时读取 [api](./backend/api.md)；涉及页面时读取 [ui](./frontend/ui.md)。
6. 完成后写交接，Doc 更新本规则索引中的稳定项目事实。

初始化扫描只建立第一版，Agent 复核结果才是正式项目规则。
