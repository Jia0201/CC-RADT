---
id: "rule-routing"
title: "规则按需读取协议"
type: "rule-protocol"
scope: "project"
owner: "lead"
status: active
---
# 规则按需读取协议

## 路由步骤

1. Lead 判断任务类型和目标项目范围。
2. 当前 Agent 读取自己的 `rule/agents/<agent>.md`。
3. 按 [index](./tasks/index.md) 选择一个主要任务路由；跨域任务最多增加必要的辅助路由。
4. 检查 [index](./custom/index.md) 是否存在当前任务的自建规则；命中时只追加匹配的自建规则，不全量读取 custom。
5. 涉及代码文件时先查 [files](./project/files.md)；涉及目录职责时查 [structure](./project/structure.md)。
6. 涉及安全、共享状态、记忆或工具时，分别进入 [index](./security/index.md)、[index](./shared/index.md)、[index](./memory/index.md)、[index](./tools/index.md)。
7. 涉及 AI-Teams 工程文件时查 [files](./catalog/files.md) 或 [index](./engineering/index.md)。
8. 只读取路由明确列出的正文；缺失事实才扩大到 CodeGraph、`rg` 或必要源码。

## 扩大读取条件

只有以下情况可以扩大搜索：索引缺失、索引已过期、文件移动、当前事实与索引冲突、需要调用链证据。扩大搜索后由 Doc 刷新目录与项目规则，避免下一次重复扫描。

## 更新触发

- 项目初始化完成。
- 项目目录、入口、技术栈、UI、接口或工程规范变化。
- Agent、知识库、Security、Tools、Hooks、MCP、Skills、指令或工作流位置变化。
- Rule 索引与实际文件不一致。
- 自建规则新增、废弃或从草案转为 active。
