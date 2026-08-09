---
id: "tools-commands-ai-hooks-list"
title: "查询 Hooks 指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 查询 Hooks 指令

## 用途

查询当前工程包含的 Hook 名称、触发时机、作用范围、启用状态、风险等级和脚本路径。

## 输入

- 可选 Hook 名称。

## 流程

1. 读取 `index/INDEX.md`。
2. 读取 `hooks/index.md`。
3. 读取 hooks 配置和脚本目录。
4. 输出 Hook 名称、触发时机、作用范围、是否启用、风险等级。
5. 输出结果。

## 读取文件

- `index/INDEX.md`
- `hooks/index.md`
- `hooks/configs/`
- `hooks/scripts/`

## 修改文件

- `logs/command/`

## 安全边界

- 查询不执行 Hook 脚本。
- 不展示敏感配置内容。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 7 个最小 Hook 脚本存在并可执行。

## 日志

- `logs/command/`
