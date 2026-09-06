#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { emitHookContext } from "./hook-output.mjs";

const mode = process.argv[2] || "reconcile";
const input = await readStdin();
const root = resolveRoot();

if (!root) {
  console.error("AI-Teams heartbeat root not found.");
  process.exit(0);
}

const runtimeDir = path.join(root, "shared", "supervision", ".runtime");
const stateFile = path.join(runtimeDir, "heartbeat-state.json");
const pidFile = path.join(runtimeDir, "heartbeat-monitor.pid");
const currentFile = path.join(root, "shared", "supervision", "heartbeat-current.md");
const eventDir = path.join(root, "shared", "events");
const intervalMs = positiveInteger(process.env.AI_TEAMS_HEARTBEAT_INTERVAL_MS, 10_000);
const staleAfterMs = positiveInteger(process.env.AI_TEAMS_HEARTBEAT_STALE_MS, 30_000);

fs.mkdirSync(runtimeDir, { recursive: true });
fs.mkdirSync(eventDir, { recursive: true });

if (mode === "monitor") {
  await monitorLoop();
  process.exit(0);
}

const data = parseInput(input);
const state = readState();
const eventName = String(data.hook_event_name || data.hookEventName || mode);
const agentId = String(data.agent_id || data.agentId || data.subagent_id || data.subagentId || data.task_id || data.taskId || "unknown-agent");
const agentType = String(data.agent_type || data.agentType || data.subagent_type || data.subagentType || data.teammate_name || data.teammateName || agentId);
const now = new Date();
const key = agentId === "unknown-agent" ? `${agentType}:${data.session_id || "session"}` : agentId;

if (mode === "reconcile") {
  const pending = Object.values(state.agents).filter((agent) => agent.takeoverRequired || agent.status === "takeover-required");
  if (Object.values(state.agents).some((agent) => agent.status === "running")) ensureMonitor();
  writeCurrent(state, now);
  if (pending.length > 0) {
    emitHookContext(
      eventName,
      `AI-Teams Lead 有 ${pending.length} 个待接管 Agent。立即读取 shared/supervision/heartbeat-current.md，检查错误、权限、跑偏、停滞、安全、锁和 Owner 后再继续。`,
      {
        blockOnStop: true,
        stopHookActive: data.stop_hook_active === true || data.stopHookActive === true,
      },
    );
  }
  process.exit(0);
}

if (["start", "SubagentStart", "TaskCreated"].includes(mode) || eventName === "SubagentStart") {
  state.agents[key] = {
    id: agentId,
    type: agentType,
    status: "running",
    startedAt: state.agents[key]?.startedAt || now.toISOString(),
    lastSeenAt: now.toISOString(),
    lastTool: "",
    lastTarget: "",
    failure: "",
    takeoverRequired: false,
    staleAlertedAt: "",
  };
  state.updatedAt = now.toISOString();
  writeState(state);
  ensureMonitor();
  writeCurrent(state, now);
    emitHookContext(eventName, `AI-Teams 心跳已登记 ${agentType}。Lead 在多个 Agent 运行期间每 10 秒检查 shared/supervision/heartbeat-current.md，并在失败、权限阻断、跑偏或停滞时立即接管。`);
  process.exit(0);
}

const existing = state.agents[key];
if (mode === "activity" && (!existing || existing.status === "completed")) {
  process.exit(0);
}

const current = existing || {
  id: agentId,
  type: agentType,
  startedAt: now.toISOString(),
};
current.lastSeenAt = now.toISOString();
current.lastTool = String(data.tool_name || data.toolName || current.lastTool || "");
current.lastTarget = summarizeTarget(data.tool_input || data.toolInput || {});

if (["failure", "PostToolUseFailure", "PermissionDenied", "StopFailure"].includes(mode) || ["PostToolUseFailure", "PermissionDenied", "StopFailure"].includes(eventName)) {
  current.status = "takeover-required";
  current.takeoverRequired = true;
  current.failure = sanitizeError(data.error || data.message || data.permission_decision || data.permissionDecision || "工具或权限执行失败");
  state.agents[key] = current;
  state.updatedAt = now.toISOString();
  writeState(state);
  writeCurrent(state, now);
  appendEvent("lead-takeover", current, now, eventName);
  emitHookContext(eventName, `AI-Teams Lead 立即接管：${agentType} 出现 ${eventName}。先检查错误根因、权限、锁、所有权、安全边界和任务范围；禁止无差别重复执行。仅在原因明确且风险可控时允许一次定向重试，否则改派、拆分或向用户说明阻塞。详情见 shared/supervision/heartbeat-current.md。`);
  process.exit(0);
}

if (["stop", "SubagentStop", "TaskCompleted", "TeammateIdle"].includes(mode) || ["SubagentStop", "TaskCompleted", "TeammateIdle"].includes(eventName)) {
  current.status = eventName === "TeammateIdle" ? "idle-review" : "completed";
  current.completedAt = now.toISOString();
  current.takeoverRequired = false;
  current.failure = "";
  current.staleAlertedAt = "";
  state.agents[key] = current;
  state.updatedAt = now.toISOString();
  writeState(state);
  writeCurrent(state, now);
  if (eventName === "TeammateIdle") {
    emitHookContext(eventName, `AI-Teams Lead 检查 ${agentType} 的空闲原因：确认任务是否完成、是否跑偏、是否因权限或错误停滞；未形成可验证交接时不得视为完成。`);
  } else {
    emitHookContext(eventName, `AI-Teams Lead 收到 ${agentType} 停止事件。请检查交接、验证证据、任务范围、安全结论和未完成项，再决定验收、一次定向重试或接管。`);
  }
  process.exit(0);
}

current.status = current.status === "takeover-required" ? current.status : "running";
if (current.status === "running") {
  current.takeoverRequired = false;
  current.failure = "";
  current.staleAlertedAt = "";
}
state.agents[key] = current;
state.updatedAt = now.toISOString();
writeState(state);
ensureMonitor();
writeCurrent(state, now);

async function monitorLoop() {
  fs.writeFileSync(pidFile, `${process.pid}\n`, "utf8");
  let emptyRounds = 0;
  while (true) {
    const tick = new Date();
    const state = readState();
    const active = Object.values(state.agents).filter((agent) => agent.status === "running");
    if (active.length === 0) emptyRounds += 1;
    else emptyRounds = 0;

    for (const agent of active) {
      const lastSeen = Date.parse(agent.lastSeenAt || agent.startedAt || tick.toISOString());
      const staleMs = tick.getTime() - lastSeen;
      if (agent.status === "running" && staleMs >= staleAfterMs && !agent.staleAlertedAt) {
        agent.status = "idle-review";
        agent.takeoverRequired = false;
        agent.failure = `连续 ${Math.floor(staleMs / 1000)} 秒没有 Hook 活动，需由 Lead 复核是在思考、等待还是已经停滞`;
        agent.staleAlertedAt = tick.toISOString();
      }
    }

    state.lastAuditAt = tick.toISOString();
    state.updatedAt = tick.toISOString();
    writeState(state);
    writeCurrent(state, tick);
    if (emptyRounds >= 2) break;
    await sleep(intervalMs);
  }
  try { fs.unlinkSync(pidFile); } catch {}
}

function ensureMonitor() {
  const existing = Number(readText(pidFile).trim());
  if (existing && isAlive(existing)) return;
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "monitor"], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, AI_TEAMS_ROOT: root },
  });
  child.unref();
  fs.writeFileSync(pidFile, `${child.pid}\n`, "utf8");
}

function writeCurrent(state, date) {
  const rows = Object.values(state.agents)
    .sort((a, b) => String(a.type).localeCompare(String(b.type)))
    .map((agent) => `| ${agent.type || agent.id} | ${agent.status || "unknown"} | ${formatTime(agent.lastSeenAt)} | ${escapeCell(agent.lastTool)} | ${escapeCell(agent.lastTarget)} | ${escapeCell(agent.failure)} | ${agent.takeoverRequired ? "是" : "否"} |`);
  const activeCount = Object.values(state.agents).filter((agent) => ["running", "takeover-required", "idle-review"].includes(agent.status)).length;
  writeAtomic(currentFile, `---
id: "shared-supervision-heartbeat-current"
title: "多 Agent 心跳状态"
type: "shared-status"
scope: "project"
owner: "lead"
status: active
---
# 多 Agent 心跳状态

- 最近巡检：${formatTime(date.toISOString())}
- 巡检周期：10 秒
- 运行中或待接管：${activeCount}

| Agent | 状态 | 最近活动 | 最近工具 | 最近目标 | 错误/停滞原因 | Lead 接管 |
|---|---|---|---|---|---|---|
${rows.length ? rows.join("\n") : "| - | idle | - | - | - | - | 否 |"}

## Lead 每次巡检

1. Agent 是否仍在处理本次任务，是否访问无关文件或扩大范围。
2. 是否出现工具错误、权限拒绝、锁/所有权冲突或安全阻断。
3. 是否连续 30 秒没有 Hook 活动，存在卡断、等待或无响应。
4. 是否已有可验证交接；没有证据的停止不得标记完成。
5. 发现异常时立即按 shared/escalations/retry-flowback 接管，不等待多轮自主重试。
`, "utf8");
}

function appendEvent(kind, agent, date, trigger) {
  const stamp = date.toISOString().replaceAll(/[-:.TZ]/gu, "").slice(0, 14);
  const file = path.join(eventDir, `${stamp}-${kind}-${safeName(agent.type || agent.id)}.md`);
  fs.writeFileSync(file, `---
id: "${stamp}-${kind}-${safeName(agent.type || agent.id)}"
title: "Lead 接管请求：${agent.type || agent.id}"
type: "supervision-event"
scope: "project"
owner: "lead"
status: open
---
# Lead 接管请求

- 时间：${formatTime(date.toISOString())}
- Agent：${agent.type || agent.id}
- 触发：${trigger}
- 最近工具：${agent.lastTool || "未记录"}
- 最近目标：${agent.lastTarget || "未记录"}
- 原因：${agent.failure || "未记录"}

Lead 必须检查错误根因、权限、锁、文件所有权、安全边界、任务范围和验证证据，再决定一次定向重试、改派、拆分或停止。
`, "utf8");
}

function resolveRoot() {
  const candidates = [];
  const add = (value) => value && !candidates.includes(value) && candidates.push(value);
  add(process.env.AI_TEAMS_ROOT);
  if (process.env.CLAUDE_PROJECT_DIR) add(path.join(process.env.CLAUDE_PROJECT_DIR, ".claude", "ai-teams"));
  add(path.join(process.cwd(), ".claude", "ai-teams"));
  add(process.cwd());
  let cursor = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    add(path.join(cursor, ".claude", "ai-teams"));
    add(cursor);
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "shared", "supervision"))) || null;
}

function parseInput(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function readStdin() {
  if (process.stdin.isTTY) return "";
  return await new Promise((resolve) => {
    let value = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { value += chunk; });
    process.stdin.on("end", () => resolve(value));
    process.stdin.on("error", () => resolve(value));
  });
}

function readState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    return parsed && typeof parsed === "object" && parsed.agents ? parsed : { agents: {} };
  } catch {
    return { version: 1, agents: {}, updatedAt: new Date().toISOString() };
  }
}

function writeState(state) {
  writeAtomic(stateFile, `${JSON.stringify(state, null, 2)}\n`);
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, content, "utf8");
  fs.renameSync(temp, file);
}

function readText(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function summarizeTarget(value) {
  if (!value || typeof value !== "object") return "";
  const candidates = [value.file_path, value.path, value.command, value.query, value.pattern].filter((item) => typeof item === "string");
  return candidates.join(" | ").slice(0, 240);
}

function sanitizeError(value) {
  return String(value || "未知错误").replaceAll(/\s+/gu, " ").slice(0, 400);
}

function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function escapeCell(value) {
  return String(value || "-").replaceAll("|", "\\|").replaceAll(/\s+/gu, " ").slice(0, 240);
}

function safeName(value) {
  return String(value || "agent").toLowerCase().replaceAll(/[^a-z0-9-]+/gu, "-").replaceAll(/^-+|-+$/gu, "") || "agent";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
