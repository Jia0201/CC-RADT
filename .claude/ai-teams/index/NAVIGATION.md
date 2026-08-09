---
id: index-navigation
title: Claude Code 文档导航规范
type: index
scope: project
owner: doc
status: active
---

# Claude Code 文档导航规范

AI-Teams 只使用 Claude Code 可直接读取的真实路径和标准 Markdown 链接，不维护额外的链接注册表、标签注册表或编辑器专用配置。

## 引用方式

1. `CLAUDE.md` 需要启动时加载的指令使用官方 `@relative/path.md` 导入。
2. 普通文档关系使用标准 Markdown 相对链接，格式为“链接标题加真实相对路径”。
3. Agent 运行时读取使用明确路径：`$AI_TEAMS_ROOT/security/index.md`。
4. 代码、命令和机器配置中的文件位置使用反引号包裹的真实相对路径。
5. Mermaid 只表达关系，不替代真实文件链接。

## 元数据边界

普通工程文档不使用 `tags` 或 `links` 列表。保留的 YAML 字段只用于明确文档身份、所有者和状态。Claude Code 官方 Agent、Rule、Skill 文件只保留各自支持的 frontmatter 字段。

## 维护流程

1. 新增、移动或删除文件后，Doc 更新相关目录索引和标准 Markdown 链接。
2. Agent、规则、项目、记忆、知识库或共享工作区入口变化时，检查 [全局导航](./INDEX.md)、[文件索引](./FILES.md)、[知识关系图](../kb/graph.md) 和 [项目关系图](../project/graph.md)。
3. 执行 `bash tools/bin/ai-teams-check.sh` 验证链接、入口和禁止结构。
4. 运行期维护规则见 [运行期维护策略](../security/runtime-maintenance-policy.md)。

## 禁止事项

- 不得新增编辑器专用链接语法。
- 不得恢复专用编辑器配置目录。
- 不得用不存在的路径或仅供展示的别名替代真实文件。
- 不得在元数据或正文中记录敏感信息。
