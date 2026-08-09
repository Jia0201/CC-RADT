#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const agents = [
  "lead",
  "pd",
  "plan-pm",
  "dev-frontend-web",
  "dev-frontend-miniapp",
  "dev-backend-systems",
  "dev-backend-service",
  "qa",
  "memory",
  "doc",
  "role",
  "security-reviewer",
];

const args = new Set(process.argv.slice(2));
const rootArgIndex = process.argv.indexOf("--root");
const root = resolveRoot(rootArgIndex > -1 ? process.argv[rootArgIndex + 1] : "");
const write = args.has("--write");
const json = args.has("--json");

if (!root) {
  console.error("AI-Teams root not found.");
  process.exit(1);
}

const report = audit(root);
if (write) writeReport(root, report);
if (json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`${report.ok ? "OK" : "WARN"}: AI-Teams memory audit completed.\n`);
  process.stdout.write(`settings=${report.settings.status}; overrides=${report.overrides.status}; formalMemory=${report.formalMemory.status}; nativeDirs=${report.nativeClaudeMemory.directories.length}; nativeFiles=${report.nativeClaudeMemory.totalFiles}\n`);
}

function resolveRoot(explicit) {
  const candidates = [];
  const add = (value) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };
  add(explicit);
  add(process.env.AI_TEAMS_ROOT);
  add(process.cwd());
  if (process.env.CLAUDE_PROJECT_DIR) add(path.join(process.env.CLAUDE_PROJECT_DIR, ".claude", "ai-teams"));

  let cursor = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    add(cursor);
    add(path.join(cursor, ".claude", "ai-teams"));
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const absolute = path.resolve(candidate);
    if (
      fs.existsSync(path.join(absolute, "memory", "index.md")) &&
      fs.existsSync(path.join(absolute, "hooks", "scripts", "ai-teams-run-hook.mjs"))
    ) {
      return absolute;
    }
  }
  return "";
}

function audit(aiRoot) {
  const settingsFiles = locateSettingsFiles(aiRoot);
  const projectSettings = readJson(settingsFiles.project);
  const settings = auditProjectSettings(settingsFiles.project, projectSettings);
  const overrides = auditOverrides(settingsFiles.overrides);
  const formalMemory = auditFormalMemory(aiRoot);
  const nativeClaudeMemory = auditNativeClaudeMemory();
  const ok = settings.ok && overrides.ok && formalMemory.ok;
  return {
    generatedAt: nowText(),
    root: displayPath(aiRoot),
    ok,
    settings,
    overrides,
    formalMemory,
    nativeClaudeMemory,
    policy: {
      nativeClaudeMemory: "audit-and-ignore",
      statement: "AI-Teams 不把 Claude Code 原生 auto memory 目录作为事实来源；只通过 CLAUDE.md、memory/、Memory Agent 与 Compact Hooks 介入工程记忆。",
      formalMemoryOwner: "memory",
    },
  };
}

function locateSettingsFiles(aiRoot) {
  const sourceProject = path.join(aiRoot, ".claude", "settings.json");
  const installedProject = path.join(aiRoot, "..", "settings.json");
  const project = fs.existsSync(sourceProject) ? sourceProject : installedProject;
  const overrides = [
    path.join(aiRoot, ".claude", "settings.local.json"),
    path.join(aiRoot, "..", "settings.local.json"),
    path.join(os.homedir(), ".claude", "settings.json"),
    path.join(os.homedir(), ".claude", "settings.local.json"),
  ];
  return { project, overrides: unique(overrides.map((item) => path.resolve(item))) };
}

function auditProjectSettings(file, data) {
  const issues = [];
  if (!data) {
    issues.push(`缺少或无法解析 Claude Code 项目设置：${displayPath(file)}`);
    return { ok: false, status: "missing", file: displayPath(file), issues };
  }
  if (data.autoMemoryEnabled !== false) issues.push("autoMemoryEnabled 必须为 false。");
  if (data.disableAllHooks !== false) issues.push("disableAllHooks 必须为 false。");
  const hooks = data.hooks || {};
  for (const event of ["SessionStart", "PreCompact", "PostCompact", "Stop"]) {
    if (!Array.isArray(hooks[event]) || hooks[event].length === 0) issues.push(`缺少 ${event} Hook。`);
  }
  const hookText = JSON.stringify(hooks);
  for (const required of ["context-compression-check.sh", "native-claude-memory-audit"]) {
    if (!hookText.includes(required)) issues.push(`Hook 未接入 ${required}。`);
  }
  const governance = data.ai_teams?.memory_governance || {};
  if (governance.auto_memory_enabled !== false) issues.push("ai_teams.memory_governance.auto_memory_enabled 必须为 false。");
  if (governance.native_claude_memory_policy !== "audit-and-ignore") issues.push("ai_teams.memory_governance.native_claude_memory_policy 必须为 audit-and-ignore。");
  if (!governance.native_claude_memory_audit) issues.push("缺少 native_claude_memory_audit 路径。");
  return {
    ok: issues.length === 0,
    status: issues.length === 0 ? "enabled-through-ai-teams" : "needs-fix",
    file: displayPath(file),
    autoMemoryEnabled: data.autoMemoryEnabled,
    disableAllHooks: data.disableAllHooks,
    issues,
  };
}

function auditOverrides(files) {
  const risks = [];
  const checked = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data = readJson(file);
    checked.push(displayPath(file));
    if (!data) {
      risks.push(`${displayPath(file)} 无法解析，需人工确认没有重新启用 auto memory。`);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(data, "autoMemoryEnabled") && data.autoMemoryEnabled !== false) {
      risks.push(`${displayPath(file)} 设置了 autoMemoryEnabled=${JSON.stringify(data.autoMemoryEnabled)}。`);
    }
  }
  return {
    ok: risks.length === 0,
    status: risks.length === 0 ? "no-native-auto-memory-override" : "override-risk",
    checked,
    risks,
  };
}

function auditFormalMemory(aiRoot) {
  const required = [
    "memory/MEMORY.md",
    "memory/index.md",
    "memory/context-compression.md",
    "memory/refresh-rules.md",
    "memory/retention-policy.md",
    ...agents.map((agent) => `memory/agents/${agent}/MEMORY.md`),
  ];
  const missing = [];
  const empty = [];
  for (const relative of required) {
    const file = path.join(aiRoot, relative);
    if (!fs.existsSync(file)) {
      missing.push(relative);
      continue;
    }
    const stat = fs.statSync(file);
    if (stat.size === 0) empty.push(relative);
  }
  return {
    ok: missing.length === 0 && empty.length === 0,
    status: missing.length === 0 && empty.length === 0 ? "ready" : "incomplete",
    requiredCount: required.length,
    missing,
    empty,
  };
}

function auditNativeClaudeMemory() {
  const projectsRoot = path.join(os.homedir(), ".claude", "projects");
  const directories = [];
  if (fs.existsSync(projectsRoot)) {
    let index = 0;
    for (const memoryDir of findMemoryDirs(projectsRoot, 5)) {
      const stats = countFiles(memoryDir);
      index += 1;
      directories.push({
        path: displayNativeMemoryPath(memoryDir, index),
        files: stats.files,
        bytes: stats.bytes,
      });
    }
  }
  const totalFiles = directories.reduce((sum, item) => sum + item.files, 0);
  const nonEmptyDirectories = directories.filter((item) => item.files > 0).length;
  return {
    policy: "audit-and-ignore",
    status: totalFiles > 0 ? "native-memory-residue-detected" : "no-native-memory-files-detected",
    directories,
    totalFiles,
    totalBytes: directories.reduce((sum, item) => sum + item.bytes, 0),
    nonEmptyDirectories,
    contentRead: false,
  };
}

function findMemoryDirs(start, maxDepth) {
  const result = [];
  const stack = [{ dir: start, depth: 0 }];
  while (stack.length > 0) {
    const { dir, depth } = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === "memory") {
        result.push(full);
        continue;
      }
      if (depth < maxDepth) stack.push({ dir: full, depth: depth + 1 });
    }
  }
  return result;
}

function countFiles(dir) {
  let files = 0;
  let bytes = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        files += 1;
        try {
          bytes += fs.statSync(full).size;
        } catch {
          // Ignore files that disappear during the audit.
        }
      }
    }
  }
  return { files, bytes };
}

function writeReport(aiRoot, report) {
  const reportFile = path.join(aiRoot, "memory", "native-claude-memory-audit.md");
  const stateFile = path.join(aiRoot, "shared", "events", "native-claude-memory-audit.json");
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(reportFile, renderReport(report), "utf8");
  fs.writeFileSync(stateFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function renderReport(report) {
  const nativeRows = report.nativeClaudeMemory.directories.length
    ? report.nativeClaudeMemory.directories.map((item) => `| \`${item.path}\` | ${item.files} | ${item.bytes} |`).join("\n")
    : "| - | 0 | 0 |";
  const overrideRows = report.overrides.checked.length
    ? report.overrides.checked.map((item) => `- \`${item}\``).join("\n")
    : "- 未发现可解析的用户/本地覆盖设置。";
  const issueRows = [
    ...report.settings.issues.map((item) => `- 设置问题：${item}`),
    ...report.overrides.risks.map((item) => `- 覆盖风险：${item}`),
    ...report.formalMemory.missing.map((item) => `- 缺少正式记忆文件：\`${item}\``),
    ...report.formalMemory.empty.map((item) => `- 正式记忆文件为空：\`${item}\``),
  ];
  return `---
id: "native-claude-memory-audit"
title: "Claude Code 原生记忆审计"
type: "memory-audit"
scope: "project"
owner: "memory"
status: "${report.ok ? "active" : "needs-review"}"
---
# Claude Code 原生记忆审计

<!-- AI-TEAMS:native-memory-audit:BEGIN -->

- 生成时间：${report.generatedAt}
- AI-Teams 根目录：\`${report.root}\`
- 审计结论：${report.ok ? "通过" : "需要复核"}
- AI-Teams 记忆策略：\`${report.policy.nativeClaudeMemory}\`

## Claude Code 项目设置

- 设置文件：\`${report.settings.file}\`
- autoMemoryEnabled：\`${String(report.settings.autoMemoryEnabled)}\`
- disableAllHooks：\`${String(report.settings.disableAllHooks)}\`
- 状态：${report.settings.status}

## 用户/本地覆盖设置

${overrideRows}

## AI-Teams 正式记忆文件

- 状态：${report.formalMemory.status}
- 必需文件数：${report.formalMemory.requiredCount}
- 缺失：${report.formalMemory.missing.length}
- 空文件：${report.formalMemory.empty.length}

## Claude Code 原生 Auto Memory 目录

| 目录 | 文件数 | 字节数 |
|---|---:|---:|
${nativeRows}

说明：本审计只读取目录和文件元数据，不读取原生记忆内容。即使发现原生记忆残留，AI-Teams 也不得把它作为事实来源；需要由用户自行决定是否在 Claude Code 外部清理。

## 需要处理的问题

${issueRows.length ? issueRows.join("\n") : "- 无。"}

## 运行规则

- AI-Teams 正式记忆只来自 \`memory/\`、Memory Agent、上下文压缩候选和用户确认的项目事实。
- Claude Code 原生 auto memory 目录采用“审计并忽略”策略。
- Hook 和手动压缩只能生成恢复候选；正式记忆必须由 Memory 筛选。
- 不复制敏感文件内容，不读取原生 auto memory 内容。

<!-- AI-TEAMS:native-memory-audit:END -->
`;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function displayPath(value) {
  const home = os.homedir();
  const absolute = path.resolve(value);
  if (absolute === home) return "$HOME";
  if (absolute.startsWith(`${home}${path.sep}`)) return `$HOME/${absolute.slice(home.length + 1).replaceAll(path.sep, "/")}`;
  return absolute.replaceAll(path.sep, "/");
}

function displayNativeMemoryPath(value, index) {
  const projectsRoot = path.join(os.homedir(), ".claude", "projects");
  const absolute = path.resolve(value);
  if (absolute.startsWith(`${projectsRoot}${path.sep}`)) {
    return `$HOME/.claude/projects/<project-${index}>/memory`;
  }
  return displayPath(value);
}

function nowText(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-") + " " + [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");
}
