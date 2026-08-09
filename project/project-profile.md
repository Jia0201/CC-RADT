---
id: "project-project-profile"
title: "项目画像"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 项目画像

## 项目名称

AI-Teams

## 项目类型

AI 软件研发团队 Harness 主工程。

## 目标编辑器

- 首选：Claude Code
- 兼容预留：Codex、OpenCode

## 工程形态

- 主工程：研发迭代工程，不直接作为用户项目安装版本使用。
- 正式版：面向实际项目安装，通道为 `v1 / v1.x / v2 / v2.x`。
- 精简版：面向个人项目和小型项目，通道为 `simplify-v1 / simplify-v1.x`。

## 核心目标

- 通过 Agent、指令、记忆、知识库、共享工作区、模板、索引、日志、Hooks、MCP、Skills 和项目初始化机制支持持续研发管理。
- 复制到项目根目录或外层后，可通过项目初始化指令建立项目管理上下文。
- 保持轻量、清晰、可执行，并为 v2 自学习与多编辑器扩展预留空间。

