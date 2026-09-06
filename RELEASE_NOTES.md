# CC-RADT v1.1.0 — 只读研发观察台与运行可靠性更新

v1.1.0 为 Claude Code 研发团队新增本机只读观察台，并改善初始化、Lead 任务派发、心跳判断和安装自检。沿用 v1 的 `.claude/ai-teams/` 安装布局、12 个具名 Agent 与 12 套工作流。

## 新增

- **只读研发观察台**：会话启动时提示本机地址；查看会话、任务、日志、已有审查证据与角色定义，支持文件版本留存。
- **多会话隔离**：同项目复用一个观察服务，以会话和 Agent ID 区分活动，各浏览器标签页独立筛选。
- **本机访问与有界历史**：监听 `127.0.0.1`，随机访问凭据，历史保存在项目外，提供禁用开关和保留上限。
- **可追溯发布**：源版本标签、正式构建来源记录、文件级 `checksums.txt` 和 ZIP SHA-256。
- **完整用户文档**：[使用指南](https://github.com/Jia0201/CC-RADT/blob/v1.1.0/USAGE.md)、[升级指南](https://github.com/Jia0201/CC-RADT/blob/v1.1.0/UPGRADE.md) 与中英文 README。

## 行为调整与修复

- 初始化改为用户主动操作，启动、恢复会话和普通需求不会自动询问或运行初始化；未初始化时 Git 增量 Hook 静默跳过。
- 移除 Lead 的固定 `initialPrompt`，保留默认 Lead 入口；Lead system prompt 升至 `1.0.1`，要求派发前渲染完整任务合同。
- 心跳静默先进入复核，不直接判定失败；真实工具或权限失败仍触发接管，任务完成时清理旧告警。
- 敏感路径采用精确文件名与目录判断，减少对 `TokenUtils.java` 等正常源码的误拦截。
- 初始化和规则刷新忽略常见构建目录；通过 `project/.initialized` 区分已初始化运行态与待分发纯净包。
- 自检从脚本位置定位 Harness，支持在业务项目根运行；正式包保留必要空目录，清理源码专用引用。

## 与 v1.0.0 的区别

| 维度 | v1.0.0 | v1.1.0 |
|---|---|---|
| 观察方式 | CLI 与文件 | 新增只读 Web 观察与多会话视图 |
| 初始化 | 启动治理引导 | 用户主动调用 |
| Lead 提示词 | system `1.0.0`、固定首轮提示 | system `1.0.1`、处理真实请求、渲染任务合同 |
| 静默处理 | 可能误触发接管 | 先复核，真实失败仍接管 |
| 文件检查 | 宽泛匹配可能误伤 | 精确文件与目录规则 |
| 分发 | ZIP 与归档校验 | 增加来源记录与逐文件校验 |

这张表以公开 `v1.0.0` 标签为运行基线，不以本机后来重新打包的同版本目录为基线。源码开发与运行分支分别维护，因此 GitHub 的运行版差异与开发分支提交列表各自说明不同内容。

## 安装与升级

下载本 Release 的 **`CC-RADT-v1.1.0.zip`**、**`CC-RADT-v1.1.0.zip.sha256`**。先在项目外校验并解压，然后合并 `.claude/` 和 `.mcp.json`。已有项目必须保留画像、记忆、任务记录与私有配置，并替换旧版 CC-RADT Hook / deny 规则，详见 [v1.0.0 → v1.1.0 升级步骤](https://github.com/Jia0201/CC-RADT/blob/v1.1.0/UPGRADE.md)。

```bash
shasum -a 256 -c CC-RADT-v1.1.0.zip.sha256
# 合并安装后，在业务项目根运行：
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
# 按需主动初始化：
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

重启 Claude Code，执行 `/agents` 检查团队；观察台链接由新会话提示，也可执行 `node .claude/ai-teams/tools/observer/cli.mjs status` 获取。

环境：Claude Code 至少满足配置中的 `2.1.140`，Node.js 18+；Bash 工具需要 Bash / Python 3，Windows 使用 PowerShell 7 加 Git Bash 或 WSL。

## 发布验证

- 源工程结构自检、Markdown 链接、初始化低侵入回归与隔离 Fixture E2E 已通过。
- 观察台测试 11/11；覆盖并发启动、会话隔离、认证、只读接口、脱敏及有界留存。
- Chromium 浏览器回归通过：双窗口、五个页面、证据阅读、XSS 转义、搜索筛选、导出、移动端布局和会话结束刷新。
- Hook 输出契约、心跳回归、36 个活动提示词哈希和 12 个 Agent 编译校验通过。

## 已知范围

- 观察台只读，不执行任务或审批，不提供跨项目聚合、SSE 或费用统计；留存文本不是 Git diff。
- Windows 实机及 Claude Code 交互式聊天展示仍需实际环境确认；自动化协议测试不能替代完整客户端验收。
- Codex / OpenCode 适配仍在路线中。
- 仓库尚未设置项目级 LICENSE；第三方 Skills 保留各自许可与声明，本次发布不改变许可状态。

## English summary

CC-RADT v1.1.0 adds a local read-only observer with per-session filtering and bounded file history. It makes project initialization explicit, removes Lead's fixed initial prompt, requires rendered task contracts, reduces heartbeat false alarms, and fixes sensitive-path false positives and runtime validation.

The v1 installation layout and 12-agent team remain. Back up existing project data and merge the new managed hooks and permission rules when upgrading. Download the named ZIP asset, verify its SHA-256, run the installation check, and restart Claude Code. The observer does not execute or approve work. Windows device testing and interactive Claude Code presentation are not claimed as fully verified.

**完整运行版差异 / Full runtime changelog**：[v1.0.0...v1.1.0](https://github.com/Jia0201/CC-RADT/compare/v1.0.0...v1.1.0)
