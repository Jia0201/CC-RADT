# CC-RADT v1.2.0 使用指南

本指南面向将 CC-RADT 安装到业务项目的使用者。运行路径统一为 `.claude/ai-teams/`，以下命令均从业务项目根目录执行。

## 1. 安装与环境

- Claude Code：安装包 `minimumVersion` 为 `2.1.140`；使用满足该要求的版本。
- Node.js 18+；macOS / Linux 需要 Bash、Python 3，部分维护工具还使用 Git、rsync。
- Windows 需要 PowerShell 7 和 Git Bash 或 WSL；原生 Hooks 与观察台使用 Node.js。
- MCP 按需配置，访问外部服务需要相应授权；安装包不提供密钥。

从 [v1.2.0 Release](https://github.com/Jia0201/CC-RADT/releases/tag/v1.2.0) 下载 `CC-RADT-v1.2.0.zip` 与 `CC-RADT-v1.2.0.zip.sha256`。在业务项目外先校验 ZIP，再解压并校验包内 `checksums.txt`。首次安装将 `.claude/` 和 `.mcp.json` 按现有配置合并到项目；已有长期 Harness 项目不得整目录覆盖，先读 [升级安全边界](UPGRADE.md)。README、变更日志等可保留在包目录，不覆盖业务项目同名文档。

macOS / Linux 目录校验（先进入本地包根目录）：

```bash
shasum -a 256 -c checksums.txt
```

macOS / Linux 可运行 `shasum -a 256 -c CC-RADT-v1.2.0.zip.sha256`；Windows 可用 `Get-FileHash .\CC-RADT-v1.2.0.zip -Algorithm SHA256` 与校验文件中的值比较。逐文件 `checksums.txt` 应在未使用、未合并配置的包目录验证；初始化或执行任务后文件会合法变化。

配置合并细节见安装包的 `INSTALL.md`；从旧版升级请先读 [升级指南](UPGRADE.md)。旧内部升级脚本已停用，实验独立升级器不随 Harness 分发。业务项目的 `CLAUDE.md`、`.claude/settings.local.json`、现有 MCP 和 Agent 定义应保留并解决同名冲突。

## 2. 自检与首次启动

```bash
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
```

Windows：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-check.ps1
```

自检通过后，从业务项目根启动新的 Claude Code 会话，执行 `/agents`，确认 12 个具名 Agent 可见。Lead 是默认入口，接收你的实际请求并选择工作流。更新配置后必须重启会话；已运行的会话不会自动换用新提示词。

## 3. 手动初始化项目画像

v1.2.0 延续手动初始化：不会在启动、恢复或普通请求时主动询问或运行初始化。没有初始化也可以提出任务；只有你需要持久化项目画像时再执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

`--target` 必须是业务项目根目录。初始化写入 Harness 的项目画像、规则、索引和记忆候选区，并建立 `project/.initialized` 标记；不修改业务源码。扫描忽略 `target/`、`build/`、`dist/`、`out/`、`.next/`、`.nuxt/`、虚拟环境等生成目录。Git 不可用时仍可初始化；未初始化时 Git 增量 Hook 静默跳过。

已初始化项目更新后，应先保存原画像；只有决定重新扫描时才再次执行初始化。

## 4. 如何提出任务

提供目标、范围、验收条件和限制，Lead 会选择最小适用团队。任务不必经过全部 12 个角色。

**修复问题：**

```text
修复登录成功后仍停留在登录页的问题。范围是登录页和会话状态模块；
保留现有 API。请先复现，再修复并测试成功登录、失败登录和刷新恢复。
```

**开发功能：**

```text
为订单列表增加日期筛选和 CSV 导出。先核对前后端字段契约，
验收包括空数据、跨月范围和权限不足；不得修改支付链路。
```

**只读分析：**

```text
只回答，不修改文件：解释当前缓存失效策略以及潜在一致性问题。
```

Lead 调度 PD、Plan-PM、四个开发角色、QA、Doc、Memory、Role 和 Security-Reviewer。派发前由任务提示词渲染器补齐结构化合同。结果应包含改动、验证证据、未解决事项和后续建议；Web 观察台仅展示已有记录。

## 5. 只读研发观察台

新会话的 SessionStart Hook 自动启动或复用本项目观察服务，首次提示本机访问链接。它不会自动打开浏览器。打开提示中的完整链接即可查看：

| 页面 | 用途 |
|---|---|
| 概览与会话 | 查看会话、Agent 活动和工具失败记录 |
| 任务 | 阅读已写入文件的任务与协作状态 |
| 证据与审查 | 阅读已有审查记录及留存文本版本 |
| 日志 | 查看允许范围内的项目日志 |
| 配置 | 阅读磁盘上的角色定义 |

同一项目多会话共享服务，活动以 `session_id` 隔离，Agent 以会话与 Agent ID 组合识别。浏览器标签页的筛选互不影响。SessionEnd 只结束该会话的记录；Stop 只代表本轮输出结束。

手动管理：

```bash
node .claude/ai-teams/tools/observer/cli.mjs start
node .claude/ai-teams/tools/observer/cli.mjs status
node .claude/ai-teams/tools/observer/cli.mjs stop
```

`status` 可重新取得完整入口链接。服务只监听 `127.0.0.1`，端口自动分配；入口携带随机访问凭据，请勿公开分享。停止观察器不会停止 Claude Code；后续 SessionStart 可以再次启动它。

启动 Claude Code 前禁用自动观察：

```bash
export AI_TEAMS_OBSERVER=0
claude
```

PowerShell 使用 `$env:AI_TEAMS_OBSERVER = "0"`。恢复启用时在后续进程中移除该变量；禁用开关不会停止已经运行的观察器。

数据默认在项目外：macOS 的 `Library/Application Support/CC-RADT/observer/`、Linux 的 `$XDG_STATE_HOME/cc-radt/observer/`（缺省为 `.local/state/cc-radt/observer/`）、Windows 的 `%LOCALAPPDATA%\CC-RADT\observer\`。可以通过 `AI_TEAMS_OBSERVER_DATA_DIR` 指定项目外目录。

默认最多保留 7 天、5000 条 Hook 活动和 300 份文件快照，先到上限者触发淘汰；单文件最多读取 96 KiB。采集约每 2 秒执行，页面约每 2.5 秒刷新，超过 10 秒未更新会标为陈旧。脱敏有覆盖限制，导出与历史记录应按项目数据管理。

观察台不执行命令、不审批、不写配置。V2 可从当前项目 CC 本地会话中读取脱敏公开对话、工具输入输出、修改片段与已报告 Token，不采集隐藏思考，不复制原始会话文件。缺失记录显示未提供；磁盘角色定义不代表实际加载状态，当前 Git diff 与会话修改片段分开展示，不能自动归因。目录新增 Skills、MCP 与软链路，完整边界和关闭原生对话读取的开关见 [观察台说明](tools/observer/README.md)。跨项目聚合、SSE 和费用统计尚未实现。

## 6. 日常检查与维护

```bash
bash .claude/ai-teams/tools/bin/ai-teams-status.sh
bash .claude/ai-teams/tools/bin/ai-teams-mcp-list.sh
node .claude/ai-teams/tools/bin/ai-teams-prompt-status.mjs
```

运行状态与任务证据位于 `.claude/ai-teams/shared/`，项目知识在 `project/`，长期记忆在 `memory/` 和 `kb/`。更新、迁移或回滚前应备份这些项目自己的数据。不要将业务凭据填入仓库示例配置。

心跳静默达到阈值时表示需要复核，并不直接证明 Agent 已失败。真实工具错误或权限失败仍进入接管流程；已完成 Agent 会清理旧告警。该判断依赖实际 Hook 事件，不代表系统能观察模型内部状态。

## 7. 常见问题

| 现象 | 检查方法 |
|---|---|
| Agent 没加载 | 确认 `.claude/agents/` 位于业务项目根下，并重启会话后检查 `/agents` |
| 启动仍要求初始化 | 检查是否残留 v1.0.0 Hook、router 或 Lead 定义，按升级指南替换受管配置 |
| 没有观察台地址 | 运行 `status` / `start`；检查 Node.js、禁用变量以及新 SessionStart Hook 是否加载 |
| 新标签页打不开 | 重新取得完整入口链接；旧标签页的访问凭据不会自动传给新标签页 |
| 正常 Token 类源码被拦截 | 检查旧版 `permissions.deny` 的宽泛 token 规则，保留业务自己的规则并替换旧 CC-RADT 规则 |
| 初始化后自检报污染 | 核对自检脚本已更新到 v1.2.0、`project/.initialized` 和画像状态；日常运行不要设置 `AI_TEAMS_DISTRIBUTION_CHECK=1` |
| MCP 无法启动 | 查看登记信息与依赖、授权、环境变量；只启用实际需要的服务 |

观察台的协议和浏览器行为有自动化覆盖；Windows 实机和 Claude Code 交互式聊天中的展示位置仍需在实际客户端确认。Codex / OpenCode 适配尚未交付。
