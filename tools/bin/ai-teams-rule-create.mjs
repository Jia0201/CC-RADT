#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const allowedScopes = new Set(["agents", "project", "security"]);
const allowedOwners = new Set([
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
]);

function usage() {
  console.log(`用法：
node tools/bin/ai-teams-rule-create.mjs --id <kebab-id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> [--write]

说明：
- 只创建 rule/custom/ 下的规则路由文档和索引。
- 不写 security/ 正文，不写 kb/ 知识库，不读取敏感文件。
- 已存在规则文件时默认不覆盖，只刷新索引；如需人工修改，请先读取文件再编辑。`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--write") {
      args.write = true;
      continue;
    }
    if (item === "--help" || item === "-h") {
      args.help = true;
      continue;
    }
    if (!item.startsWith("--")) {
      throw new Error(`未知参数：${item}`);
    }
    const key = item.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`参数 ${item} 缺少值`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function assertSafeId(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("--id 必须是 kebab-case，只能包含小写字母、数字和连字符");
  }
}

function assertNoSensitiveText(text, field) {
  const lowered = String(text || "").toLowerCase();
  const risky = ["-----begin", "private key", "api_key=", "apikey=", "token=", "secret=", "password="];
  if (risky.some((needle) => lowered.includes(needle))) {
    throw new Error(`${field} 看起来包含敏感内容，请不要写入规则文件`);
  }
}

function ensureRoot() {
  const cwd = process.cwd();
  if (!fs.existsSync(path.join(cwd, "rule")) || !fs.existsSync(path.join(cwd, "security"))) {
    throw new Error("请在 AI-Teams 根目录或 .claude/ai-teams 目录中执行");
  }
  return cwd;
}

function frontmatterValue(content, key) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return "";
  const line = match[1].split(/\r?\n/).find((entry) => entry.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}

function buildRuleDoc({ id, title, scope, owner, trigger, status = "draft", agent = "" }) {
  const agentReference = agent ? `\n- 适用 Agent：[${agent}](../../../agents/${agent}/${agent}.md)\n` : "";
  return `---
id: "custom-rule-${id}"
title: "${title}"
type: "custom-rule-route"
scope: "${scope}"
owner: "${owner}"
status: ${status}
---
# ${title}

## 触发条件

${trigger}
${agentReference}

## 读取顺序

1. 先读 \`rule/index.md\` 和当前 Agent 的 \`rule/agents/<agent>.md\`。
2. 再读 \`rule/custom/index.md\` 和 \`rule/custom/${scope}/index.md\`。
3. 按本规则列出的真实路径读取必要文件；缺失事实时才扩大检索。

## 写入范围

- 本规则默认只允许更新 \`rule/custom/${scope}/\` 中的路由文档和相关索引。
- 如果需要新增动作规则，必须另行更新 \`security/\`，并由 Security-Reviewer 审查。
- 如果需要新增目标项目规则正文，必须写入 \`project/rules/\`，并由 Doc 维护。

## 禁止事项

- 不读取或写入 .env、密钥、证书、token、credentials 等敏感内容。
- 不把动作规则写入 KB。
- 不绕过 Lead 调度、锁、状态事务、Security-Reviewer 或用户确认。
- 不把未验证项目事实登记为 active 规则。

## 验证方式

- 检查本规则是否已出现在 \`rule/custom/index.md\` 和 \`rule/custom/${scope}/index.md\`。
- 检查 \`kb/graph.md\`、\`index/NAVIGATION.md\`、\`index/FILES.md\` 是否需要补充文档关系。
- 运行 \`bash tools/bin/ai-teams-check.sh\`。
`;
}

function listRules(root, scope) {
  const dir = path.join(root, "rule", "custom", scope);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "index.md")
    .sort()
    .map((name) => {
      const file = path.join(dir, name);
      const content = fs.readFileSync(file, "utf8");
      const rel = `rule/custom/${scope}/${name.replace(/\.md$/, "")}`;
      return {
        id: frontmatterValue(content, "id") || name.replace(/\.md$/, ""),
        title: frontmatterValue(content, "title") || name.replace(/\.md$/, ""),
        owner: frontmatterValue(content, "owner") || "",
        status: frontmatterValue(content, "status") || "",
        link: `[${path.basename(rel, ".md")}](./${rel})`,
      };
    });
}

function replaceGeneratedSection(content, rows, emptyText) {
  const start = "<!-- AI_TEAMS_CUSTOM_RULES_START -->";
  const end = "<!-- AI_TEAMS_CUSTOM_RULES_END -->";
  if (!content.includes(start) || !content.includes(end)) {
    throw new Error("索引缺少 AI_TEAMS_CUSTOM_RULES 标记");
  }
  const table = rows.length
    ? `\n| 规则 | 标题 | Owner | 状态 |\n|---|---|---|---|\n${rows
        .map((row) => `| ${row.link} | ${row.title} | ${row.owner} | ${row.status} |`)
        .join("\n")}\n`
    : `\n${emptyText}\n`;
  return content.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}${table}\n${end}`);
}

function refreshIndexes(root) {
  const scopes = ["agents", "project", "security"];
  const allRows = [];
  for (const scope of scopes) {
    const rows = listRules(root, scope);
    allRows.push(...rows);
    const indexFile = path.join(root, "rule", "custom", scope, "index.md");
    if (fs.existsSync(indexFile)) {
      const content = fs.readFileSync(indexFile, "utf8");
      fs.writeFileSync(indexFile, replaceGeneratedSection(content, rows, `尚未注册${scope === "agents" ? " Agent" : scope === "project" ? "项目" : "安全"}自建规则。`), "utf8");
    }
  }
  const rootIndex = path.join(root, "rule", "custom", "index.md");
  const content = fs.readFileSync(rootIndex, "utf8");
  fs.writeFileSync(rootIndex, replaceGeneratedSection(content, allRows, "尚未注册运行期自建规则。"), "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  for (const key of ["id", "title", "scope", "owner", "trigger"]) {
    if (!args[key]) throw new Error(`缺少 --${key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`);
  }
  assertSafeId(args.id);
  if (!allowedScopes.has(args.scope)) throw new Error("--scope 只能是 agents、project 或 security");
  if (!allowedOwners.has(args.owner)) throw new Error("--owner 必须是 AI-Teams 默认 Agent id");
  if (args.agent && !allowedOwners.has(args.agent)) throw new Error("--agent 必须是 AI-Teams 默认 Agent id");
  for (const [field, value] of Object.entries(args)) {
    assertNoSensitiveText(value, field);
  }

  const root = ensureRoot();
  const targetDir = path.join(root, "rule", "custom", args.scope);
  const targetFile = path.join(targetDir, `${args.id}.md`);
  const rel = path.relative(root, targetFile);
  const exists = fs.existsSync(targetFile);

  if (!args.write) {
    console.log(`预览：${exists ? "将保留已有文件并刷新索引" : "将创建"} ${rel}`);
    console.log("添加 --write 后执行。");
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  if (!exists) {
    fs.writeFileSync(targetFile, buildRuleDoc(args), "utf8");
    console.log(`已创建：${rel}`);
  } else {
    console.log(`已存在，未覆盖：${rel}`);
  }
  refreshIndexes(root);
  console.log("已刷新：rule/custom/index.md 及分类索引");
}

try {
  main();
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exit(1);
}
