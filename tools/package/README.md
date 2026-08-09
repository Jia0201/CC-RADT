# 打包工具

## 用途

保存正式版和精简版打包工具说明。实际脚本位于 `tools/bin/ai-teams-package.sh`。

## 状态

v1.0 最小可执行版本已创建。

## 输入

- `formal`：生成正式版。
- `simplify`：生成精简版。
- `--version <版本>`：指定版本；未指定时优先读取 `VERSION`，缺失时读取 `MANIFEST.json` 的 `version`。
- `--output <目录>`：指定输出目录。
- `--install-layout root|claude-subdir`：正式版安装布局，`claude-subdir` 会把 AI-Teams 放入 `.claude/ai-teams/`。
- `--verify`：正式版打包后运行结构自检。

## 当前状态

formal 打包链路已启用。默认输出目录由脚本按 `$HOME/project/AI/Agent-Teams-v1.0/formal` 计算，也可以用 `--output <输出目录>` 明确指定；推荐使用 `--install-layout claude-subdir` 生成低侵入安装包。

主工程根目录 `releases/` 旧链路已取消；打包脚本不再向主工程 `releases/` 写 manifest 或 checksum。
- `logs/package/package-*.md`

## 安全边界

- formal 包含 Skills、MCP、Project、Cron、Hooks、Index、Logs 体系结构、Playbook 等工程大脑模块。
- 不包含 `.env`、密钥、证书、token、credentials 命名文件。
- 不包含 `.codegraph/`、`node_modules/`、缓存、临时目录。
- `logs/` 只包含目录结构和索引，不包含主工程历史运行日志正文。
- 不包含主工程原始会话记录。

## 使用示例

```bash
bash tools/bin/ai-teams-package.sh formal --install-layout claude-subdir --output <输出目录> --verify
bash tools/bin/ai-teams-package.sh formal --install-layout root --output <输出目录> --verify
bash tools/bin/ai-teams-package.sh simplify
```
