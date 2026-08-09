---
id: "kb-agents-security-reviewer-source-map"
title: "Security-Reviewer 权威来源"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---
# Security-Reviewer 权威来源

`01-source-map.md` 只登记安全权威规范、漏洞分类和工程内安全策略来源，不放未验证博客、漏洞传闻或敏感文件内容。

| 来源 | 地址 | 什么时候使用 | Codex 生成内容时要遵守什么 |
|---|---|---|---|
| OWASP Top 10 | https://owasp.org/www-project-top-ten/ | Web/API 风险、鉴权、访问控制、注入、配置错误审查时 | 风险描述要对应具体漏洞类别和可观察证据 |
| OWASP API Security Top 10 | https://owasp.org/API-Security/ | API 权限、对象级访问、速率限制、批量赋值和数据暴露审查时 | API 建议必须覆盖认证、授权、输入、错误和敏感数据 |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | 需要更细的应用安全验证控制项时 | 审查项应可验证，不把安全目标写成口号 |
| CWE | https://cwe.mitre.org/ | 给漏洞类型、根因和修复建议分类时 | 使用 CWE 概念描述弱点，避免泛泛说“有安全问题” |
| NIST Secure Software Development Framework | https://csrc.nist.gov/Projects/ssdf | 安全开发流程、供应链、构建和发布风险审查时 | 建议应覆盖预防、检测、响应和可追溯性 |
| GitHub Secret Scanning 文档 | https://docs.github.com/code-security/secret-scanning | 审查密钥泄露、token、凭证和仓库历史风险时 | 不复述密钥内容；只说明位置类别、影响和处置建议 |
| npm Security | https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities | Node.js 依赖、lockfile、audit 和供应链风险审查时 | 不建议绕过 lockfile；依赖升级要说明兼容风险 |
| Python Packaging Security | https://packaging.python.org/en/latest/guides/analyzing-pypi-package-downloads/ | Python 依赖来源、包名混淆和供应链风险审查时 | 依赖建议要考虑来源、版本固定和安装脚本风险 |
| Docker Security | https://docs.docker.com/build/building/best-practices/ | Dockerfile、镜像、构建上下文、用户权限和秘密挂载审查时 | 镜像不得含密钥；优先非 root、最小上下文和可复现构建 |
| Kubernetes Security | https://kubernetes.io/docs/concepts/security/ | K8s RBAC、Secret、Pod 安全、网络和资源边界审查时 | 权限最小化，Secret 不明文入库，运行时边界要明确 |
| 工程安全索引 | `security/index.md` | 判断本项目安全策略入口和 policy 优先级时 | 项目安全策略优先于通用建议 |
| Agent 安全 Playbook | `security/agent-playbooks/security-reviewer.md` | 判断 Security-Reviewer 自身职责、输出和阻塞标准时 | 审查结论应包含风险、影响、建议和是否阻塞 |
| 运行期维护策略 | `security/runtime-maintenance-policy.md` | 审查 Hook、MCP、工具、指引维护和运行期变更风险时 | 不引入私有绝对路径、密钥明文或不可移植配置 |
