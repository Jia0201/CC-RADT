---
id: ADR-0014
title: 内置只读观察台与多会话接入
type: adr
scope: project
status: accepted
date: 2026-09-06
owner: doc
decision_by: lead
---
# ADR-0014：内置只读观察台与多会话接入

## 1. 背景

用户要求可视化监控、日志和操作历史回溯，但研发操作完全保留在 CC CLI。进一步要求页面随 Harness 集成交付，CC 首次启动时向用户打印入口，并支持同时打开多个 CC 会话。

## 2. 决策

> 将只读观察器放在 tools/observer，通过独立的 SessionStart 与生命周期 Hook 接入。每项目共享一个本机服务，按真实 session_id 隔离活动；不建设任何 Web 执行或审批接口。

提示按 session_id 与服务实例去重；服务重启后可刷新链接。会话退出不停止共享观察器。程序随正式 Harness 打包，运行历史位于仓库外的用户私有状态目录。

## 3. 原因

既有任务和心跳状态多数是项目共享快照，无法可靠区分并发会话。追加最小生命周期元信息即可解决会话归属，不必改造原有 Agent、调度、状态机、锁或安全决定。网页独立停启不会改变 CC 执行。

## 4. 影响范围

- 新增 tools/observer：零 npm 运行依赖的本地 HTTP 服务、外置记录存储与静态页面。
- 新增 hooks/scripts/observer-hook.mjs 及 settings 注册，沿用现有正式包 Hook 路径转换。
- 文档：用户运行说明、Hook 索引、变更日志与中英文安装版说明。
- 不改变业务任务、Prompt、正式记忆、知识库、原心跳判定或命令权限。

## 5. 后果

观察器会新增本地后台进程和私有历史文件；默认仅监听回环地址，使用随机访问凭据、同源限制、来源白名单和限额留存。Hook 出错必须放行，并提供环境开关禁用。

初版仅保存 Hook 元信息与允许来源的脱敏文本快照，不读取聊天正文或完整命令。缺失的历史不能恢复，项目共享文件不能凭时间强行归属于会话。跨项目聚合、完整 Git 差异、压缩日志解码与操作执行均不属于本次实现。

同一 OS 用户下的代码级只读不是系统级沙箱；更强隔离需要只读挂载或受限账号。CC 聊天提示采用官方 Hook 字段，不伪装成已经完成所有客户端版本的实机验证。

## 6. 关联

- [观察台运行与测试说明](../../../tools/observer/README.md)
- [Hook 索引](../../../hooks/index.md)
- [版本治理](../../../security/version-control-policy.md)
- [敏感文件规则](../../../security/sensitive-files.md)
- [Claude Code 官方 Hook 契约](https://code.claude.com/docs/en/hooks)
