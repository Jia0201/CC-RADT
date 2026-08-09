#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const namedAgents = new Set([
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

const input = await readInput();
const toolInput = input.tool_input && typeof input.tool_input === "object" ? input.tool_input : {};
const agent = String(
  toolInput.subagent_type ||
  toolInput.subagentType ||
  toolInput.agent_type ||
  toolInput.agent ||
  "",
).toLowerCase();

if (!agent || !namedAgents.has(agent)) {
  process.exit(0);
}

const prompt = String(toolInput.prompt || toolInput.task || toolInput.instructions || "");
const hasEnvelope = /<ai_teams_task_prompt\b[\s\S]*<\/ai_teams_task_prompt>/u.test(prompt);
const requiredFields = [
  "prompt_version",
  "task_id",
  "objective",
  "project_context",
  "allowed_scope",
  "forbidden_scope",
  "output_contract",
  "acceptance",
];
const missing = requiredFields.filter((field) =>
  !new RegExp(`<${field}>[\\s\\S]*?<\\/${field}>`, "u").test(prompt)
);

if (!hasEnvelope || missing.length > 0) {
  const root = resolveRoot();
  const renderer = root
    ? path.join(root, "tools", "bin", "ai-teams-prompt-render.mjs")
    : "tools/bin/ai-teams-prompt-render.mjs";
  const reason = [
    `AI-Teams Agent ${agent} 的任务提示词缺少结构化调用合同。`,
    `缺失字段：${missing.length ? missing.join(", ") : "ai_teams_task_prompt 外层"}.`,
    `请由 Lead 使用 ${renderer} 渲染 system/user 任务提示词后重新派单；不要改用 general-purpose 绕过。`,
  ].join(" ");
  console.log(JSON.stringify({
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
      additionalContext: reason,
    },
  }));
  process.exit(0);
}

function readInput() {
  if (process.stdin.isTTY) return Promise.resolve({});
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
    process.stdin.on("error", () => resolve({}));
  });
}

function resolveRoot() {
  const candidates = [
    process.env.AI_TEAMS_ROOT,
    process.env.CLAUDE_PROJECT_DIR && path.join(process.env.CLAUDE_PROJECT_DIR, ".claude", "ai-teams"),
    path.join(process.cwd(), ".claude", "ai-teams"),
    process.cwd(),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "prompts"))) || null;
}
