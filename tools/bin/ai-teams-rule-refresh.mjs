#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const options = parseArgs(process.argv.slice(2));
const root = resolveRoot(options.root);
const target = resolveTarget(options.target, root);
const maxFiles = Number(options.maxFiles || process.env.AI_TEAMS_RULE_MAX_FILES || 5000);

if (!root) fail("无法定位 AI-Teams 根目录。");
if (!target || !fs.existsSync(target)) fail(`目标项目不存在：${target || "未提供"}`);

const harnessEntries = scanTree(root, { maxFiles, excludeHarnessPayload: false });
const projectEntries = scanTree(target, { maxFiles, excludeHarnessPayload: true });
const generatedAt = formatTime(new Date());

const harnessDirectories = renderDirectories(harnessEntries.directories, root, "engineering");
const harnessFiles = renderFiles(harnessEntries.files, root, false);
const projectDirectories = renderDirectories(projectEntries.directories, target, "project");
const projectFiles = renderFiles(projectEntries.files, target, true);
const frontendFiles = projectEntries.files.filter((file) => classifyProjectFile(relative(target, file)) === "前端/UI");
const backendFiles = projectEntries.files.filter((file) => ["后端/API", "数据库/迁移"].includes(classifyProjectFile(relative(target, file))));
const apiFiles = projectEntries.files.filter((file) => isApiFile(relative(target, file)));

const updates = [
  ["rule/catalog/directories.md", "rule-directories", sectionHeader("AI-Teams 工程目录", "$AI_TEAMS_ROOT", generatedAt, harnessEntries) + harnessDirectories],
  ["rule/catalog/files.md", "rule-files", sectionHeader("AI-Teams 工程文件", "$AI_TEAMS_ROOT", generatedAt, harnessEntries) + harnessFiles],
  ["rule/project/structure.md", "project-rule-structure", sectionHeader("目标项目目录", "$TARGET_PROJECT_ROOT", generatedAt, projectEntries) + projectDirectories],
  ["rule/project/files.md", "project-rule-files", sectionHeader("目标项目文件", "$TARGET_PROJECT_ROOT", generatedAt, projectEntries) + projectFiles],
  ["rule/project/frontend/index.md", "project-rule-frontend", renderProjectSubset("前端与 UI 文件入口", target, frontendFiles, 200)],
  ["rule/project/frontend/syntax.md", "project-rule-frontend-syntax", renderSyntaxSignals(target, projectEntries.files, "frontend")],
  ["rule/project/backend/index.md", "project-rule-backend", renderProjectSubset("后端与数据库文件入口", target, backendFiles, 200)],
  ["rule/project/backend/api.md", "project-rule-api", renderProjectSubset("接口契约与路由入口", target, apiFiles, 200)],
  ["rule/project/backend/syntax.md", "project-rule-backend-syntax", renderSyntaxSignals(target, projectEntries.files, "backend")],
];

if (options.write) {
  for (const [file, marker, content] of updates) updateSection(path.join(root, file), marker, content);
  console.log(`规则索引已刷新：AI-Teams ${harnessEntries.files.length} 个文件，目标项目 ${projectEntries.files.length} 个文件。`);
  console.log("目标项目规则索引已按传入路径生成；文档中仅保存可迁移的相对路径。");
} else {
  console.log(JSON.stringify({
    root,
    target,
    harnessFiles: harnessEntries.files.length,
    harnessDirectories: harnessEntries.directories.length,
    projectFiles: projectEntries.files.length,
    projectDirectories: projectEntries.directories.length,
    frontendFiles: frontendFiles.length,
    backendFiles: backendFiles.length,
    apiFiles: apiFiles.length,
    truncated: harnessEntries.truncated || projectEntries.truncated,
  }, null, 2));
}

function parseArgs(args) {
  const result = { write: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--write") result.write = true;
    else if (arg === "--root") result.root = args[++index];
    else if (arg === "--target") result.target = args[++index];
    else if (arg === "--max-files") result.maxFiles = args[++index];
    else if (arg === "-h" || arg === "--help") {
      console.log("用法：node tools/bin/ai-teams-rule-refresh.mjs [--root AI-Teams目录] [--target 目标项目] [--max-files 数量] [--write]");
      process.exit(0);
    } else fail(`未知参数：${arg}`);
  }
  return result;
}

function resolveRoot(explicit) {
  const candidates = [explicit, process.env.AI_TEAMS_ROOT, process.cwd(), path.join(process.cwd(), ".claude", "ai-teams")].filter(Boolean);
  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    if (fs.existsSync(path.join(absolute, "rule", "index.md")) && fs.existsSync(path.join(absolute, "tools", "bin"))) return absolute;
  }
  return null;
}

function resolveTarget(explicit, aiRoot) {
  if (explicit) return path.resolve(explicit);
  if (process.env.CLAUDE_PROJECT_DIR) return path.resolve(process.env.CLAUDE_PROJECT_DIR);
  if (path.basename(aiRoot) === "ai-teams" && path.basename(path.dirname(aiRoot)) === ".claude") return path.resolve(aiRoot, "..", "..");
  return aiRoot;
}

function scanTree(base, { maxFiles: limit, excludeHarnessPayload }) {
  const files = [];
  const directories = [];
  const stack = [base];
  let truncated = false;
  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      const rel = relative(base, full);
      if (shouldSkip(rel, entry.isDirectory(), excludeHarnessPayload)) continue;
      if (entry.isDirectory()) {
        directories.push(full);
        stack.push(full);
      } else if (entry.isFile()) {
        if (isSensitivePath(rel)) continue;
        files.push(full);
        if (files.length >= limit) {
          truncated = true;
          stack.length = 0;
          break;
        }
      }
    }
  }
  return { files: files.sort(), directories: directories.sort(), truncated };
}

function shouldSkip(rel, directory, excludeHarnessPayload) {
  const normalized = rel.replaceAll("\\", "/");
  const parts = normalized.split("/");
  const ignored = new Set([
    ".git", "node_modules", "vendor", ".cache", ".codegraph", ".runtime",
    "target", "dist", "build", "out", ".next", ".nuxt", ".venv", "venv",
    "coverage", "__pycache__", ".pytest_cache", ".mypy_cache",
  ]);
  if (parts.some((part) => ignored.has(part))) return true;
  if (!directory && (normalized.endsWith("/.DS_Store") || normalized === ".DS_Store" || normalized === ".claude/settings.local.json")) return true;
  if (!directory && normalized.startsWith("logs/") && path.basename(normalized) !== "index.md") return true;
  if (!directory && normalized.startsWith("memory/conversations/sessions/") && path.basename(normalized) !== "index.md") return true;
  if (excludeHarnessPayload && (normalized === ".claude/ai-teams" || normalized.startsWith(".claude/ai-teams/"))) return true;
  return false;
}

function isSensitivePath(rel) {
  const lower = rel.toLowerCase().replaceAll("\\", "/");
  const parts = lower.split("/");
  const base = lower.slice(lower.lastIndexOf("/") + 1);
  const namedSensitive = new Set([
    ".token", "token.json", "token.yaml", "token.yml",
    ".secret", "secret.json", "secret.yaml", "secret.yml",
    ".credentials", "credentials.json", "credentials.yaml", "credentials.yml",
    "id_rsa", "id_ed25519",
  ]);
  return base === ".env" || base.startsWith(".env.") ||
    base.startsWith(".token.") || base.startsWith(".secret.") || base.startsWith(".credentials.") ||
    base.endsWith(".pem") || base.endsWith(".key") || base.endsWith(".p12") || base.endsWith(".pfx") ||
    base.startsWith("service-account") && base.endsWith(".json") ||
    namedSensitive.has(base) || parts.some((part) => ["secrets", ".secrets", ".ssh", ".gnupg"].includes(part));
}

function renderDirectories(directories, base, mode) {
  const rows = directories.map((dir) => {
    const rel = relative(base, dir);
    return `| \`${escapeCell(rel)}\` | ${escapeCell(classifyDirectory(rel, mode))} |`;
  });
  return `\n| 目录 | 用途 |\n|---|---|\n${rows.join("\n") || "| - | 未发现目录 |"}\n`;
}

function renderFiles(files, base, projectMode) {
  const rows = files.map((file) => {
    const rel = relative(base, file);
    const category = projectMode ? classifyProjectFile(rel) : classifyHarnessFile(rel);
    const owner = projectMode ? projectOwner(category) : harnessOwner(rel);
    return `| \`${escapeCell(rel)}\` | ${escapeCell(category)} | ${escapeCell(owner)} |`;
  });
  return `\n| 文件 | 分类 | 首要使用者/Owner |\n|---|---|---|\n${rows.join("\n") || "| - | 未发现文件 | - |"}\n`;
}

function sectionHeader(title, base, time, entries) {
  return `## ${title}\n\n- 刷新时间：${time}\n- 扫描根目录：\`${base}\`\n- 目录数量：${entries.directories.length}\n- 文件数量：${entries.files.length}\n- 截断：${entries.truncated ? "是，达到上限" : "否"}\n`;
}

function renderProjectSubset(title, base, files, limit) {
  const selected = files.slice(0, limit);
  const lines = selected.map((file) => `- \`${relative(base, file)}\``);
  return `## ${title}\n\n- 文件数量：${files.length}\n- 展示上限：${limit}\n\n${lines.join("\n") || "- 未识别到对应文件，等待专业 Agent 复核。"}`;
}

function renderSyntaxSignals(base, files, kind) {
  const extensions = new Map();
  for (const file of files) {
    const rel = relative(base, file);
    const category = classifyProjectFile(rel);
    if (kind === "frontend" && category !== "前端/UI") continue;
    if (kind === "backend" && !["后端/API", "数据库/迁移"].includes(category)) continue;
    const ext = path.extname(file).toLowerCase() || path.basename(file);
    extensions.set(ext, (extensions.get(ext) || 0) + 1);
  }
  const rows = [...extensions.entries()].sort((a, b) => b[1] - a[1]).map(([ext, count]) => `| \`${ext}\` | ${count} |`);
  return `## 自动识别语法线索\n\n| 扩展名/文件 | 数量 |\n|---|---|\n${rows.join("\n") || "| - | 0 |"}\n\n这些只是文件线索，正式语法和工程规范仍需从项目规则、配置和专业 Agent 复核。`;
}

function classifyDirectory(rel, mode) {
  const top = rel.split("/")[0];
  if (mode === "engineering") {
    const map = { agents: "Agent 本体", rule: "规则路由", project: "目标项目事实", shared: "协作工作区", security: "安全规则", memory: "记忆", kb: "知识库", tools: "工具与指令", hooks: "自动化 Hook", skills: "Skills", mcp: "MCP", index: "全局索引", templates: "模板", cron: "定时任务", logs: "追溯日志", lab: "实验" };
    return map[top] || "工程辅助目录";
  }
  return classifyProjectFile(`${rel}/`);
}

function classifyHarnessFile(rel) {
  const top = rel.split("/")[0];
  const map = { agents: "Agent", rule: "规则索引", project: "项目画像", shared: "协作状态", security: "安全规则", memory: "记忆", kb: "知识", tools: "工具/指令", hooks: "Hook", skills: "Skill", mcp: "MCP", index: "索引", templates: "模板", cron: "定时任务", logs: "日志", ".claude": "Claude Code 入口" };
  return map[top] || "根入口/工程文件";
}

function harnessOwner(rel) {
  const top = rel.split("/")[0];
  const map = { agents: "Role", rule: "Doc/Role", project: "Doc", shared: "任务 Owner", security: "Security-Reviewer", memory: "Memory", kb: "Doc", tools: "对应工具 Owner", hooks: "Security-Reviewer", skills: "Doc/Security-Reviewer", mcp: "Doc/Security-Reviewer", index: "Doc", templates: "Doc", cron: "Lead/Doc", logs: "Doc" };
  return map[top] || "Lead/Doc";
}

function classifyProjectFile(rel) {
  const lower = rel.toLowerCase();
  if (/\.(vue|tsx|jsx|css|scss|sass|less|html|wxml|wxss|axml|acss)$/u.test(lower) || /(^|\/)(pages?|views?|components?|layouts?|styles?|theme)(\/|$)/u.test(lower)) return "前端/UI";
  if (isApiFile(lower)) return "后端/API";
  if (/(migration|migrations|schema\.prisma|database|db)(\/|\.|$)/u.test(lower)) return "数据库/迁移";
  if (/(^|\/)(tests?|specs?|__tests__)(\/|$)/u.test(lower) || /\.(test|spec)\./u.test(lower)) return "测试/验证";
  if (/(package\.json|lock|requirements|pyproject|go\.mod|pom\.xml|gradle|docker|k8s|helm|cmake|makefile)/u.test(lower)) return "依赖/构建/部署";
  if (/\.(md|mdx|rst)$/u.test(lower) || /(^|\/)docs?(\/|$)/u.test(lower)) return "文档/规则";
  if (/(security|auth|permission|policy|\.github\/workflows)/u.test(lower)) return "安全/权限/CI";
  return "业务/其他";
}

function isApiFile(rel) {
  const lower = rel.toLowerCase();
  return /(^|\/)(api|routes?|controllers?|handlers?|services?|dto|schemas?|models?|server|backend)(\/|$)/u.test(lower) || /\.(proto)$/u.test(lower) || /(openapi|swagger)/u.test(lower);
}

function projectOwner(category) {
  if (category === "前端/UI") return "前端 Dev / QA / Doc";
  if (category === "后端/API" || category === "数据库/迁移") return "后端 Dev / QA / Doc";
  if (category === "测试/验证") return "QA / Dev";
  if (category === "文档/规则") return "Doc / 对应专业 Agent";
  if (category === "安全/权限/CI") return "Security-Reviewer / Dev";
  return "对应任务 Agent";
}

function updateSection(file, marker, content) {
  if (!fs.existsSync(file)) fail(`规则模板不存在：${file}`);
  const begin = `<!-- AI-TEAMS:${marker}:BEGIN -->`;
  const end = `<!-- AI-TEAMS:${marker}:END -->`;
  const current = fs.readFileSync(file, "utf8");
  const start = current.indexOf(begin);
  const finish = current.indexOf(end);
  if (start < 0 || finish < start) fail(`规则模板缺少生成标记：${file}`);
  const next = `${current.slice(0, start)}${begin}\n${content.trim()}\n${end}${current.slice(finish + end.length)}`;
  writeAtomic(file, next);
}

function writeAtomic(file, content) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, file);
}

function relative(base, file) {
  return path.relative(base, file).replaceAll("\\", "/") || ".";
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function formatTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
