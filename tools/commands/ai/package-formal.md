---
id: "command-package-formal"
title: "一键打包指令（正式版）"
type: "command"
scope: "project"
owner: "lead"
status: active
---

# 一键打包指令（正式版）

## 用途

从 AI-Teams 主工程生成 formal 正式版安装包，用于真实项目接入。

当前正式版推荐低侵入安装布局：用户可将产物内容合并到目标项目根目录，AI-Teams 工程大脑位于目标项目 `.claude/ai-teams/`。

## 默认输出

```text
$HOME/CC-RADT-dist/formal
```

低侵入布局：

```text
formal/
├── README.md
├── README.en.md
├── INSTALL.md
├── manifest.json
├── checksums.txt
└── .claude/
    ├── settings.json
    ├── settings.local.example.json
    ├── agents/
    ├── rules/
    └── ai-teams/
        ├── index/ENTRY.md
        ├── agents/
        ├── memory/
        ├── kb/
        ├── shared/
        ├── security/
        └── tools/
```

## 可执行入口

```bash
bash tools/bin/ai-teams-package.sh formal --install-layout claude-subdir --output <输出目录> --verify
```

如果要输出为普通 AI-Teams 根目录布局：

```bash
bash tools/bin/ai-teams-package.sh formal --install-layout root --output <输出目录> --verify
```

## 安全边界

- formal 包必须包含 AI-Teams 工程大脑模块：`index/ENTRY.md`、`agents/`、`index/`、`project/`、`memory/`、`kb/`、`shared/`、`security/`、`hooks/`、`cron/`、`templates/`、`skills/`、`mcp/`、`tools/`、`playbook.md` 和 `logs/` 体系结构。
- formal 包不得创建或覆盖目标项目的根 `CLAUDE.md`；Claude Code 通过 `.claude/settings.json`、`.claude/agents/` 与 `.claude/rules/` 接入。
- 不读取或打包 `.env`、密钥、证书、token、credentials 等敏感命名文件。
- 不打包 `.git/`、`.codegraph/`、`node_modules/`、缓存、临时目录。
- `logs/` 参与打包的是目录结构和索引；不打包主工程历史运行日志正文和会话原文。
- 不在主工程根目录创建 `releases/`，旧 `releases/` 链路已取消。
- 输出目录必须为空，避免覆盖用户已有文件。
- 如果目标项目已有 `.claude/settings.json`，安装时必须人工合并 `ai_teams` 配置，不能直接覆盖用户配置。

## 安装后初始化

将 formal 目录内容合并到目标项目根目录后：

```bash
cd <目标项目>
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

## 输出

- formal 安装包目录。
- `.claude/manifest.json`。
- `checksums.txt`。
- `logs/package/package-formal-*.md` 打包报告。
