---
id: "tools-commands-ai-init-project"
title: "项目初始化"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 项目初始化

## 用途

将 AI-Teams 接入目标项目，自动读取项目信息并生成项目管理文件。

## 支持的安装形态

### 项目根目录安装

```text
target-project/
├── CLAUDE.md
├── .claude/
├── ai-teams/
└── 用户项目文件
```

### 项目外层安装

```text
workspace/
├── AI-Teams/
└── target-project/
```

### 低侵入 `.claude/ai-teams` 安装

```text
target-project/
└── .claude/
    ├── settings.json
    ├── settings.local.example.json
    └── ai-teams/
```

无论采用哪种形态，初始化都必须显式识别目标项目路径。

## 输入

- 目标项目路径。
- 安装形态：项目根目录安装或项目外层安装。
- 是否允许写入 AI-Teams 管理文件。

## 可执行入口

```bash
bash tools/bin/ai-teams-init-project.sh --target <目标项目路径> --write
```

`--target` 必须指向用户项目，不应默认假设当前目录就是目标项目。

低侵入安装时，在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

## 流程

1. Lead 确认目标项目路径和 AI-Teams harness 路径；低侵入安装时优先在目标项目根目录执行命令。
2. 脚本以目标项目当前文件为主扫描语言、框架、包管理器、构建命令、测试命令、lint/type-check、UI 风格、接口契约、CodeGraph、文档入口和既有 AI/编码规则入口；Git 只作为辅助环境信号，不是初始化前提。
3. 脚本写入 `project/` 初稿，其中正式维护由 Doc 接管。
4. 按 `templates/project-graph/template.md` 创建或更新 `project/graph.md`。
5. 写入基础共享记忆扫描摘要，由 Memory 后续筛选是否需要进入正式记忆或上下文压缩材料。
6. 更新 `index/PROJECT.md`、`index/FILES.md`、`index/STATUS.md`。
7. 写入初始化日志。
8. Lead 分派初始化复核：PD、Plan-PM、四个 Dev、QA、Doc、Memory、Security-Reviewer 按职责熟悉项目。
9. 输出结果和未完成的人工确认项。

## 初始化 Agent 分工

| Agent | 初始化职责 |
|---|---|
| Lead | 确认目标项目路径、禁止范围、是否写入，统一调度初始化复核 |
| PD | 阅读项目 README、产品文档和既有规则入口，补充业务目标、用户角色、需求入口和验收口径 |
| Plan-PM | 识别模块边界、执行阶段、依赖、常用命令和后续任务规划入口 |
| Dev-Frontend-Web | 仅在项目含 Web 前端时复核框架、路由、状态管理、构建和测试入口 |
| Dev-Frontend-Miniapp | 仅在项目含小程序/uni-app 时复核平台、分包、登录、支付、发布限制和验证入口 |
| Dev-Backend-Systems | 仅在项目含 C/C++/Java/系统后端时复核构建、依赖、并发、资源、安全和测试入口 |
| Dev-Backend-Service | 仅在项目含 Python/Go/Node.js/API/服务端时复核 API、配置、数据库迁移、容器和测试入口 |
| QA | 复核测试、lint、type-check、构建、端到端验证和缺口 |
| Doc | 接管 `project/`、项目图谱、索引、标准 Markdown 链接和规则吸收区 |
| Memory | 判断初始化材料中哪些非敏感事实需要进入候选记忆、恢复材料或上下文压缩检查 |
| Security-Reviewer | 复核敏感文件边界、删除风险、外部命令、MCP/Hooks 权限和导入规则安全 |

## 读取文件

- `目标项目 README 和配置文件`
- `package.json / pyproject.toml / go.mod / pom.xml 等识别文件`
- `index/INDEX.md`
- `security/sensitive-files.md`

## 修改文件

- `project/`
- `project/graph.md`
- `memory/MEMORY.md` 的自动扫描区块
- `index/PROJECT.md`
- `index/FILES.md`
- `index/STATUS.md`
- `logs/command/`

## 安全边界

- 不得破坏用户项目。
- 敏感文件只检测存在，不读取内容。
- 不得覆盖用户业务文档中的非 AI-Teams 内容。
- 不得删除、移动或重写用户项目代码。
- 初始化脚本只是扫描辅助；项目画像、项目规则、项目图谱和运行期项目状态必须由 Doc 复核与持续维护。
- 目标项目没有 Git、Git 命令不可用或 Git 状态异常时直接跳过 Git 辅助检查，不影响初始化。
- 初始化不得读取完整提交历史、提交正文、历史代码或大范围 diff。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 检查项目管理文件是否生成。
- 检查识别出的命令是否来自项目配置或明确推断。
- 记录无法识别的命令和原因。
- 运行 `bash tools/bin/ai-teams-check.sh`。

## 日志

- `logs/command/`
