---
id: "tools-commands-ai-upgrade-existing"
title: "已在项目中运行升级指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 已在项目中运行升级指令

## 用途

对已经安装 AI-Teams 的项目执行安全升级。

## 输入

- 当前版本。
- 目标版本。
- 升级包路径或版本通道。

## 可执行入口

```bash
bash tools/bin/ai-teams-upgrade.sh --package <升级包路径> --dry-run
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取当前版本。
3. 读取目标升级包。
4. 检查兼容性和用户自定义配置。
5. 创建升级前快照。
6. 执行 dry-run。
7. 输出变更清单。
8. 检查冲突和受保护范围锁状态。
9. 修改 AI-Teams 管理范围内文件。
10. 写入升级日志。
11. 更新 manifest 和索引。
12. 输出结果。

## 读取文件

- `index/INDEX.md`
- `VERSION`
- `MANIFEST.json`
- `project/upgrade-state.md`
- `shared/locks/LOCKS.md`
- `security/file-ownership.md`

## 修改文件

- `project/upgrade-state.md`
- `logs/upgrade/`
- `index/STATUS.md`
- `MANIFEST.json`

## 安全边界

- 不得修改用户项目源代码。
- 不得覆盖用户项目配置、业务文档、本地密钥、私有 MCP、私有 Skills。
- 保留用户已有 `CLAUDE.md` 中非 AI-Teams 区块。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- dry-run 变更清单通过。
- 升级后结构自检通过。
- 回滚材料完整。
- 确认升级只触及 AI-Teams 管理范围内文件。

## 日志

- `logs/upgrade/`
