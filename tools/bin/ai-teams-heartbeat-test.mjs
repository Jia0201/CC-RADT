#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const hook = path.join(projectRoot, "hooks", "scripts", "agent-heartbeat.mjs");
const fixtures = [];

try {
  const lifecycleRoot = createFixture("lifecycle");
  invoke(lifecycleRoot, "activity", {
    hook_event_name: "PostToolUse",
    agent_type: "lead",
    session_id: "session-main",
    tool_name: "Read",
  });
  assert(!fs.existsSync(stateFile(lifecycleRoot)), "Lead 主线程活动不得创建子 Agent 心跳状态");

  invoke(lifecycleRoot, "start", {
    hook_event_name: "SubagentStart",
    agent_id: "agent-qa",
    agent_type: "qa",
    session_id: "session-main",
  });
  invoke(lifecycleRoot, "stop", {
    hook_event_name: "SubagentStop",
    agent_id: "agent-qa",
    agent_type: "qa",
    session_id: "session-main",
  });
  const completed = readState(lifecycleRoot).agents["agent-qa"];
  assert(completed?.status === "completed", "SubagentStop 后状态必须为 completed");
  assert(completed?.takeoverRequired === false, "已完成 Agent 不得保留接管标记");
  assert(completed?.failure === "", "已完成 Agent 不得保留旧失败原因");

  const staleRoot = createFixture("stale");
  invoke(staleRoot, "start", {
    hook_event_name: "SubagentStart",
    agent_id: "agent-doc",
    agent_type: "doc",
    session_id: "session-stale",
  }, {
    AI_TEAMS_HEARTBEAT_INTERVAL_MS: "20",
    AI_TEAMS_HEARTBEAT_STALE_MS: "1",
  });
  let stale;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(50);
    stale = readState(staleRoot).agents["agent-doc"];
    if (stale?.status === "idle-review") break;
  }
  assert(stale?.status === "idle-review", "静默 Agent 应进入 idle-review");
  assert(stale?.takeoverRequired === false, "仅凭静默不得自动要求接管");

  console.log("正常：心跳忽略 Lead 等待、清理完成状态，并把静默降级为复核信号");
} finally {
  for (const fixture of fixtures) fs.rmSync(fixture, { recursive: true, force: true });
}

function createFixture(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `cc-radt-heartbeat-${name}-`));
  fixtures.push(root);
  fs.mkdirSync(path.join(root, "shared", "supervision"), { recursive: true });
  fs.mkdirSync(path.join(root, "shared", "events"), { recursive: true });
  return root;
}

function invoke(root, mode, input, extraEnv = {}) {
  const result = spawnSync(process.execPath, [hook, mode], {
    cwd: projectRoot,
    env: {
      ...process.env,
      AI_TEAMS_ROOT: root,
      AI_TEAMS_HEARTBEAT_INTERVAL_MS: "20",
      ...extraEnv,
    },
    input: JSON.stringify(input),
    encoding: "utf8",
  });
  assert(result.status === 0, `${mode} Hook 失败：${result.stderr || result.stdout}`);
}

function stateFile(root) {
  return path.join(root, "shared", "supervision", ".runtime", "heartbeat-state.json");
}

function readState(root) {
  return JSON.parse(fs.readFileSync(stateFile(root), "utf8"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
