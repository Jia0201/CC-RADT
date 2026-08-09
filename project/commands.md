---
id: "project-commands"
title: "项目命令"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 项目命令

## 安装

当前主工程无应用依赖安装命令。后续如引入脚本运行时或测试工具，需要在本文件更新。

## Lint 检查

当前未配置统一 lint 命令。文档类改动通过结构自检和内容巡检验证。

## 类型检查

当前未配置类型检查命令。

## 测试

结构自检：

```bash
bash tools/bin/ai-teams-check.sh
```

## 核心工具

项目初始化：

```bash
bash tools/bin/ai-teams-init-project.sh --target . --write
```

CodeGraph 状态检测：

```bash
bash tools/bin/ai-teams-codegraph-status.sh --target . --write-index
```

正式版打包：

```bash
bash tools/bin/ai-teams-package.sh formal --verify
```

精简版打包：

```bash
bash tools/bin/ai-teams-package.sh simplify
```

升级 dry-run：

```bash
bash tools/bin/ai-teams-upgrade.sh --package <升级包路径> --dry-run
```

回滚计划：

```bash
bash tools/bin/ai-teams-rollback.sh --snapshot <快照路径> --plan
```

日志清理计划：

```bash
bash tools/bin/ai-teams-logs-clean.sh --before YYYY-MM-DD --plan
```

MCP 查询：

```bash
bash tools/bin/ai-teams-mcp-list.sh
```

MCP 受控安装：

```bash
bash tools/bin/ai-teams-mcp-install.sh --name <名称> --agent <Agent名称> --source <来源> --command <启动命令> --plan
```

Skills 查询：

```bash
bash tools/bin/ai-teams-skills-list.sh
```

Skills 本地安装：

```bash
bash tools/bin/ai-teams-skills-install.sh --name <名称> --agent <Agent名称> --source <本地Skill目录> --plan
```

## 构建

当前主工程不需要构建。

## 冒烟检查

状态查看：

```bash
bash tools/bin/ai-teams-status.sh
```

Hook 占位脚本可执行性：

```bash
find hooks/scripts -maxdepth 1 -type f -name "*.sh" -perm -111 | wc -l
```

