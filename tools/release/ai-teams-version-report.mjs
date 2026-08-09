#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
};
const has = (name) => args.includes(name);
const runGit = (gitArgs, fallback = "") => {
  try {
    return execFileSync("git", gitArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
};
const listFiles = (directory) => {
  let count = 0;
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const target = resolve(current, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile()) count += 1;
    }
  };
  walk(directory);
  return count;
};
const markdownList = (items) => items.length ? items.map((item) => `- \`${item}\``).join("\n") : "- 无";

const version = option("--version") || readFileSync("VERSION", "utf8").trim();
const output = option("--output");
const packageDir = option("--package-dir");
const strict = has("--strict");
const branch = runGit(["branch", "--show-current"], "detached-or-unavailable");
const commit = runGit(["rev-parse", "HEAD"], "unavailable");
const shortCommit = runGit(["rev-parse", "--short", "HEAD"], "unavailable");
const statusLines = runGit(["status", "--porcelain=v1"], "").split("\n").filter(Boolean);
const worktree = statusLines.length ? "dirty" : "clean";
let baseRef = option("--base-ref");
if (!baseRef) {
  baseRef = runGit(["tag", "--merged", "HEAD", "--list", "dev-v*", "--sort=-v:refname"], "")
    .split("\n")
    .filter((tag) => tag && tag !== `dev-v${version}`)[0] || "";
}
if (!baseRef) baseRef = runGit(["rev-list", "--max-parents=0", "HEAD"], "").split("\n").filter(Boolean)[0] || commit;
const range = baseRef && baseRef !== commit ? `${baseRef}..HEAD` : "HEAD";
const commits = runGit(["log", "--no-merges", "--format=%h %s", range], "").split("\n").filter(Boolean).slice(0, 80);
const committedFiles = baseRef && baseRef !== commit
  ? runGit(["diff", "--name-only", `${baseRef}..HEAD`], "").split("\n").filter(Boolean)
  : [];
const dirtyFiles = statusLines.map((line) => line.slice(3)).filter(Boolean);
const changedFiles = [...new Set([...committedFiles, ...dirtyFiles])].sort();
const categories = [
  ["Git / Version Governance", /^(\.github\/|\.gitmessage$|CHANGELOG\.md$|CONTRIBUTING\.md$|security\/version-control-policy\.md$|templates\/version-control\/|tools\/release\/)/],
  ["Agent / Prompt", /^(agents\/|\.claude\/agents\/|prompts\/)/],
  ["Security / Rule / Playbook / ADR", /^(security\/|rule\/|playbook\.md$|project\/adr\/|\.claude\/rules\/)/],
  ["Hook / Tool / Init", /^(hooks\/|tools\/)/],
  ["Skill / MCP", /^(skills\/|mcp\/|\.mcp\.json$)/],
  ["Project / Memory / KB / Shared / Index", /^(project\/|memory\/|kb\/|shared\/|index\/)/],
  ["README / Install / Compatibility", /^(README|INSTALL|CHANGELOG|CONTRIBUTING|VERSION|MANIFEST|templates\/package\/)/],
];
const manifestVersion = (() => {
  try { return JSON.parse(readFileSync("MANIFEST.json", "utf8")).version || ""; }
  catch { return ""; }
})();
const changelog = existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : "";
const packageRoot = packageDir ? resolve(packageDir) : "";
const packageManifest = packageRoot
  ? [resolve(packageRoot, ".claude/manifest.json"), resolve(packageRoot, "manifest.json")].find(existsSync) || ""
  : "";
const checksum = packageRoot && existsSync(resolve(packageRoot, "checksums.txt")) ? resolve(packageRoot, "checksums.txt") : "";
const packageDisplayPath = (value) => value ? relative(packageRoot, value) || "." : "";
const problems = [];
if (branch !== "dev") problems.push(`正式发布要求 dev 分支，当前为 ${branch}`);
if (worktree !== "clean") problems.push("正式发布要求干净工作区");
if (manifestVersion !== version) problems.push(`MANIFEST.json 版本 ${manifestVersion || "缺失"} 与 ${version} 不一致`);
if (!changelog.includes(`## [${version}]`)) problems.push(`CHANGELOG.md 缺少 ## [${version}]`);
if (packageRoot && !packageManifest) problems.push("安装包 manifest 缺失");
if (packageRoot && !checksum) problems.push("安装包 checksums.txt 缺失");

const lines = [
  "# CC-RADT 发布来源记录",
  "",
  `- 生成时间：${new Date().toISOString()}`,
  "",
  "## 版本与 Git 来源",
  "",
  `- 版本：${version}`,
  `- dev 源分支：${branch}`,
  `- dev 源提交：${commit}`,
  `- dev 短提交：${shortCommit}`,
  `- 变更基线：${baseRef || "unavailable"}`,
  `- 工作区：${worktree}`,
  "",
  "## Dev 提交",
  "",
  commits.length ? commits.map((entry) => `- ${entry}`).join("\n") : "- 无新增提交",
  "",
  "## 变更分类",
  "",
];
for (const [name, matcher] of categories) {
  lines.push(`### ${name}`, "", markdownList(changedFiles.filter((file) => matcher.test(file))), "");
}
lines.push("## 验证与安装包", "");
lines.push(`- VERSION / MANIFEST：${manifestVersion === version ? "一致" : "不一致"}`);
lines.push(`- Changelog 版本条目：${changelog.includes(`## [${version}]`) ? "存在" : "缺失"}`);
if (packageRoot) {
  lines.push(`- 安装包文件数量：${existsSync(packageRoot) ? listFiles(packageRoot) : "目录不存在"}`);
  lines.push(`- manifest：${packageDisplayPath(packageManifest) || "缺失"}`);
  lines.push(`- checksum：${packageDisplayPath(checksum) || "待生成或缺失"}`);
}
lines.push("", "## 门禁结论", "");
lines.push(problems.length ? problems.map((problem) => `- 未通过：${problem}`).join("\n") : "- 通过");
const report = `${lines.join("\n").trimEnd()}\n`;
if (output) writeFileSync(resolve(output), report, "utf8");
else process.stdout.write(report);
if (strict && problems.length) process.exit(1);
