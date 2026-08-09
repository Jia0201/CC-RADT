#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const mode = process.argv[2] || "failure";
const input = await readStdinJson();
const root = resolveRoot();

if (!root) {
  process.exit(0);
}

const evidence = collectEvidence(input);
if (!shouldRecord(mode, evidence)) {
  process.exit(0);
}

const now = new Date();
const agent = detectAgent(input);
const versions = readPromptVersions(root, agent);
const eventId = `PE-${compactTimestamp(now)}-${crypto.randomBytes(3).toString("hex")}`;
const taskId = firstText(
  input.task_id,
  input.taskId,
  input.tool_input?.task_id,
  input.tool_input?.taskId,
  "unbound",
);

const event = {
  event_id: eventId,
  occurred_at: now.toISOString(),
  task_id: sanitize(taskId),
  agent,
  workflow: sanitize(firstText(input.workflow, input.workflow_id, input.workflowId, "unknown")),
  system_prompt_version: versions.system,
  task_prompt_version: versions.task,
  failure_type: failureType(mode, evidence),
  error_evidence: sanitize(evidence || "Hook 捕获到失败信号，等待 Lead 补充可复核证据。"),
  expected_behavior: "",
  actual_behavior: sanitize(evidence),
  root_cause: "pending-diagnosis",
  affected_nodes: [],
  severity: severityFor(mode),
  repeat_count: 1,
  proposed_action: "由 Lead 诊断根因并按 security/prompt-evolution-policy.md 路由；Hook 不修改活动提示词。",
  required_eval: ["failure-regression", "existing-baseline", "negative-case"],
  evolution_level: "E0",
  status: "recorded",
  source_event: sanitize(firstText(input.hook_event_name, input.hookEventName, mode)),
  collector: "hooks/scripts/prompt-evolution-event.mjs",
};

const outputDir = path.join(root, "shared", "prompt-evolution", "events");
fs.mkdirSync(outputDir, { recursive: true });
writeAtomic(path.join(outputDir, `${eventId}.json`), `${JSON.stringify(event, null, 2)}\n`);

async function readStdinJson() {
  if (process.stdin.isTTY) return {};
  const text = await new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function resolveRoot() {
  const candidates = [];
  const add = (value) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };
  add(process.env.AI_TEAMS_ROOT);
  if (process.env.CLAUDE_PROJECT_DIR) {
    add(path.join(process.env.CLAUDE_PROJECT_DIR, ".claude", "ai-teams"));
  }
  add(path.join(process.cwd(), ".claude", "ai-teams"));
  add(process.cwd());
  let cursor = process.cwd();
  for (let index = 0; index < 8; index += 1) {
    add(path.join(cursor, ".claude", "ai-teams"));
    add(cursor);
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "shared")) &&
    fs.existsSync(path.join(candidate, "hooks", "scripts"))
  );
}

function collectEvidence(data) {
  const values = [
    data.error,
    data.error_message,
    data.message,
    data.reason,
    data.result,
    data.output,
    data.last_assistant_message,
    data.tool_response,
    data.tool_result,
  ];
  return values
    .map((value) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "";
        }
      }
      return "";
    })
    .filter(Boolean)
    .join(" | ")
    .slice(0, 4000);
}

function shouldRecord(eventMode, text) {
  if (["post-tool-failure", "permission-denied", "stop-failure", "lead-takeover", "user-correction"].includes(eventMode)) {
    return true;
  }
  if (["subagent-stop", "task-completed"].includes(eventMode)) {
    return /(fail|error|denied|blocked|incomplete|失败|错误|拒绝|权限|阻塞|未完成|跑偏|超时)/iu.test(text);
  }
  return eventMode === "record";
}

function detectAgent(data) {
  const raw = firstText(
    data.agent_type,
    data.agentType,
    data.agent_name,
    data.agentName,
    data.subagent_type,
    data.subagentType,
    data.tool_input?.subagent_type,
    data.tool_input?.agent,
    "unknown",
  ).toLowerCase();
  return /^[a-z0-9-]+$/u.test(raw) ? raw : "unknown";
}

function readPromptVersions(harnessRoot, agent) {
  const fallback = { system: "unknown", task: "unknown" };
  const registryFile = path.join(harnessRoot, "prompts", "registry.json");
  try {
    const registry = JSON.parse(fs.readFileSync(registryFile, "utf8"));
    const item = registry.agents?.[agent] ??
      registry.agent_prompts?.[agent] ??
      (Array.isArray(registry.agents) ? registry.agents.find((entry) => entry.id === agent) : null);
    if (!item) return fallback;
    return {
      system: firstText(
        item.system_prompt_version,
        item.system?.active,
        item.system?.version,
        item.active_system_version,
        versionFromPromptPath(item.active?.system),
        "unknown",
      ),
      task: firstText(
        item.task_prompt_version,
        item.task?.active,
        item.task?.version,
        item.active_task_version,
        versionFromPromptPath(item.active?.task),
        "unknown",
      ),
    };
  } catch {
    return fallback;
  }
}

function versionFromPromptPath(value) {
  if (typeof value !== "string") return "";
  const match = value.match(/(?:^|[./])v?([0-9]+(?:\.[0-9A-Za-z_-]+)+)\.prompt\.md$/u);
  return match?.[1] || "";
}

function failureType(eventMode, text) {
  if (eventMode === "permission-denied") return "permission-denied";
  if (eventMode === "stop-failure") return "stop-failure";
  if (eventMode === "lead-takeover") return "lead-takeover";
  if (eventMode === "user-correction") return "user-correction";
  if (/timeout|超时/iu.test(text)) return "timeout";
  if (/permission|denied|权限|拒绝/iu.test(text)) return "permission-denied";
  if (/contract|schema|field|字段|契约/iu.test(text)) return "output-or-contract";
  return eventMode === "post-tool-failure" ? "tool-failure" : "execution-failure";
}

function severityFor(eventMode) {
  if (eventMode === "permission-denied" || eventMode === "stop-failure") return "high";
  return "medium";
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function sanitize(value) {
  let text = String(value || "");
  const home = process.env.HOME ? process.env.HOME.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&") : "";
  if (home) text = text.replace(new RegExp(home, "gu"), "$HOME");
  text = text
    .replace(/(api[_-]?key|token|secret|password|credential)\s*[:=]\s*[^\s,;"']+/giu, "$1=[REDACTED]")
    .replace(/bearer\s+[a-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/gu, "[REDACTED-PRIVATE-MATERIAL]")
    .replace(/(^|[\s("'=])\/(?:[^/\s,;"')\]}]+\/)*[^/\s,;"')\]}]*/gmu, "$1[ABS_PATH]")
    .replace(/(^|[\s("'=])[A-Za-z]:\\(?:[^\\\s,;"')\]}]+\\)*[^\\\s,;"')\]}]*/gmu, "$1[ABS_PATH]");
  return text.slice(0, 4000);
}

function compactTimestamp(date) {
  return date.toISOString().replace(/\D/gu, "").slice(0, 14);
}

function writeAtomic(file, content) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, file);
}
