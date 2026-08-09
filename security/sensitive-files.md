---
id: "security-sensitive-files"
title: "敏感文件规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 敏感文件规则

以下文件模式默认视为敏感文件：

```text
.env
.env.*
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ed25519
secrets.*
credentials.*
service-account*.json
```

## 处理规则

- 默认只检测是否存在。
- 默认不读取内容。
- 不把内容写入日志。
- 不把内容写入记忆。
- 不把内容写入知识库。
- 打包、初始化、升级、日志清理和 CodeGraph 检测脚本必须沿用本规则。

## 触发安全复核

以下情况必须停止当前动作并交给 Security-Reviewer：

- 任务要求读取敏感文件正文。
- 工具输出中包含疑似密钥、token、证书或 credentials。
- 上下文压缩、日志、记忆、知识库、交接中准备写入敏感内容。
- 删除或移动敏感文件。
- MCP / Skills 安装命令要求访问本地凭据。

## 可记录内容

允许记录：

- 文件路径模式。
- 是否存在。
- 被哪个检查命令发现。
- 已采取的安全动作。

不允许记录：

- 文件正文。
- 密钥片段。
- token 前后缀。
- 证书内容。
- 私有环境变量值。
