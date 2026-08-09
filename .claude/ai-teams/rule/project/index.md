---
id: rule-project-index
title: 目标项目规则路由
type: rule-index
scope: target-project
owner: doc
status: active
---
# 目标项目规则路由

安装后尚未初始化目标项目。本目录只保存目标项目的轻量路由和索引，不携带源工程扫描结果。

## 初始化后写入

- 项目结构：rule/project/structure
- 项目文件索引：rule/project/files
- 前端与 UI：rule/project/frontend/index
- 后端与接口：rule/project/backend/index
- 项目自建规则：rule/custom/project/index
- 决策定位：rule/project/decisions
- 方案定位：rule/project/plans

## 使用规则

Agent 先读本文件，再按任务类型进入对应路由；只有路由缺失、过期或与源码冲突时才扩大检索。
