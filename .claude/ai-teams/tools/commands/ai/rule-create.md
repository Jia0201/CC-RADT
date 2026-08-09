---
id: "tools-commands-ai-rule-create"
title: "自建规则创建指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 自建规则创建指令

用于创建 AI-Teams 自建规则路由。该指令只写入 `rule/custom/` 和索引，不写安全正文、不写知识库。

## 使用前检查

1. 先读 [rule-policy](../../../security/rule-policy.md)，确认确实需要新增规则。
2. 判断规则类型：
   - Agent 读取链或协作边界：`--scope agents`
   - 目标项目读取约束：`--scope project`
   - 安全规则入口：`--scope security`
3. 如规则影响长期结构、职责边界或核心机制，安排 Doc 创建 ADR。

## 命令

```bash
node tools/bin/ai-teams-rule-create.mjs --id <kebab-id> --title "<中文标题>" --scope <agents|project|security> --owner <agent> --trigger "<触发条件>" --write
```

低侵入安装布局：

```bash
node .claude/ai-teams/tools/bin/ai-teams-rule-create.mjs --id <kebab-id> --title "<中文标题>" --scope <agents|project|security> --owner <agent> --trigger "<触发条件>" --write
```

## 示例

```bash
node tools/bin/ai-teams-rule-create.mjs --id api-contract-check --title "接口契约检查" --scope project --owner doc --trigger "涉及 API 字段、DTO、表单或前后端联调变更" --write
```

## 验收

- `rule/custom/index.md` 出现新规则。
- 对应分类索引出现新规则。
- 需要时更新 [graph](../../../kb/graph.md)、[导航规范](../../../index/NAVIGATION.md)、[FILES](../../../index/FILES.md)。
- 运行 `bash tools/bin/ai-teams-check.sh`。
