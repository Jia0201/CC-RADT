# Harness 内置只读观察台

本模块随 Harness 交付，不是执行器。V2 读取当前项目的 Claude Code 原生会话、Hook 记录和项目能力定义。任务执行、审批、返工、配置修改始终在 CC CLI。

## 页面分工

| 页面 | 核心内容 | 数据边界 |
| --- | --- | --- |
| 概览与会话 | 每会话 Agent 实例、最近动作、Token、Skills/MCP 调用、可展开协作关系 | 状态为最后已知；不把无活动当成仍在线 |
| 任务记录 | 每条用户任务的公开对话、内部派发、工具输入输出、代码修改 | 主 / 子会话身份明确才关联，不读取隐藏思考 |
| 文件变更 | Edit / Write 等修改前后片段，以及项目当前 Git diff | 工具请求不等于落盘成功，工作区差异不自动归因 |
| 活动日志 | 原来的 Hook 时间线与项目日志 | 观测时间，不是精确执行耗时 |
| 证据与审查 | 权限请求、计划确认、人类提问、任务修改及已有审查文件 | 无审批按钮；未知结果不显示为批准 |
| 团队与配置 | 项目全部 Agent 职责卡片与 CC 主定义 | 项目级，与会话筛选无关 |
| Skills | 实际 SKILL.md 文件、所属 Agent、用途和正文 | 安装份数与去重名称分开，目录不等于已激活 |
| MCP | 配置服务、用途、传输与安全边界 | 不主动连接；凭据隐藏，env/header 只展示名称 |
| 软链路规则 | playbook 中 WF-01 至 WF-12 的组合、场景和检查关口 | 声明规则，不伪装成某个会话的实际链路 |

## 自动接入与多会话

界面采用黑白灰极简布局：浅灰导航、白色工作区、按需展开的详情。取消彩色强调与装饰标题，桌面顶部保持紧凑。自动刷新保留未变化的 DOM、滚动位置、展开工具与键盘焦点；Esc 关闭详情并回到原记录，轻量过渡尊重系统减少动态效果设置。

原有详情里的 Markdown 默认呈现为排版文档，不新增菜单或文件浏览入口。Agent / Skill / 软链路正文、Markdown 日志与审查证据、上一留存版本，以及成功 Read 的 Markdown 文件都使用同一渲染器；公开对话中的 Markdown 同样美化。支持标题、嵌套列表、只读任务勾选、表格、引用、行内代码和代码块，文件前置属性默认折叠。JSON 配置、失败工具返回与修改前后 diff 仍显示原始代码。宽表格与代码块在详情内滚动，不撑宽页面。

Markdown 渲染器与消毒库随包提供，无 CDN 或新增安装步骤（版本和许可证见 `web/vendor/README.md`）。嵌入 HTML 按字面显示；图片不自动加载，仅呈现说明；本地引用不触发文件读取，只有 HTTP(S) 链接可由用户另开页面。Mermaid 等代码块保留可读代码，不执行图表脚本。采集范围、脱敏、截断标记与原文件不变。

重启 CC 以加载新增的 Hook 配置。SessionStart 会启动或复用当前项目的观察服务，并通过 `systemMessage` 显示完整本机地址，同时将简短提示加入首次回复上下文。它不会自行打开浏览器。

- “首次”按 **CC session_id + 当前观察服务实例** 去重。每个新会话各提示一次；同会话重复 SessionStart、resume、compact 不反复提示。观察器重启、访问凭据变化后允许重新提示一次。
- 同一规范化项目目录与 Harness 组合只运行一个观察服务，用启动锁处理多个 CC 窗口同时启动。不同项目 / worktree 使用独立数据目录和自动分配端口；第一版不提供跨项目聚合导航。
- 每条 Hook 记录独立原子落盘，带 session_id；Agent 实例使用 session_id + agent_id 区分。没有标识的数据不推断归属。
- 浏览器地址携带当前会话筛选；不同标签页的筛选独立。切换筛选不会影响 CC 或其他观察窗口。
- SessionEnd 只记录该会话结束，不关闭共享观察器。Stop 仅表示本轮输出结束，不等同整个会话退出；强制关闭没有结束事件时只能显示“活动未确认”。
- 观察台异常不阻断 CC；Hook 不返回阻断决定，不同步等待任何模型或外部服务。

Hook 使用 Claude Code 官方 exec-form、session_id、SessionStart 与 systemMessage 契约：[Hooks reference](https://code.claude.com/docs/en/hooks)。当前自动化测试验证了 Hook JSON 输出；不同 CC 版本下聊天区域的具体展示位置仍应以实际客户端为准。

## 本机运行

沿用 Harness 的 Node.js 18+ 前提，零 npm 运行依赖。程序在 `tools/observer/`，入口 Hook 在 `hooks/scripts/observer-hook.mjs`。正式包的通用 Hook 路径生成会将它们接入 `.claude/ai-teams/` 安装布局。

开发源目录：

```sh
node tools/observer/cli.mjs start
node tools/observer/cli.mjs status
node tools/observer/cli.mjs stop
```

业务项目安装态：

```sh
node .claude/ai-teams/tools/observer/cli.mjs start
node .claude/ai-teams/tools/observer/cli.mjs status
node .claude/ai-teams/tools/observer/cli.mjs stop
```

`start` 输出完整访问链接；`status` 输出服务状态、链接和数据目录；`stop` 核对已认证的观察器实例后只停止该观察器，不终止 CC。下一次 SessionStart 可再次拉起。

可用 `--project <业务项目路径>` 指定项目；程序默认识别开发源或 `.claude/ai-teams/` 安装位置。自动 Hook 优先使用 CC 提供的 CLAUDE_PROJECT_DIR。路径包含空格也通过参数数组传递，不拼接 shell。

启动 CC 前设置 `AI_TEAMS_OBSERVER=0` 可禁用自动启动和活动记录，不影响原有 Harness Hook。该开关不停止已运行的观察器；需要时另执行 stop。重新开启须在后续 CC 进程中恢复环境设置。

默认只监听 `127.0.0.1`，由操作系统选择空闲端口。完整链接的 fragment 包含随机本机访问凭据；网页加载后将凭据保存在该标签页的 sessionStorage，并从可见地址移除。请勿把完整入口链接分享给无关人员；复制已经移除凭据的地址到全新标签页时，请从 CC 提示或 status 重新获取完整链接。

## 数据与只读边界

运行数据位于用户私有状态目录，每项目单独分区：

- macOS：用户目录下 `Library/Application Support/CC-RADT/observer/`。
- Linux：XDG_STATE_HOME 下 `cc-radt/observer/`，默认用户目录下 `.local/state/cc-radt/observer/`。
- Windows：LOCALAPPDATA 下 `CC-RADT/observer/`。
- 可通过 `AI_TEAMS_OBSERVER_DATA_DIR` 指定外置根目录；拒绝将它放在业务项目或 Harness 内。

Hook 元信息及脱敏文件快照采用限额内的原子 JSON，不依赖 SQLite。采集每 2 秒执行，页面每 2.5 秒刷新；目录每 15 秒、Git 差异每 8 秒更新。这是轮询，不是 SSE。

文件读取与脱敏在独立 Worker 线程中执行，HTTP 服务与 CC 启动探测不等待整轮扫描。未变化的证据复用脱敏结果，每轮仍核对路径边界与文件身份；Git 每轮有 1.5 秒总预算，超限明确标注未展开项。数据超过 10 秒未刷新时标注陈旧；证据读取超时只影响本次查看，不阻断 CC。

默认保留最近 7 天，最多 5000 条 Hook 活动、300 份文件快照；两者取先达到的上限。每个来源最多读取 96 KiB，每轮最多读取约 3 MiB，超限显示截断 / 覆盖不足。只读当前版本仍可能可见，但被淘汰的历史版本不可恢复。源文件和项目日志不会被清理。

普通 Hook 仍仅保存元信息。权限请求额外保存限长脱敏的命令 / 工具输入，不保存用户 prompt 或完整聊天。隐藏思考从不采集。来源字段缺失就显示未提供；脱敏规则不能识别一切业务隐私，不宜公开分享观察数据。

### CC 原生对话与用量

默认从 `CLAUDE_CONFIG_DIR`（未设则为用户目录的 `.claude`）下 `projects/<当前项目编码>/` 读取主 JSONL 和 `<sessionId>/subagents/agent-*.jsonl`；新 Hook 可提供准确的主会话路径，但仍限于该 projects 目录。每条记录检查项目 cwd 与 sessionId，拒绝跨项目、越界与符号链接来源。仅解析 user / assistant 公开文本、tool_use / tool_result 及 usage；不展示 thinking / redacted_thinking、系统注入、本地命令回显或图片二进制。

原始 CC 文件不复制、不修改、不删除；解析结果只在 Worker 内存中缓存。上限为最近 30 个主会话、每轮 100 份主 / 子记录、单文件尾部 8 MiB、每轮 40 MiB、单 transcript 最近 3000 条公开消息，字段展示最长 24000 字符。超限或未完成 JSON 行显示覆盖不足，Token 可能仅覆盖留存片段；并非历史全量账单。删除 CC 原始记录后，其原生详情不再可用。

Token 按 actor + 模型 message.id（没有时 requestId）去重，合并同一流式响应最后提供的字段，分别显示输入、输出、缓存读取、缓存创建。缺失显示 `—`，不当成零；不估算价格，也不把 Token 当成上下文占用。子 Agent 只按 CC 明确返回的 agentId 关联父任务，不按相似名字或时间拼接。

启动观察服务前设置 `AI_TEAMS_OBSERVER_TRANSCRIPTS=0` 可以只保留 Hook、目录和工作区观察。更改开关后需从终端单独 stop / start 观察器。协议从 V1 升到 V2 后也需重启观察器；新 CLI 的 status 会提示 restartRequired，stop 可安全识别旧版观察服务，不结束任何 CC 会话。

原生 JSONL 是本地兼容适配器，不宣称是长期稳定的公共 API。当前格式以实际 Claude Code 2.1.140 日志和隔离 fixtures 验证。官方能力参考：[Hooks](https://code.claude.com/docs/en/hooks)、[Subagents](https://code.claude.com/docs/en/sub-agents)、[Monitoring](https://code.claude.com/docs/en/monitoring-usage)。本实现不修改用户 OpenTelemetry 配置，不上传对话或用量。

项目证据只读取固定状态文件和允许目录中的文本记录：`shared/tasks/`、`shared/events/`、`shared/handoffs/`、`shared/transactions/`、提示词评审及事件、`logs/`。目录额外读取 Agent 定义、项目 / 内置 Skills、项目 `.mcp.json`（缺失则明确展示模板）以及 playbook。模板与索引不会伪装成实际任务。CC 的 TaskCreate / TaskUpdate / TodoWrite 作为工具变更展示，不把共享任务文件强行归属到会话。

“证据与审查”新增 PermissionRequest、PermissionDenied、permission_prompt 通知和 AskUserQuestion / ExitPlanMode 记录。PermissionRequest 在部分 CC 版本没有 tool_use_id，因此没有明确关联时显示“结果未知”。工具成功返回也不证明是人类批准，任务修改不自动代表必须审批。

“文件变更”区分调用记录中的 Edit / Write / MultiEdit / NotebookEdit 片段和当前工作区差异。无 tool_result 的修改只显示请求；Write 无原始文件基线时明确标注缺失。Git 只执行 status 与禁用 external diff / textconv 的 diff HEAD，最多 80 个文件，单个 diff 展示 96000 字符；敏感路径、未跟踪目录和运行日志不展开。shell 或 MCP 造成的文件变化可能只出现在共享 Git 差异中，不伪造逐次操作归属。“上一留存版本”仍仅为共享证据文本对照。

HTTP 仅有读取接口，要求随机访问凭据、合法 Host 与同源请求；没有执行、审批、配置写入或停止服务的 Web API。Markdown 经转义与白名单消毒后排版，其他内容按转义文本呈现；不自动请求远程资源，不执行文档脚本。观察器进程和项目使用同一 OS 用户时，这不是操作系统级沙箱；需要硬隔离时应额外使用只读挂载或受限账号。

## 验证

```sh
node --test tools/observer/observer.test.mjs
node --test tools/observer/native.test.mjs
node tools/bin/ai-teams-hook-output-test.mjs
bash tools/bin/ai-teams-check.sh
```

观察器测试在临时 fixture 中运行，覆盖并发启动、提示去重、会话 / Agent 隔离、生命周期、重启恢复、认证、只读接口、模板与敏感文件排除、版本留存及路径边界。fixture 证据保留在测试输出的临时目录，不写入真实项目。

浏览器测试使用 `browser-test.mjs`，需测试环境提供 Node Playwright（不是运行依赖）；覆盖九页分工、原生对话、子 Agent、修改片段、决策记录、目录、双窗口、脱敏/XSS、导出和响应式。Windows 实机及不同 CC 版本仍需额外实测。打包验证使用隔离输出目录，不执行发布或远程推送。
