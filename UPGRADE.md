# CC-RADT v1.2.0 升级安全边界

日期：2026-09-22。正式安装包从 [v1.2.0 Release](https://github.com/Jia0201/CC-RADT/releases/tag/v1.2.0) 下载；安装与校验见 [使用指南](USAGE.md)。

- 不得用新包按目录覆盖长期项目。保留项目画像、记忆、知识库、任务记录、私有配置和自定义扩展；先在隔离副本中核对升级计划。
- 旧内部 `ai-teams-upgrade.sh` 已停用，apply 与写快照的 dry-run 均不可用。不得调用旧公开包脚本，也不得让运行中的 Agent、Hook 或 Harness 改写自身。
- 独立升级器仍处实验阶段，源码与二进制均不随 Harness 分发；不能视为全平台稳定工具。未确认平台、权限、活动写入或恢复条件时停止升级。
- 用户应先结束相关会话、观察台及其他写入任务，并保存项目外备份。未签名清单默认只可预览；写入前必须由真实用户核对并认可旧、新清单完整 SHA-256 指纹，哈希不等于官方签名。
- 旧、新版本与本地定制存在冲突时阻断，不覆盖未知数据；中断先处理恢复。保留已发布包、manifest、checksum 和标签，旧基线清单只能在包外补充。

以下保留历史 v1.0.0 → v1.1.0 说明，其版本号、下载与配置示例仅适用于历史迁移，不是本次 1.2.0 的执行步骤。

---

# 从 CC-RADT v1.0.0 升级到 v1.1.0

v1.1.0 保留 `.claude/ai-teams/` 布局、12 个具名 Agent 和 12 套工作流。新增观察台，并改变了项目初始化的触发方式。请同时更新工具、Agent 和 Hook 配置；仅替换一个目录不足以完成升级。

> 新的独立 `cc-radt-updater` 在项目外进行预览、原件保全、升级与恢复，不依赖 Harness 自己执行升级。它目前处于首版验收，源码说明位于开发仓库 `updater/README.md`，不包含在 Harness 安装目录内。尚未通过 Windows/Linux 原生验收，不作为全平台稳定升级器发布。以下保留 v1.0.0 → v1.1.0 的人工迁移审核说明，不能交给正在运行的团队改写自身，也不要按目录直接覆盖。

## 版本区别

| 项目 | v1.0.0 公开标签 | v1.1.0 |
|---|---|---|
| 观察入口 | CLI 与文件记录 | 新增本机只读观察台、会话筛选和文件版本留存 |
| 多会话观察 | 无内置 Web 会话视图 | 同项目共享服务，按会话与 Agent ID 区分活动 |
| 项目初始化 | 启动治理会引导初始化 | 仅用户主动调用；未初始化时 Git 增量 Hook 跳过 |
| Lead 首轮请求 | 包含固定 `initialPrompt` | 移除固定提示，接收用户真实任务 |
| Lead system prompt | `1.0.0` | `1.0.1`，派发前要求渲染完整任务合同 |
| 心跳静默 | 超时可触发接管 | 静默先复核；真实失败仍接管，完成后清理旧告警 |
| 敏感文件识别 | token 等宽泛匹配可误伤源码 | 精确文件名和敏感目录规则 |
| 初始化扫描 | 构建产物可能进入画像 | 排除常见构建目录与虚拟环境 |
| 安装检查 | 安装态与待分发包区分不足 | 新增初始化标记，区分运行态和纯净分发检查 |
| 发布追溯 | 首发 ZIP 与归档 SHA-256 | 源标签、发布来源记录、逐文件校验和及归档 SHA-256 |

## 1. 保存回滚点

结束当前任务并退出项目的 Claude Code 会话。把现有 `.claude/`、`.mcp.json` 及业务项目相关状态完整备份到项目外；若配置已纳入 Git，可另建本地提交作为恢复点。保留备份中的隐藏文件和权限。

下载 [v1.1.0 正式 ZIP](https://github.com/Jia0201/CC-RADT/releases/tag/v1.1.0) 到项目外，按 [使用指南](USAGE.md) 校验 SHA-256 并解压。GitHub 自动生成的 Source code 归档不作为这里的标准安装资产。

## 2. 合并运行文件，保留项目数据

先在项目副本中预演。以新包为运行代码来源，逐项合并下表；同名自定义文件应人工比较。纯净包含状态模板，直接覆盖正在使用的 Harness 会丢失画像和任务上下文。

| 内容 | 处理方式 |
|---|---|
| `agents/`、`prompts/`、`hooks/`、`security/`、`tools/`、`skills/`、`mcp/`、`templates/` | 更新 CC-RADT 提供的文件；对自行修改的同名文件做三方比较 |
| `project/`、`memory/`、`kb/`、`shared/`、`logs/` | 保留现有项目数据，只补入缺失模板；逐项核对新规则所需字段 |
| `rule/project/`、`rule/custom/` | 保留项目画像与自定义规则，其他受管规则按新包更新 |
| `index/` | 更新受管导航，合并已有项目事实和自定义链接 |
| `VERSION`、`MANIFEST.json`、`.claude/manifest.json` | 使用新包版本元数据；manifest 描述分发包，不证明合并后的业务项目仍逐字节相同 |
| `.claude/agents/`、`.claude/rules/` | 更新 CC-RADT 提供的 12 个 Agent 和路由；保留项目自建定义 |
| `.claude/settings.json`、`.mcp.json` | 按下一节逐字段合并 |

上表中的组件子目录均位于 `.claude/ai-teams/`，明确写出 `.claude/` 的行为项目根包装层。工程内 `ai-teams-upgrade.sh` 已退役，所有调用仅输出说明，不再执行 dry-run 快照或 apply。旧公开包仍可能带有历史脚本，也不得将其用于本次自升级。

## 3. 合并关键配置

1. 保留业务自己的配置，将 `agent` 设为 `lead`，`ai_teams.version` 更新为 `1.1.0`，合入新包的 `initialization_mode: manual` 及相应初始化策略。
2. 按旧版安装包识别 CC-RADT 自有 Hook，替换为新包对应事件下的条目。保留业务 Hook；重复追加会导致一个事件执行两次。观察台应在各支持事件中恰好出现一次。
3. 对 `permissions.deny` 做来源比较：用 v1.1.0 规则替换 v1.0.0 由 CC-RADT 引入的宽泛 token / secret / credential 匹配，保留业务自行制定的 deny。简单取并集会保留旧误拦截。来源不明的规则应先核对其用途。
4. 更新 Lead 定义，移除旧 CC-RADT 的固定 `initialPrompt`；保持新 system prompt `1.0.1` 与注册表、编译结果一致。
5. 保留 `.mcp.json` 中业务自有服务和其他顶层字段，同名服务比较后合并；保留 `.claude/settings.local.json` 和根 `CLAUDE.md`。

无需因升级自动重新初始化。原有画像保留后，若确实需要重新扫描，请先备份，再主动执行初始化命令；它会更新生成的画像与规则。

## 4. 验证升级

在项目副本中运行：

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); JSON.parse(require('fs').readFileSync('.mcp.json','utf8')); console.log('JSON OK')"
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
node .claude/ai-teams/tools/bin/ai-teams-prompt-status.mjs
node .claude/ai-teams/tools/observer/cli.mjs start
node .claude/ai-teams/tools/observer/cli.mjs status
```

启动新的 Claude Code 会话：检查 `/agents`；提交一个小任务确认首轮处理真实需求；确认不会自动初始化；打开观察链接查看会话。若同时打开两个会话，检查它们共享观察服务但筛选独立。确认旧画像、记忆和项目自定义规则仍在后，再对实际项目执行同样合并。

## 5. 回滚

退出 Claude Code，运行观察台 `stop` 停止本项目观察服务，再恢复第 1 步的配置与 Harness 备份，重新启动会话。升级后新增的项目数据应另存后再合并回旧版本，避免恢复动作覆盖新工作。观察数据位于项目外，不会因恢复 `.claude/` 自动删除。

公开 `v1.0.0` 与 `v1.1.0` 标签保持不变；发行缺陷应通过后续补丁版本修正。
