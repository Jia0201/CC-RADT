---
id: "kb-agents-role-review-checklist"
title: "Role 审查清单"
type: "review-checklist"
scope: "agent"
owner: "doc"
status: active
---
# Role 审查清单

## 职责边界

- [ ] 角色是否明确说明负责事项、不负责事项、输入和输出？
- [ ] 是否与其他 Agent 存在职责重叠且没有仲裁说明？
- [ ] 是否避免把一次性任务失败写成永久职责变化？

## 文件同步

- [ ] `agents/<agent>/` 组件文件之间是否一致？
- [ ] `agents/index.md`、Agent KB 指针和知识库索引是否需要同步？
- [ ] 安全 playbook 是否与角色能力和权限边界一致？

## 能力绑定

- [ ] Skills 绑定是否匹配 Agent 职责？
- [ ] MCP 绑定是否说明用途、权限和风险？
- [ ] 是否避免给角色加入不必要的高权限能力？

## 安全与治理

- [ ] 角色变化是否影响删除、覆盖、敏感文件、Hook、MCP 或网络访问？
- [ ] 是否需要 Security-Reviewer 审查？
- [ ] 长期结构变化是否需要 Doc 判断 ADR 或知识库更新？

## 可维护性

- [ ] 角色说明是否能被新 worker 直接理解？
- [ ] 变更说明是否包含原因、影响范围和剩余风险？
- [ ] 是否避免模糊词导致后续派工误解？
