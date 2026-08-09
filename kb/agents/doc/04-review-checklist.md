---
id: "kb-agents-doc-04-review-checklist"
title: "Doc 文档治理检查清单"
type: "checklist"
scope: "agent"
owner: "doc"
status: active
---
# Doc 文档治理检查清单

- [ ] 新增文件有标题；需要机器识别时包含最小 frontmatter、owner 和 status。
- [ ] 标准 Markdown 链接可解析，路径引用可被 Claude Code 定位。
- [ ] Agent 文件变更已更新 `agents/index.md`、`index/AGENTS.md`、`kb/graph.md`。
- [ ] project 相关变更已更新 `project/index.md`、`project/context.md`、`project/graph.md`。
- [ ] 新增指令已更新 `tools/commands/index.md` 和 `index/COMMANDS.md`。
- [ ] 新增安全规则已更新 `security/index.md` 和相关 Agent playbook。
- [ ] 新增 MCP/Skills 已更新 registry、Agent 指针和索引。
- [ ] KB 没有写入动作规则、敏感内容、未验证猜测或日志正文。
- [ ] README 和 CLAUDE 仍是入口说明，不变成长篇规则堆叠。
- [ ] 已按 `security/runtime-maintenance-policy.md` 判断是否触发运行期维护。
- [ ] `index/INDEX.md`、`index/FILES.md`、相关目录索引、`project/graph.md`、`kb/graph.md` 已检查，或明确说明无需更新。
- [ ] Doc 维护结论已交给 Lead：已更新、无需更新，或 blocked。
