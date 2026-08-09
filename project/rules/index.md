---
id: "project-rules-index"
title: "项目规则索引"
type: "project-rule-index"
scope: "project"
owner: "doc"
status: active
---
# 项目规则索引

本文件只索引目标项目运行时需要遵守的项目规则、状态规则和登记规则。它不是安全动作规则本体，也不是知识库。

动作规则本体仍在 [index](../../security/index.md)、[playbook](../../playbook.md) 和 `security/agent-playbooks/`；可复用知识仍进入 `kb/`。

## 当前项目规则文件

| 文件 | 类型 | 维护者 | 来源或校验者 |
|---|---|---|---|
| [imported-rules](../imported-rules.md) | 目标项目已有 AI/编码规则吸收区 | Doc | 初始化脚本、Security-Reviewer |
| [verification](../verification.md) | 项目验证与验收规则 | Doc | QA |
| [upgrade-state](../upgrade-state.md) | 项目升级状态与升级保护规则 | Doc | Lead、Security-Reviewer |

## 使用规则

1. 项目类任务开始前，Agent 必须读取本索引和 [index](../index.md)。
2. 发现目标项目已有规则时，先写入交接或初始化报告，由 Doc 合并到 [imported-rules](../imported-rules.md)。
3. 发现验证命令、验收方式或测试缺口时，QA 提供来源，Doc 合并到 [verification](../verification.md)。
4. 发现升级保护、兼容边界或项目安装状态变化时，Lead 决策，Security-Reviewer 校验，Doc 合并到 [upgrade-state](../upgrade-state.md)。
5. 修改本索引后，Doc 检查 [项目关系图](../graph.md)、[全局关系图](../../kb/graph.md) 和 [导航规范](../../index/NAVIGATION.md) 的标准 Markdown 链接。

## 禁止事项

- 不把安全动作规则写进本文件替代 `security/`。
- 不把任务过程流水写进本文件替代 `logs/` 或 `shared/`。
- 不把项目规则直接当长期记忆，长期恢复事实必须由 Memory 筛选。
- 不把跨项目可复用知识写进本文件替代 `kb/`。
