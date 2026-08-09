---
id: "rule-tools-index"
title: "工具与能力路由"
type: "rule-index"
scope: "project"
owner: "doc"
status: active
---
# 工具与能力路由

| 需要 | 首选入口 | 说明 |
|---|---|---|
| 用户指令 | [index](../../tools/commands/index.md) | 先查指令说明，再执行 `tools/bin/` 对应脚本 |
| 自建规则创建 | [rule-create](../../tools/commands/ai/rule-create.md) | 只创建 `rule/custom/` 路由和索引，不写 KB 或安全正文 |
| 工程脚本 | [files](../catalog/files.md) | 精确查找 `tools/bin/` 文件，不加载全部脚本 |
| Claude Code Hooks | [index](../../hooks/index.md) | 事件、触发条件、输入输出和安全边界 |
| Agent Skills | `skills/agents/<agent>/index.md` | 只读当前 Agent 已绑定技能 |
| MCP | `mcp/agents/<agent>/index.md` | 只启用任务需要且已配置的服务器 |
| CodeGraph | [CODEGRAPH](../../index/CODEGRAPH.md) | 调用链、影响范围和大范围代码定位 |
| 定时任务 | [index](../../cron/index.md), [schedules](../../cron/schedules.md) | 健康检查和周期维护 |

工具不可用时应说明回退方式，不得通过无差别读取工程文件代替路由。
