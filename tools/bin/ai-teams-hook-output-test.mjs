#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildHookContextOutput } from "../../hooks/scripts/hook-output.mjs";

const contextEvents = [
  "SessionStart",
  "Setup",
  "SubagentStart",
  "UserPromptSubmit",
  "UserPromptExpansion",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PostToolBatch",
];
const quietEvents = [
  "PermissionDenied",
  "SubagentStop",
  "TaskCompleted",
  "TeammateIdle",
  "PreCompact",
  "PostCompact",
  "StopFailure",
];

for (const event of contextEvents) {
  const output = buildHookContextOutput(event, "context");
  assert(output.hookSpecificOutput?.hookEventName === event, `${event} 缺少事件专属输出`);
  assert(output.hookSpecificOutput?.additionalContext === "context", `${event} 缺少 additionalContext`);
}

for (const event of quietEvents) {
  const output = buildHookContextOutput(event, "context");
  assert(!output.hookSpecificOutput, `${event} 不允许输出 hookSpecificOutput.additionalContext`);
  assert(!output.decision, `${event} 不应由上下文适配器阻断`);
}

const blockedStop = buildHookContextOutput("Stop", "Lead 接管", {
  blockOnStop: true,
  stopHookActive: false,
});
assert(!blockedStop.hookSpecificOutput, "Stop 不允许输出 hookSpecificOutput");
assert(blockedStop.decision === "block", "Stop 首次接管必须使用顶层 decision=block");
assert(blockedStop.reason === "Lead 接管", "Stop 阻断必须提供顶层 reason");

const repeatedStop = buildHookContextOutput("Stop", "Lead 接管", {
  blockOnStop: true,
  stopHookActive: true,
});
assert(!repeatedStop.hookSpecificOutput, "重复 Stop 不允许输出 hookSpecificOutput");
assert(!repeatedStop.decision, "stop_hook_active=true 时不得再次阻断，避免无限循环");

testHeartbeatStopOutput();

console.log("AI-Teams Hook 输出事件契约测试通过。");

function testHeartbeatStopOutput() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "ai-teams-hook-output-"));
  const runtimeDir = path.join(fixture, "shared", "supervision", ".runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(path.join(fixture, "shared", "events"), { recursive: true });

  const agents = {};
  for (let index = 1; index <= 9; index += 1) {
    agents[`agent-${index}`] = {
      id: `agent-${index}`,
      type: `agent-${index}`,
      status: "takeover-required",
      lastSeenAt: new Date().toISOString(),
      takeoverRequired: true,
    };
  }
  fs.writeFileSync(
    path.join(runtimeDir, "heartbeat-state.json"),
    `${JSON.stringify({ version: 1, agents }, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(path.join(runtimeDir, "heartbeat-monitor.pid"), `${process.pid}\n`, "utf8");

  const script = fileURLToPath(new URL("../../hooks/scripts/agent-heartbeat.mjs", import.meta.url));
  const first = runHeartbeat(script, fixture, {
    hook_event_name: "Stop",
    stop_hook_active: false,
  });
  assert(!first.hookSpecificOutput, "9-Agent Stop 场景不得输出 hookSpecificOutput");
  assert(first.decision === "block", "9-Agent Stop 场景首次必须阻断");
  assert(first.reason?.includes("9 个待接管 Agent"), "9-Agent Stop 场景必须保留接管原因");

  const repeated = runHeartbeat(script, fixture, {
    hook_event_name: "Stop",
    stop_hook_active: true,
  });
  assert(!repeated.hookSpecificOutput, "9-Agent 重复 Stop 场景不得输出 hookSpecificOutput");
  assert(!repeated.decision, "9-Agent 重复 Stop 场景必须放行");

  fs.rmSync(fixture, { recursive: true, force: true });
}

function runHeartbeat(script, fixture, input) {
  const result = spawnSync(process.execPath, [script, "reconcile"], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, AI_TEAMS_ROOT: fixture },
  });
  assert(result.status === 0, `心跳 Hook 执行失败：${result.stderr || result.stdout}`);
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    throw new Error(`心跳 Hook 未输出有效 JSON：${result.stdout}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
