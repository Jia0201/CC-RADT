---
id: "kb-agents-role-source-map"
title: "Role 权威来源"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---
# Role 权威来源

`01-source-map.md` 只登记 Agent 结构、工程内规范和运行维护来源，不放临时偏好或未验证经验。

| 来源 | 地址 | 什么时候使用 | Codex 生成内容时要遵守什么 |
|---|---|---|---|
| Agent 索引 | `agents/index.md` | 判断团队 Agent 列表、主入口、组件文件和协作关系时 | 角色变更必须保持主入口、组件和索引一致 |
| 单 Agent 组件目录 | `agents/<agent>/` | 调整某个 Agent 的角色、workflow、memory、kb、skills、mcp 或 playbook 指针时 | 组件之间不能互相矛盾，边界变化要同步到相关文件 |
| 安全 Playbook | `security/agent-playbooks/<agent>.md` | 角色变更影响安全边界、删除权限、敏感文件或高风险操作时 | 安全约束优先于便利性，角色能力不能绕过安全规则 |
| 运行期维护策略 | `security/runtime-maintenance-policy.md` | 新规则、新文件、新工具或复盘显示指引过期时 | 角色指引维护要覆盖触发原因、影响 Agent 和已检查文件 |
| Skills 注册表 | `skills/registry.json` | 角色能力变化涉及 Skills 可用性、绑定或说明时 | Skills 绑定应匹配 Agent 职责，不把泛用能力误配给不相关角色 |
| MCP 注册表 | `mcp/registry.json` | 角色能力变化涉及 MCP 工具、权限或使用范围时 | MCP 绑定应说明用途和风险，不引入私有路径或密钥依赖 |
| 共享协作协议 | `kb/shared/agent-collaboration-protocol.md` | 角色边界影响交接、协作和责任划分时 | 角色说明要支持清晰交接，避免职责重叠和无人负责 |
| 共享工作区协议 | `kb/shared/shared-workspace-protocol.md` | 角色变更影响文件所有权、并行工作和写入边界时 | 角色能力不得破坏共享工作区边界和文件所有权 |
| 知识库索引 | `kb/agents/index.md` | 角色知识库入口、组件链接或 Agent KB 结构变化时 | 正式知识入口要可导航，旧入口与新入口不能断链 |
