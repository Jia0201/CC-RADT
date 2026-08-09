# CC-RADT

**Claude Code Research and Development Teams**

[简体中文](README.md) | [English](README.en.md) | [Installation guide](INSTALL.md)

CC-RADT installs a traceable, multi-agent software development team into a real Claude Code project. Lead routes work to PD, Plan-PM, four development agents, QA, Memory, Doc, Role, and Security-Reviewer while the project brain maintains context, memory, knowledge, collaboration state, security policies, Hooks, Skills, MCP, and governed prompts.

## What a development harness means

A development harness is the executable environment around the model. It defines not only what to do, but who should do it, which context to read, what may be changed, how agents coordinate, how results are verified, and how failures are recovered. CC-RADT combines named agents, persistent project context, policies, a shared workspace, Hooks, Skills, MCP, QA gates, and recovery mechanisms to turn model capability into a repeatable engineering process.

## Installed layout

```text
your-project/
├── .mcp.json
└── .claude/
    ├── settings.json
    ├── settings.local.example.json
    ├── agents/
    ├── rules/
    ├── manifest.json
    └── ai-teams/
        ├── index/ENTRY.md
        ├── agents/
        ├── project/
        ├── memory/
        ├── kb/
        ├── shared/
        ├── security/
        ├── hooks/
        ├── skills/
        ├── mcp/
        └── tools/
```

The project-level `.mcp.json` remains at the repository root for Claude Code discovery. CC-RADT does not create or overwrite the target project's root `CLAUDE.md`.

## Install

1. Install a recent Claude Code release and Node.js 18 or later.
2. Download the repository ZIP, or clone it into a temporary directory outside the target project.
3. If the target has no Claude configuration, copy the repository contents into the target project root.
4. If `.claude/settings.json` already exists, preserve it and merge `agent`, `ai_teams`, `permissions.deny`, and `hooks` from the package.
5. If `.mcp.json` already exists, preserve it and merge the package's `mcpServers` entries.
6. Merge `.claude/agents/` and `.claude/rules/`; copy `.claude/ai-teams/` and `.claude/manifest.json`.
7. Never overwrite an existing `.claude/settings.local.json`; the included local file is an example only.

See [INSTALL.md](INSTALL.md) for the exact merge table and troubleshooting steps.

## Verify and initialize

Run from the target project root:

```bash
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-check.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

Restart Claude Code after installation, then use `/agents` to confirm that all 12 named agents are available. Non-trivial tasks use the CC-RADT team by default unless the user explicitly requests a single agent.

## Core capabilities

- 12 named Claude Code project agents and 12 selectable workflows.
- Project profiling, shared memory, per-agent memory, and reusable knowledge.
- Task plans, execution plans, locks, state transactions, handoffs, retries, and QA gates.
- Sensitive-file, deletion, ownership, Hook, MCP, and permission governance.
- Versioned system, task, and retry prompts with evaluation, approval, activation, and rollback.
- Portable Skills and ten project MCP entry points.

## Security boundary

CC-RADT does not read sensitive file contents by default, delete project files without approval, commit Git changes automatically, or publish external artifacts. Initialization writes only to `.claude/ai-teams/` managed areas and does not modify application code.

For the full English documentation, see [.claude/ai-teams/README.en.md](.claude/ai-teams/README.en.md).

## Foundations and acknowledgements

- [Claude Code](https://code.claude.com/docs/en/overview), whose official project agents, Hooks, Skills, MCP, settings, and memory mechanisms provide the runtime integration used by CC-RADT.
- [OpenAI Harness Engineering](https://openai.com/index/harness-engineering/), whose public discussion of agent-first repositories, feedback loops, and continuous verification helped shape the harness approach.
- [Oh My OpenCode](https://github.com/opensoft/oh-my-opencode), whose open-source work on specialized agents, background collaboration, tools, Skills, and MCP organization provided valuable orchestration references.

CC-RADT is an independent open-source project and is not affiliated with or endorsed by Anthropic, OpenAI, or the Oh My OpenCode project. Product and project names belong to their respective owners.
