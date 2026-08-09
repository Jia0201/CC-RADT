#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = 1;
const PROMPT_KINDS = new Set(["system", "task", "retry"]);
const RISK_LEVELS = new Set(["low", "high"]);
const DEFAULT_AGENTS = [
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
const HIGH_RISK_APPROVERS = ["lead", "qa", "role", "security-reviewer"];
const LOW_RISK_APPROVERS = ["lead", "qa"];
const TASK_CONTRACT_REQUIRED = [
  "task_id",
  "objective",
  "project_context",
  "allowed_scope",
  "forbidden_scope",
  "output_contract",
  "acceptance",
];
const BOOLEAN_OPTIONS = new Set([
  "all",
  "compile",
  "dry-run",
  "from-active",
  "from-agent",
  "help",
  "json",
  "write",
]);
const REPEATABLE_OPTIONS = new Set(["set"]);
const SENSITIVE_KEY = /(?:api[-_]?key|access[-_]?key|private[-_]?key|secret|token|password|passwd|credential|authorization|cookie)/i;
const SENSITIVE_FILE = /(?:^|[/\\])(?:\.env(?:\..*)?|id_(?:rsa|ed25519)|[^/\\]*\.(?:pem|key|p12|pfx)|[^/\\]*(?:credential|secret|token)[^/\\]*)$/i;
const CORE_FILE = fileURLToPath(import.meta.url);
const CORE_ROOT = path.resolve(path.dirname(CORE_FILE), "..", "..");

export async function run(command, argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp(command);
      return;
    }

    const root = resolveRoot(options.root);
    const context = createContext(root, options);
    const handlers = {
      status: commandStatus,
      render: commandRender,
      compile: commandCompile,
      eval: commandEval,
      evolve: commandEvolve,
      activate: commandActivate,
      rollback: commandRollback,
      history: commandHistory,
    };
    const handler = handlers[command];
    if (!handler) throw new Error(`未知提示词命令：${command}`);
    await handler(context);
  } catch (error) {
    process.stderr.write(`错误：${redactText(error?.message || String(error))}\n`);
    process.exitCode = 1;
  }
}

function createContext(root, options) {
  return {
    root,
    options,
    promptRoot: path.join(root, "prompts"),
    registryFile: path.join(root, "prompts", "registry.json"),
    historyFile: path.join(root, "shared", "prompt-evolution", "history.json"),
    candidateDir: path.join(root, "shared", "prompt-evolution", "candidates"),
    reviewDir: path.join(root, "shared", "prompt-evolution", "reviews"),
    agentDir: resolveAgentDirectory(root),
    write: options.write === true,
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (raw === "-h") {
      result.help = true;
      continue;
    }
    if (!raw.startsWith("--")) throw new Error(`未知参数：${raw}`);

    const equal = raw.indexOf("=");
    const flag = raw.slice(2, equal > -1 ? equal : undefined);
    const key = flag.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
    if (BOOLEAN_OPTIONS.has(flag)) {
      if (equal > -1) throw new Error(`布尔参数 --${flag} 不接受值`);
      result[key] = true;
      continue;
    }

    const value = equal > -1 ? raw.slice(equal + 1) : argv[++index];
    if (value === undefined || value.startsWith("--")) throw new Error(`参数 --${flag} 缺少值`);
    if (REPEATABLE_OPTIONS.has(flag)) {
      if (!Array.isArray(result[key])) result[key] = [];
      result[key].push(value);
    } else {
      if (Object.prototype.hasOwnProperty.call(result, key)) throw new Error(`参数 --${flag} 不能重复`);
      result[key] = value;
    }
  }
  if (result.write && result.dryRun) throw new Error("--write 与 --dry-run 不能同时使用");
  return result;
}

function resolveRoot(explicit) {
  const candidates = [];
  const add = (candidate) => {
    if (!candidate) return;
    const absolute = path.resolve(candidate);
    if (!candidates.includes(absolute)) candidates.push(absolute);
  };

  add(explicit);
  add(process.env.AI_TEAMS_ROOT);
  add(process.cwd());
  add(path.join(process.cwd(), ".claude", "ai-teams"));
  let cursor = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    add(cursor);
    add(path.join(cursor, ".claude", "ai-teams"));
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  add(CORE_ROOT);

  for (const candidate of candidates) {
    if (
      fs.existsSync(path.join(candidate, "tools", "bin")) &&
      (fs.existsSync(path.join(candidate, "index", "ENTRY.md")) || fs.existsSync(path.join(candidate, "agents")))
    ) {
      return candidate;
    }
  }
  throw new Error("无法定位 AI-Teams 根目录；请使用 --root 或设置 AI_TEAMS_ROOT");
}

function resolveAgentDirectory(root) {
  const source = path.join(root, ".claude", "agents");
  if (fs.existsSync(source)) return source;
  const parent = path.dirname(root);
  if (path.basename(parent) === ".claude") {
    const installed = path.join(parent, "agents");
    if (fs.existsSync(installed)) return installed;
  }
  return source;
}

function registryEmpty() {
  return attachRegistryFormat({
    schemaVersion: SCHEMA_VERSION,
    updatedAt: null,
    agents: {},
  }, "tool-v1", null);
}

function readRegistry(context, { optional = true } = {}) {
  if (!fs.existsSync(context.registryFile)) {
    if (optional) return registryEmpty();
    throw new Error("提示词 Registry 不存在；请先用 evolve 创建候选并完成 eval、activate");
  }
  const raw = readJson(context.registryFile, "Prompt Registry");
  const registry = normalizeRegistry(context, raw);
  validateRegistry(registry);
  return registry;
}

function normalizeRegistry(context, raw) {
  if (!isPlainObject(raw)) throw new Error("Prompt Registry 必须是 JSON 对象");
  if (raw.schemaVersion === SCHEMA_VERSION && isToolRegistryShape(raw)) {
    return attachRegistryFormat(raw, "tool-v1", null);
  }
  if (typeof raw.schemaVersion !== "string" || !/^1(?:\.|$)/.test(raw.schemaVersion) || !isPlainObject(raw.agents)) {
    throw new Error("不支持的 Prompt Registry 格式");
  }

  const registry = {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: raw.promptTools?.updatedAt || null,
    agents: {},
  };
  const activeMeta = raw.promptTools?.activeMeta || {};
  const sourceRoot = typeof raw.sourceRoot === "string" && raw.sourceRoot ? raw.sourceRoot : "prompts";
  assertRelativePath(sourceRoot, "registry.sourceRoot");

  for (const [agent, record] of Object.entries(raw.agents)) {
    if (!isPlainObject(record) || !isPlainObject(record.active)) continue;
    for (const kind of PROMPT_KINDS) {
      const legacyPath = record.active[kind];
      if (typeof legacyPath !== "string" || !legacyPath) continue;
      assertRelativePath(legacyPath, `registry.agents.${agent}.active.${kind}`);
      const rootRelative = path.posix.join(sourceRoot.replaceAll("\\", "/"), legacyPath.replaceAll("\\", "/"));
      const file = resolveInsideRoot(context.root, rootRelative, "legacy active path");
      const exists = fs.existsSync(file);
      const rawContent = exists ? fs.readFileSync(file, "utf8") : "";
      const content = exists ? extractPromptPayload(rawContent) : "\n";
      const metadata = parsePromptFrontmatter(rawContent);
      const extension = activeMeta?.[agent]?.[kind];
      const entry = {
        version: extension?.version || metadata.version || versionFromFilename(legacyPath),
        path: rootRelative,
        sha256: exists ? sha256(content) : "0".repeat(64),
        activatedAt: extension?.activatedAt || (exists ? fs.statSync(file).mtime.toISOString() : "1970-01-01T00:00:00.000Z"),
        candidateId: extension?.candidateId || null,
        risk: extension?.risk || "high",
        variables: extension?.variables || inferVariableSchema(content),
        previous: extension?.previous || null,
      };
      if (!registry.agents[agent]) registry.agents[agent] = {};
      registry.agents[agent][kind] = entry;
    }
  }
  return attachRegistryFormat(registry, "catalog-v1", raw);
}

function isToolRegistryShape(registry) {
  return Object.values(registry.agents || {}).every(
    (record) => isPlainObject(record) && !Object.prototype.hasOwnProperty.call(record, "active"),
  );
}

function attachRegistryFormat(registry, format, raw) {
  Object.defineProperties(registry, {
    _format: { value: format, enumerable: false, writable: true },
    _raw: { value: raw, enumerable: false, writable: true },
  });
  return registry;
}

function writeRegistry(context, registry) {
  validateRegistry(registry);
  if (registry._format !== "catalog-v1") {
    atomicWriteJson(context.registryFile, registry);
    return;
  }

  const raw = JSON.parse(JSON.stringify(registry._raw));
  if (!isPlainObject(raw.promptTools)) raw.promptTools = {};
  raw.promptTools.schemaVersion = SCHEMA_VERSION;
  raw.promptTools.updatedAt = registry.updatedAt;
  raw.promptTools.activeMeta = {};
  if (!isPlainObject(raw.agents)) raw.agents = {};

  for (const [agent, kinds] of Object.entries(registry.agents)) {
    if (!isPlainObject(raw.agents[agent])) raw.agents[agent] = { owner: "role", active: {} };
    if (!isPlainObject(raw.agents[agent].active)) raw.agents[agent].active = {};
    raw.promptTools.activeMeta[agent] = {};
    for (const [kind, entry] of Object.entries(kinds)) {
      const absolute = resolveInsideRoot(context.root, entry.path, "active.path");
      const legacyPath = path.relative(context.promptRoot, absolute).replaceAll("\\", "/");
      if (legacyPath.startsWith("../") || legacyPath === "..") {
        throw new Error(`active prompt 必须位于 prompts/：${entry.path}`);
      }
      raw.agents[agent].active[kind] = legacyPath;
      raw.promptTools.activeMeta[agent][kind] = persistentActiveEntry(entry);
    }
  }
  atomicWriteJson(context.registryFile, raw);
}

function validateRegistry(registry) {
  if (!isPlainObject(registry)) throw new Error("Prompt Registry 必须是 JSON 对象");
  if (registry.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Prompt Registry schemaVersion 必须为 ${SCHEMA_VERSION}`);
  }
  if (!isPlainObject(registry.agents)) throw new Error("Prompt Registry 缺少 agents 对象");
  for (const [agent, record] of Object.entries(registry.agents)) {
    assertSafeId(agent, "Registry Agent");
    if (!isPlainObject(record)) throw new Error(`Registry agents.${agent} 必须是对象`);
    for (const [kind, entry] of Object.entries(record)) {
      assertKind(kind);
      validateActiveEntry(entry, `agents.${agent}.${kind}`);
    }
  }
}

function validateActiveEntry(entry, label) {
  if (!isPlainObject(entry)) throw new Error(`${label} 必须是对象`);
  for (const required of ["version", "path", "sha256", "activatedAt"]) {
    if (typeof entry[required] !== "string" || !entry[required]) throw new Error(`${label} 缺少 ${required}`);
  }
  assertVersion(entry.version);
  assertSha(entry.sha256, `${label}.sha256`);
  assertRelativePath(entry.path, `${label}.path`);
  validateVariables(entry.variables || { required: [], optional: [] });
}

function readHistory(context) {
  if (!fs.existsSync(context.historyFile)) return [];
  const history = readJson(context.historyFile, "Prompt History");
  if (!Array.isArray(history)) throw new Error("Prompt History 必须是 JSON 数组");
  return history;
}

function candidatePaths(context, candidateId) {
  assertSafeId(candidateId, "candidate id");
  return {
    manifest: path.join(context.candidateDir, `${candidateId}.json`),
    prompt: path.join(context.candidateDir, `${candidateId}.prompt.md`),
  };
}

function readCandidate(context, candidateId) {
  const files = candidatePaths(context, candidateId);
  if (!fs.existsSync(files.manifest)) throw new Error(`候选不存在：${candidateId}`);
  const manifest = readJson(files.manifest, `候选 ${candidateId}`);
  validateCandidate(manifest, candidateId);
  const promptFile = resolveInsideRoot(context.root, manifest.promptPath, "candidate.promptPath");
  if (!fs.existsSync(promptFile)) throw new Error(`候选正文不存在：${manifest.promptPath}`);
  const rawContent = fs.readFileSync(promptFile, "utf8");
  const metadata = parsePromptFrontmatter(rawContent);
  if (metadata.agent && metadata.agent !== manifest.agent) throw new Error("候选正文 frontmatter agent 与 manifest 不一致");
  if (metadata.version && metadata.version !== manifest.version) throw new Error("候选正文 frontmatter version 与 manifest 不一致");
  const content = extractPromptPayload(rawContent);
  return { manifest, content, files: { ...files, prompt: promptFile } };
}

function validateCandidate(candidate, expectedId = "") {
  if (!isPlainObject(candidate)) throw new Error("候选 manifest 必须是 JSON 对象");
  if (candidate.schemaVersion !== SCHEMA_VERSION) throw new Error(`候选 schemaVersion 必须为 ${SCHEMA_VERSION}`);
  for (const required of ["candidateId", "agent", "kind", "version", "promptPath", "sha256", "status", "risk"]) {
    if (typeof candidate[required] !== "string" || !candidate[required]) throw new Error(`候选缺少 ${required}`);
  }
  if (expectedId && candidate.candidateId !== expectedId) throw new Error("候选 id 与文件名不一致");
  assertSafeId(candidate.candidateId, "candidate id");
  assertSafeId(candidate.agent, "agent");
  assertKind(candidate.kind);
  assertVersion(candidate.version);
  assertRelativePath(candidate.promptPath, "candidate.promptPath");
  assertSha(candidate.sha256, "candidate.sha256");
  if (!["candidate", "activated", "rejected"].includes(candidate.status)) throw new Error("候选 status 无效");
  if (!RISK_LEVELS.has(candidate.risk)) throw new Error("候选 risk 必须是 low 或 high");
  validateVariables(candidate.variables || { required: [], optional: [] });
}

async function commandStatus(context) {
  const registry = readRegistry(context);
  const candidates = listCandidates(context);
  const records = [];
  for (const [agent, kinds] of Object.entries(registry.agents).sort()) {
    if (context.options.agent && context.options.agent !== agent) continue;
    for (const [kind, entry] of Object.entries(kinds).sort()) {
      const promptFile = resolveInsideRoot(context.root, entry.path, "active.path");
      const exists = fs.existsSync(promptFile);
      const actualSha = exists ? sha256(extractPromptPayload(fs.readFileSync(promptFile, "utf8"))) : "";
      let compiled = null;
      if (kind === "system") {
        const agentFile = path.join(context.agentDir, `${agent}.md`);
        if (fs.existsSync(agentFile)) {
          const expectedBody = compileRuntimeContent(context, extractPromptPayload(fs.readFileSync(promptFile, "utf8")));
          compiled = sha256(extractAgentBody(fs.readFileSync(agentFile, "utf8"))) === sha256(expectedBody);
        } else {
          compiled = false;
        }
      }
      records.push({
        agent,
        kind,
        version: entry.version,
        path: entry.path,
        sha256: entry.sha256,
        validHash: exists && actualSha === entry.sha256,
        compiled,
      });
    }
  }

  const result = {
    root: ".",
    initialized: fs.existsSync(context.registryFile),
    activeCount: records.length,
    candidateCount: candidates.length,
    active: records,
    candidates: candidates.filter((item) => !context.options.agent || item.agent === context.options.agent).map((item) => ({
      candidateId: item.candidateId,
      agent: item.agent,
      kind: item.kind,
      version: item.version,
      risk: item.risk,
      status: item.status,
      eval: item.eval?.status || "not-run",
    })),
  };
  if (context.options.json) return printJson(result);

  process.stdout.write(`Prompt Registry：${result.initialized ? "已初始化" : "未初始化"}\n`);
  process.stdout.write(`Active：${result.activeCount}；Candidates：${result.candidateCount}\n`);
  for (const item of records) {
    const compile = item.compiled === null ? "-" : item.compiled ? "已编译" : "未同步";
    process.stdout.write(
      `- ${item.agent}/${item.kind}@${item.version} hash=${item.validHash ? "通过" : "失败"} compile=${compile}\n`,
    );
  }
  for (const item of result.candidates) {
    process.stdout.write(`- candidate ${item.candidateId} status=${item.status} eval=${item.eval} risk=${item.risk}\n`);
  }
}

async function commandRender(context) {
  const source = resolvePromptSource(context);
  const variables = readVariables(context.options);
  const rendered = renderPromptSource(source, variables);
  const result = {
    agent: source.agent,
    kind: source.kind,
    version: source.version,
    sha256: sha256(rendered),
    sourceSha256: source.sha256,
    content: rendered,
  };

  if (context.options.output) {
    const output = resolveInsideRoot(context.root, context.options.output, "--output");
    if (!context.write) {
      process.stdout.write(`DRY-RUN：将渲染到 ${portablePath(context.root, output)}\n`);
      process.stdout.write(`SHA-256：${result.sha256}\n`);
      return;
    }
    atomicWrite(output, rendered);
    process.stdout.write(`已渲染：${portablePath(context.root, output)}\n`);
    process.stdout.write(`SHA-256：${result.sha256}\n`);
    return;
  }
  if (context.options.json) printJson(result);
  else process.stdout.write(rendered);
}

async function commandCompile(context) {
  const registry = readRegistry(context, { optional: false });
  const agents = selectCompileAgents(context, registry);
  const targetDir = resolveCompileTargetDirectory(context);
  const results = [];
  for (const agent of agents) {
    const entry = registry.agents[agent]?.system;
    if (!entry) throw new Error(`${agent} 没有 active system prompt`);
    results.push(compileOne(context, agent, entry, context.write, targetDir));
  }
  if (context.options.json) return printJson(results);
  for (const result of results) {
    process.stdout.write(
      `${context.write ? "已编译" : "DRY-RUN"}：${result.agent} -> ${result.target} (${result.changed ? "有变化" : "无需变更"})\n`,
    );
  }
  if (context.write) process.stdout.write("Claude Code 已运行的会话可能缓存 Agent 定义；请在新会话中使用新 system prompt。\n");
}

async function commandEval(context) {
  const source = resolveEvalSource(context);
  const defaultCases = path.join(context.promptRoot, "agents", source.agent, "evals", "cases.json");
  const cases = readEvalCases(context.options.cases || (fs.existsSync(defaultCases) ? defaultCases : null));
  const report = evaluatePrompt(context, source, cases);
  if (context.write && source.candidateId) {
    await withPromptLock(context, () => {
      const candidate = readCandidate(context, source.candidateId);
      if (sha256(candidate.content) !== source.sha256) throw new Error("候选在评测期间发生变化，请重试");
      const manifest = {
        ...candidate.manifest,
        eval: {
          status: report.passed ? "passed" : "failed",
          evaluatedAt: nowIso(),
          sha256: report.sha256,
          checks: report.checks.map(({ id, passed, detail }) => ({ id, passed, detail })),
          caseCount: report.cases.length,
        },
      };
      atomicWriteJson(candidate.files.manifest, manifest);
      atomicWriteJson(path.join(context.reviewDir, `${source.candidateId}.json`), redactDeep(report));
    });
  }
  if (context.options.json) return printJson(report);
  process.stdout.write(`${report.passed ? "PASS" : "FAIL"}：${source.agent}/${source.kind}@${source.version}\n`);
  for (const check of report.checks) {
    process.stdout.write(`- ${check.passed ? "PASS" : "FAIL"} ${check.id}：${check.detail}\n`);
  }
  for (const testCase of report.cases) {
    process.stdout.write(`- ${testCase.passed ? "PASS" : "FAIL"} case/${testCase.name}：${testCase.detail}\n`);
  }
  if (!context.write && source.candidateId) process.stdout.write("当前为 dry-run；添加 --write 后把评测结论写回候选。\n");
  if (!report.passed) process.exitCode = 2;
}

async function commandEvolve(context) {
  const options = context.options;
  const agent = requireAgent(context, options.agent);
  const kind = requireKind(options.kind || "system");
  const version = requireVersion(options.version);
  const risk = options.risk || "high";
  if (!RISK_LEVELS.has(risk)) throw new Error("--risk 只能是 low 或 high");
  const sourceCount = [Boolean(options.input), Boolean(options.fromAgent), Boolean(options.fromActive)].filter(Boolean).length;
  if (sourceCount !== 1) throw new Error("必须且只能选择 --input、--from-agent、--from-active 之一");

  let content;
  let source;
  if (options.input) {
    const inputFile = path.resolve(options.input);
    assertReadableNonSensitiveFile(inputFile, "--input");
    content = fs.readFileSync(inputFile, "utf8");
    source = "external-input";
  } else if (options.fromAgent) {
    const agentFile = path.join(context.agentDir, `${agent}.md`);
    if (!fs.existsSync(agentFile)) throw new Error(`Agent 定义不存在：${portablePath(context.root, agentFile)}`);
    content = extractAgentBody(fs.readFileSync(agentFile, "utf8"));
    source = "claude-agent";
  } else {
    const active = readRegistry(context, { optional: false }).agents[agent]?.[kind];
    if (!active) throw new Error(`${agent}/${kind} 没有 active prompt`);
    content = readActiveContent(context, active);
    source = "active-prompt";
  }

  const sanitized = sanitizePrompt(extractPromptPayload(content));
  const placeholders = listPlaceholders(sanitized.content);
  const variables = buildVariableSchema(options.required, options.optional, placeholders);
  if (kind === "system" && (variables.required.length || variables.optional.length)) {
    throw new Error("system prompt 必须可直接编译，不能包含模板变量；动态信息应放 task/retry prompt");
  }
  const digest = sha256(sanitized.content);
  const candidateId = options.candidateId || `${agent}-${kind}-${safeSegment(version)}-${digest.slice(0, 12)}`;
  assertSafeId(candidateId, "--candidate-id");
  const files = candidatePaths(context, candidateId);
  const promptPath = portablePath(context.root, files.prompt);
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    candidateId,
    agent,
    kind,
    version,
    promptPath,
    sha256: digest,
    status: "candidate",
    risk,
    variables,
    createdAt: nowIso(),
    source,
    reason: redactText(options.reason || "未提供"),
    failureType: redactText(options.failureType || "unspecified"),
    eventId: redactText(options.eventId || ""),
    redactions: sanitized.redactions,
    eval: { status: "not-run" },
  };
  validateCandidate(manifest, candidateId);

  const result = {
    candidateId,
    agent,
    kind,
    version,
    risk,
    sha256: digest,
    variables,
    redactions: sanitized.redactions,
    promptPath,
    manifestPath: portablePath(context.root, files.manifest),
  };
  if (!context.write) {
    if (options.json) return printJson({ dryRun: true, ...result });
    process.stdout.write(`DRY-RUN：将创建候选 ${candidateId}\n`);
    process.stdout.write(`Prompt：${result.promptPath}\nManifest：${result.manifestPath}\nSHA-256：${digest}\n`);
    return;
  }

  await withPromptLock(context, () => {
    if (fs.existsSync(files.prompt) || fs.existsSync(files.manifest)) throw new Error(`候选已存在：${candidateId}`);
    atomicWrite(files.prompt, renderPromptDocument(manifest, sanitized.content, "candidate"));
    atomicWriteJson(files.manifest, manifest);
  });
  if (options.json) printJson(result);
  else {
    process.stdout.write(`已创建候选：${candidateId}\n`);
    process.stdout.write("候选没有覆盖 active；请依次执行 eval 和 activate。\n");
  }
}

async function commandActivate(context) {
  const candidateId = requireOption(context.options, "candidate", "--candidate");
  const candidate = readCandidate(context, candidateId);
  const manifest = candidate.manifest;
  if (manifest.status !== "candidate") throw new Error(`候选状态不是 candidate：${manifest.status}`);
  if (sha256(candidate.content) !== manifest.sha256) throw new Error("候选正文 SHA-256 与 manifest 不一致");
  if (manifest.eval?.status !== "passed" || manifest.eval?.sha256 !== manifest.sha256) {
    throw new Error("候选尚未通过与当前 SHA-256 匹配的 eval");
  }
  const approvals = parseApprovals(context.options.approve);
  const required = manifest.risk === "high" ? HIGH_RISK_APPROVERS : LOW_RISK_APPROVERS;
  const missing = required.filter((agent) => !approvals.includes(agent));
  if (missing.length) throw new Error(`缺少审批：${missing.join(", ")}`);

  const registry = readRegistry(context);
  const current = registry.agents[manifest.agent]?.[manifest.kind] || null;
  const activeRelative = `prompts/agents/${manifest.agent}/${manifest.kind}/${manifest.version}.prompt.md`;
  const activeFile = resolveInsideRoot(context.root, activeRelative, "active path");
  const nextEntry = {
    version: manifest.version,
    path: activeRelative,
    sha256: manifest.sha256,
    activatedAt: nowIso(),
    candidateId,
    risk: manifest.risk,
    variables: manifest.variables,
    previous: current ? compactActiveEntry(current) : null,
  };
  const summary = {
    candidateId,
    agent: manifest.agent,
    kind: manifest.kind,
    from: current?.version || null,
    to: manifest.version,
    approvals,
    activePath: activeRelative,
  };
  if (!context.write) {
    if (context.options.json) return printJson({ dryRun: true, ...summary });
    process.stdout.write(`DRY-RUN：将激活 ${manifest.agent}/${manifest.kind}@${manifest.version}\n`);
    process.stdout.write(`审批：${approvals.join(", ")}\n`);
    return;
  }

  await withPromptLock(context, () => {
    const fresh = readCandidate(context, candidateId);
    if (fresh.manifest.status !== "candidate" || sha256(fresh.content) !== manifest.sha256) {
      throw new Error("候选在激活前发生变化，请重新评测");
    }
    if (fs.existsSync(activeFile)) {
      const existing = sha256(extractPromptPayload(fs.readFileSync(activeFile, "utf8")));
      if (existing !== manifest.sha256) throw new Error(`active 版本文件已存在但内容不同：${activeRelative}`);
    } else {
      atomicWrite(activeFile, renderPromptDocument(manifest, candidate.content, "active"));
    }

    const latestRegistry = readRegistry(context);
    if (!latestRegistry.agents[manifest.agent]) latestRegistry.agents[manifest.agent] = {};
    latestRegistry.agents[manifest.agent][manifest.kind] = nextEntry;
    latestRegistry.updatedAt = nowIso();
    writeRegistry(context, latestRegistry);

    const history = readHistory(context);
    history.push({
      schemaVersion: SCHEMA_VERSION,
      timestamp: nowIso(),
      action: "activate",
      agent: manifest.agent,
      kind: manifest.kind,
      from: current ? compactActiveEntry(current) : null,
      to: compactActiveEntry(nextEntry),
      candidateId,
      approvals,
      reason: redactText(manifest.reason || ""),
    });
    atomicWriteJson(context.historyFile, history);
    atomicWriteJson(fresh.files.manifest, {
      ...fresh.manifest,
      status: "activated",
      activatedAt: nextEntry.activatedAt,
      approvals,
    });
  });
  if (context.options.json) printJson(summary);
  else {
    process.stdout.write(`已激活：${manifest.agent}/${manifest.kind}@${manifest.version}\n`);
    process.stdout.write("active 已更新，但 .claude/agents 尚未改动；system prompt 请继续执行 compile。\n");
  }
}

async function commandRollback(context) {
  const agent = requireAgent(context, context.options.agent);
  const kind = requireKind(context.options.kind || "system");
  const approvals = parseApprovals(context.options.approve);
  if (!approvals.includes("lead")) throw new Error("rollback 至少需要 --approve lead");
  const registry = readRegistry(context, { optional: false });
  const current = registry.agents[agent]?.[kind];
  if (!current) throw new Error(`${agent}/${kind} 没有 active prompt`);

  let target;
  if (context.options.to) {
    const version = requireVersion(context.options.to);
    const relative = `prompts/agents/${agent}/${kind}/${version}.prompt.md`;
    const file = resolveInsideRoot(context.root, relative, "rollback target");
    if (!fs.existsSync(file)) throw new Error(`回滚版本不存在：${relative}`);
    const content = normalizePrompt(fs.readFileSync(file, "utf8"));
    target = {
      version,
      path: relative,
      sha256: sha256(content),
      activatedAt: nowIso(),
      candidateId: null,
      risk: current.risk || "high",
      variables: inferVariableSchema(content),
    };
  } else {
    if (!current.previous) throw new Error("当前 active 没有 previous；请使用 --to 指定历史版本");
    target = {
      ...compactActiveEntry(current.previous),
      activatedAt: nowIso(),
      previous: null,
    };
  }
  if (target.version === current.version && target.sha256 === current.sha256) throw new Error("目标版本就是当前 active");
  target.previous = compactActiveEntry(current);
  const targetContent = readActiveContent(context, target);
  if (sha256(targetContent) !== target.sha256) throw new Error("回滚目标 SHA-256 校验失败");
  if (kind === "system" && listPlaceholders(targetContent).length) throw new Error("回滚目标 system prompt 含未编译变量");

  const summary = { agent, kind, from: current.version, to: target.version, compile: Boolean(context.options.compile) };
  if (!context.write) {
    if (context.options.json) return printJson({ dryRun: true, ...summary });
    process.stdout.write(`DRY-RUN：将回滚 ${agent}/${kind} ${current.version} -> ${target.version}\n`);
    if (context.options.compile) process.stdout.write("回滚后将同步编译 Agent system prompt。\n");
    return;
  }

  await withPromptLock(context, () => {
    const latest = readRegistry(context, { optional: false });
    const latestCurrent = latest.agents[agent]?.[kind];
    if (!latestCurrent || latestCurrent.sha256 !== current.sha256) throw new Error("active 在回滚前发生变化，请重试");
    latest.agents[agent][kind] = target;
    latest.updatedAt = nowIso();
    writeRegistry(context, latest);
    const history = readHistory(context);
    history.push({
      schemaVersion: SCHEMA_VERSION,
      timestamp: nowIso(),
      action: "rollback",
      agent,
      kind,
      from: compactActiveEntry(current),
      to: compactActiveEntry(target),
      approvals,
      reason: redactText(context.options.reason || "manual rollback"),
    });
    atomicWriteJson(context.historyFile, history);
  });
  if (context.options.compile && kind === "system") {
    compileOne(context, agent, target, true, resolveCompileTargetDirectory(context));
  }
  if (context.options.json) printJson(summary);
  else process.stdout.write(`已回滚：${agent}/${kind} ${current.version} -> ${target.version}\n`);
}

async function commandHistory(context) {
  const history = readHistory(context)
    .filter((event) => !context.options.agent || event.agent === context.options.agent)
    .filter((event) => !context.options.kind || event.kind === context.options.kind);
  if (context.options.json) return printJson(redactDeep(history));
  if (!history.length) {
    process.stdout.write("没有匹配的提示词历史记录。\n");
    return;
  }
  for (const event of history) {
    process.stdout.write(
      `${event.timestamp} ${event.action} ${event.agent}/${event.kind} ${event.from?.version || "-"} -> ${event.to?.version || "-"}\n`,
    );
  }
}

function resolvePromptSource(context) {
  if (context.options.candidate) {
    const candidate = readCandidate(context, context.options.candidate);
    return {
      candidateId: candidate.manifest.candidateId,
      agent: candidate.manifest.agent,
      kind: candidate.manifest.kind,
      version: candidate.manifest.version,
      sha256: candidate.manifest.sha256,
      variables: candidate.manifest.variables,
      content: candidate.content,
    };
  }
  const agent = requireAgent(context, context.options.agent);
  const kind = requireKind(context.options.kind || "task");
  const registry = readRegistry(context, { optional: false });
  const active = registry.agents[agent]?.[kind];
  if (!active) throw new Error(`${agent}/${kind} 没有 active prompt`);
  return {
    agent,
    kind,
    version: active.version,
    sha256: active.sha256,
    variables: active.variables || { required: [], optional: [] },
    content: readActiveContent(context, active),
  };
}

function resolveEvalSource(context) {
  if (context.options.candidate) return resolvePromptSource(context);
  const agent = requireAgent(context, context.options.agent);
  const kind = requireKind(context.options.kind || "system");
  const registry = readRegistry(context, { optional: false });
  const active = registry.agents[agent]?.[kind];
  if (!active) throw new Error(`${agent}/${kind} 没有 active prompt`);
  return {
    agent,
    kind,
    version: active.version,
    sha256: active.sha256,
    variables: active.variables || { required: [], optional: [] },
    content: readActiveContent(context, active),
  };
}

function evaluatePrompt(context, source, cases) {
  const checks = [];
  const add = (id, passed, detail) => checks.push({ id, passed, detail });
  const actualSha = sha256(source.content);
  add("sha256", actualSha === source.sha256, actualSha === source.sha256 ? "内容哈希匹配" : "内容哈希不匹配");
  add("non-empty", source.content.trim().length >= 40, source.content.trim().length >= 40 ? "正文非空" : "正文过短");

  let schemaError = "";
  try {
    validateVariables(source.variables);
  } catch (error) {
    schemaError = error.message;
  }
  add("variable-schema", !schemaError, schemaError || "变量 Schema 有效");
  const placeholders = listPlaceholders(source.content);
  const declared = new Set([...(source.variables?.required || []), ...(source.variables?.optional || [])]);
  const unknown = placeholders.filter((name) => !declared.has(name));
  const unusedRequired = (source.variables?.required || []).filter((name) => !placeholders.includes(name));
  add("variables-declared", unknown.length === 0, unknown.length ? `未声明变量：${unknown.join(", ")}` : "模板变量均已声明");
  add(
    "required-variables-used",
    unusedRequired.length === 0,
    unusedRequired.length ? `必填变量未使用：${unusedRequired.join(", ")}` : "必填变量均被使用",
  );
  add(
    "system-static",
    source.kind !== "system" || placeholders.length === 0,
    source.kind !== "system" || placeholders.length === 0 ? "system prompt 可直接编译" : "system prompt 不允许动态变量",
  );
  let taskContractValid = true;
  let taskContractDetail = "system prompt 无需任务合同";
  if (source.kind !== "system") {
    try {
      const variables = Object.fromEntries(
        [...(source.variables?.required || []), ...(source.variables?.optional || [])].map((name) => [name, `eval-${name}`]),
      );
      Object.assign(variables, {
        task_id: "EVAL-TASK",
        objective: "验证任务提示词合同",
        project_context: "最小评测上下文",
        allowed_scope: "评测范围",
        forbidden_scope: "禁止越界",
        output_contract: "结构化评测输出",
        acceptance: "合同字段完整",
      });
      validateTaskContract(renderPromptSource(source, variables));
      taskContractDetail = "可生成 prompt-contract-check.mjs 所需合同";
    } catch (error) {
      taskContractValid = false;
      taskContractDetail = redactText(error.message);
    }
  }
  add("task-contract", taskContractValid, taskContractDetail);
  const secretHits = findLiteralSecrets(source.content);
  add("sensitive-literals", secretHits.length === 0, secretHits.length ? `发现疑似敏感字面量：${secretHits.join(", ")}` : "未发现敏感字面量");

  const agentFile = path.join(context.agentDir, `${source.agent}.md`);
  let frontmatterValid = true;
  let frontmatterDetail = "非 system prompt 无需检查 Agent frontmatter";
  if (source.kind === "system") {
    if (!fs.existsSync(agentFile)) {
      frontmatterValid = false;
      frontmatterDetail = `Agent 文件不存在：${portablePath(context.root, agentFile)}`;
    } else {
      try {
        splitAgentDefinition(fs.readFileSync(agentFile, "utf8"));
        frontmatterDetail = "Agent frontmatter 可保留编译";
      } catch (error) {
        frontmatterValid = false;
        frontmatterDetail = error.message;
      }
    }
  }
  add("agent-frontmatter", frontmatterValid, frontmatterDetail);

  const caseResults = cases.map((testCase, index) => evaluateCase(source, testCase, index));
  return {
    schemaVersion: SCHEMA_VERSION,
    candidateId: source.candidateId || null,
    agent: source.agent,
    kind: source.kind,
    version: source.version,
    sha256: actualSha,
    evaluatedAt: nowIso(),
    passed: checks.every((check) => check.passed) && caseResults.every((item) => item.passed),
    checks,
    cases: caseResults,
  };
}

function evaluateCase(source, testCase, index) {
  if (!isPlainObject(testCase)) return { name: `case-${index + 1}`, passed: false, detail: "用例必须是对象" };
  const name = String(testCase.id || testCase.name || `case-${index + 1}`);
  try {
    if (isPlainObject(testCase.expected)) {
      const must = arrayOfStrings(testCase.expected.must || [], `${name}.expected.must`);
      const mustNot = arrayOfStrings(testCase.expected.mustNot || [], `${name}.expected.mustNot`);
      const validType = ["positive", "negative", "security", "output-contract"].includes(testCase.type);
      const validInput = isPlainObject(testCase.input) && Object.keys(testCase.input).length > 0;
      const overlap = must.filter((item) => mustNot.includes(item));
      const passed = validType && validInput && must.length > 0 && mustNot.length > 0 && overlap.length === 0;
      const detail = passed
        ? "行为评测 rubric 已登记；CLI 只验证基线结构，多次模型试运行与 QA judge 必须由 /ai:prompt-eval 记录"
        : [
            validType ? "" : "type 无效",
            validInput ? "" : "input 为空",
            must.length ? "" : "must 为空",
            mustNot.length ? "" : "mustNot 为空",
            overlap.length ? `must/mustNot 冲突：${overlap.join(", ")}` : "",
          ].filter(Boolean).join("；");
      return { name, type: testCase.type || "unknown", mode: "behavioral-rubric", passed, detail };
    }

    const rendered = renderPromptSource(source, redactSensitiveVariables(testCase.variables || {}));
    const includes = arrayOfStrings(testCase.includes || [], `${name}.includes`);
    const excludes = arrayOfStrings(testCase.excludes || [], `${name}.excludes`);
    const missing = includes.filter((needle) => !rendered.includes(needle));
    const forbidden = excludes.filter((needle) => rendered.includes(needle));
    const passed = missing.length === 0 && forbidden.length === 0;
    const detail = passed
      ? "包含/排除断言通过"
      : [missing.length ? `缺少：${missing.join(", ")}` : "", forbidden.length ? `误含：${forbidden.join(", ")}` : ""]
          .filter(Boolean)
          .join("；");
    return { name, mode: "deterministic-output", passed, detail };
  } catch (error) {
    return { name, mode: "invalid", passed: false, detail: redactText(error.message) };
  }
}

function readEvalCases(file) {
  if (!file) return [];
  const absolute = path.resolve(file);
  assertReadableNonSensitiveFile(absolute, "--cases");
  const parsed = readJson(absolute, "评测用例");
  const cases = Array.isArray(parsed) ? parsed : parsed.cases;
  if (!Array.isArray(cases)) throw new Error("评测用例必须是数组或包含 cases 数组");
  return cases;
}

function selectCompileAgents(context, registry) {
  if (context.options.all) {
    const agents = Object.keys(registry.agents).filter((agent) => registry.agents[agent]?.system).sort();
    if (!agents.length) throw new Error("Registry 中没有 active system prompt");
    return agents;
  }
  return [requireAgent(context, context.options.agent)];
}

function resolveCompileTargetDirectory(context) {
  if (!context.options.targetDir) return context.agentDir;
  const target = path.isAbsolute(context.options.targetDir)
    ? path.resolve(context.options.targetDir)
    : path.resolve(context.root, context.options.targetDir);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`--target-dir 不存在或不是目录：${redactText(context.options.targetDir)}`);
  }
  return target;
}

function compileOne(context, agent, entry, write, targetDir = context.agentDir) {
  const content = readActiveContent(context, entry);
  if (listPlaceholders(content).length) throw new Error(`${agent} active system prompt 含未渲染变量`);
  const target = path.join(targetDir, `${agent}.md`);
  if (!fs.existsSync(target)) throw new Error(`Agent 定义不存在：${portablePath(context.root, target)}`);
  const original = fs.readFileSync(target, "utf8");
  const parts = splitAgentDefinition(original);
  const frontmatterBefore = parseAgentFrontmatter(parts.frontmatter);
  const newline = parts.frontmatter.includes("\r\n") ? "\r\n" : "\n";
  const runtimeContent = compileRuntimeContent(context, content);
  const body = runtimeContent.replaceAll("\n", newline).trimEnd();
  const next = `${parts.frontmatter}${newline}${body}${newline}`;
  const frontmatterAfter = parseAgentFrontmatter(splitAgentDefinition(next).frontmatter);
  for (const field of ["tools", "color", "style", "description"]) {
    if (frontmatterBefore[field] !== frontmatterAfter[field]) throw new Error(`编译改变了 Agent frontmatter 字段：${field}`);
  }
  const changed = next !== original;
  if (write && changed) atomicWrite(target, next, fs.statSync(target).mode);
  return {
    agent,
    target: portablePath(context.root, target),
    changed,
    sha256: entry.sha256,
    frontmatterSha256: sha256(parts.frontmatter),
  };
}

function compileRuntimeContent(context, content) {
  if (path.basename(path.dirname(context.root)) === ".claude") {
    return content.replaceAll("AI_TEAMS_ROOT/", ".claude/ai-teams/");
  }
  return content;
}

function splitAgentDefinition(content) {
  const match = content.match(/^(---(?:\r?\n)[\s\S]*?(?:\r?\n)---)(?:\r?\n|$)/);
  if (!match) throw new Error("Agent 定义缺少合法 YAML frontmatter");
  return { frontmatter: match[1], body: normalizePrompt(content.slice(match[0].length)) };
}

function extractAgentBody(content) {
  return splitAgentDefinition(content).body;
}

function parseAgentFrontmatter(frontmatter) {
  const result = {};
  for (const line of frontmatter.replace(/\r/g, "").split("\n").slice(1, -1)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (match) result[match[1]] = match[2].trim();
  }
  return result;
}

function parsePromptFrontmatter(content) {
  const match = String(content).match(/^---(?:\r?\n)([\s\S]*?)(?:\r?\n)---(?:\r?\n|$)/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].replace(/\r/g, "").split("\n")) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!item) continue;
    result[item[1]] = item[2].trim().replace(/^["']|["']$/g, "");
  }
  return result;
}

function extractPromptPayload(content) {
  const raw = String(content).replace(/^\uFEFF/, "");
  const match = raw.match(/^---(?:\r?\n)([\s\S]*?)(?:\r?\n)---(?:\r?\n|$)/);
  if (!match) return normalizePrompt(raw);
  const metadata = parsePromptFrontmatter(raw);
  const promptFrontmatter =
    /prompt/i.test(metadata.type || "") ||
    Boolean(metadata.agent && metadata.version) ||
    String(metadata.id || "").startsWith("prompts-") ||
    String(metadata.id || "").startsWith("prompt-");
  return promptFrontmatter ? normalizePrompt(raw.slice(match[0].length)) : normalizePrompt(raw);
}

function renderPromptDocument(manifest, content, status) {
  const type = `${manifest.kind}-prompt`;
  return `---
id: "prompt-${yamlScalar(manifest.agent)}-${yamlScalar(manifest.kind)}-${yamlScalar(manifest.version)}"
title: "${yamlScalar(manifest.agent)} ${yamlScalar(manifest.kind)} prompt ${yamlScalar(manifest.version)}"
type: "${type}"
scope: "agent"
owner: "role"
status: "${yamlScalar(status)}"
version: "${yamlScalar(manifest.version)}"
agent: "${yamlScalar(manifest.agent)}"
candidateId: "${yamlScalar(manifest.candidateId)}"
sha256: "${yamlScalar(manifest.sha256)}"
---
${normalizePrompt(content)}`;
}

function yamlScalar(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\r", " ").replaceAll("\n", " ");
}

function versionFromFilename(file) {
  const name = path.basename(file);
  const match = name.match(/(?:^|\.)(v?[0-9]+(?:\.[0-9A-Za-z_-]+)+)\.prompt\.md$/);
  if (match) return match[1].replace(/^v/, "");
  return "0.0.0";
}

function readActiveContent(context, entry) {
  validateActiveEntry(entry, "active");
  const file = resolveInsideRoot(context.root, entry.path, "active.path");
  if (!fs.existsSync(file)) throw new Error(`active prompt 不存在：${entry.path}`);
  const content = extractPromptPayload(fs.readFileSync(file, "utf8"));
  const digest = sha256(content);
  if (digest !== entry.sha256) throw new Error(`active prompt SHA-256 不匹配：${entry.path}`);
  return content;
}

function listCandidates(context) {
  if (!fs.existsSync(context.candidateDir)) return [];
  const result = [];
  for (const name of fs.readdirSync(context.candidateDir).filter((item) => item.endsWith(".json")).sort()) {
    try {
      const candidate = readJson(path.join(context.candidateDir, name), `候选 ${name}`);
      validateCandidate(candidate, name.replace(/\.json$/, ""));
      result.push(candidate);
    } catch (error) {
      result.push({
        candidateId: name.replace(/\.json$/, ""),
        agent: "invalid",
        kind: "invalid",
        version: "invalid",
        risk: "high",
        status: "invalid",
        eval: { status: `error: ${redactText(error.message)}` },
      });
    }
  }
  return result;
}

function readVariables(options) {
  let variables = {};
  if (options.vars) {
    const value = options.vars.trim();
    if (value.startsWith("{")) {
      variables = JSON.parse(value);
    } else {
      const file = path.resolve(value);
      assertReadableNonSensitiveFile(file, "--vars");
      variables = readJson(file, "变量文件");
    }
  }
  if (!isPlainObject(variables)) throw new Error("--vars 必须解析为 JSON 对象");
  for (const assignment of options.set || []) {
    const equal = assignment.indexOf("=");
    if (equal < 1) throw new Error("--set 必须使用 key=value");
    const key = assignment.slice(0, equal);
    assertVariableName(key);
    variables[key] = assignment.slice(equal + 1);
  }
  return redactSensitiveVariables(variables);
}

function renderTemplate(content, schema, supplied, { allowExtra = false } = {}) {
  validateVariables(schema);
  if (!isPlainObject(supplied)) throw new Error("模板变量必须是对象");
  const declared = new Set([...schema.required, ...schema.optional]);
  const extras = Object.keys(supplied).filter((key) => !declared.has(key));
  if (!allowExtra && extras.length) throw new Error(`提供了未声明变量：${extras.join(", ")}`);
  const missing = schema.required.filter((key) => !Object.prototype.hasOwnProperty.call(supplied, key));
  if (missing.length) throw new Error(`缺少必填变量：${missing.join(", ")}`);
  const values = redactSensitiveVariables(supplied);
  const rendered = content.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g, (_, name) => {
    if (Object.prototype.hasOwnProperty.call(values, name)) return stringifyVariable(values[name]);
    if (schema.optional.includes(name)) return "";
    throw new Error(`模板变量未提供：${name}`);
  });
  const unresolved = listPlaceholders(rendered);
  if (unresolved.length) throw new Error(`渲染后仍有未解析变量：${unresolved.join(", ")}`);
  return normalizePrompt(rendered);
}

function renderPromptSource(source, supplied) {
  if (source.kind === "system") return renderTemplate(source.content, source.variables, supplied);
  const values = prepareTaskVariables(source, supplied);
  const schema = {
    required: unique([...(source.variables?.required || []), ...TASK_CONTRACT_REQUIRED]),
    optional: unique([...(source.variables?.optional || []), "prompt_version"]),
  };
  const rendered = renderTemplate(source.content, schema, values, { allowExtra: true });
  if (hasTaskContract(rendered)) {
    validateTaskContract(rendered);
    return rendered;
  }
  const envelope = [
    "<ai_teams_task_prompt>",
    contractField("prompt_version", values.prompt_version),
    contractField("task_id", values.task_id),
    contractField("objective", values.objective),
    contractField("project_context", values.project_context),
    contractField("allowed_scope", values.allowed_scope),
    contractField("forbidden_scope", values.forbidden_scope),
    contractField("output_contract", values.output_contract),
    contractField("acceptance", values.acceptance),
    contractField("instructions", rendered.trim()),
    "</ai_teams_task_prompt>",
    "",
  ].join("\n");
  validateTaskContract(envelope);
  return envelope;
}

function prepareTaskVariables(source, supplied) {
  const values = { ...supplied };
  values.prompt_version ||= source.version;
  values.task_id ||= "";
  values.objective ||= "";
  values.project_context ||= values.context_refs || "";
  values.allowed_scope ||= values.scope || "";
  values.forbidden_scope ||= values.forbidden_actions || "";
  values.output_contract ||= "";
  values.acceptance ||= values.acceptance_criteria || "";

  values.workflow_id ||= "WF-UNSPECIFIED";
  values.agent_id ||= source.agent;
  values.scope ||= values.allowed_scope;
  values.context_refs ||= values.project_context;
  values.instructions ||= `围绕目标执行：${values.objective}`;
  values.acceptance_criteria ||= values.acceptance;
  values.verification ||= values.acceptance;
  values.risk_level ||= "normal";
  values.lock_refs ||= "none";
  values.handoff_target ||= "lead";

  if (source.kind === "retry") {
    values.failed_attempt ||= "1";
    values.error_evidence ||= "未提供；由 Lead 补充";
    values.root_cause ||= "待 Lead 诊断";
    values.corrective_instruction ||= `修正导致任务失败的问题，并保持范围：${values.allowed_scope}`;
    values.reduced_scope ||= values.allowed_scope;
    values.forbidden_actions ||= values.forbidden_scope;
  }
  return values;
}

function hasTaskContract(content) {
  return /<ai_teams_task_prompt\b[\s\S]*<\/ai_teams_task_prompt>/u.test(content);
}

function validateTaskContract(content) {
  if (!hasTaskContract(content)) throw new Error("render 输出缺少 <ai_teams_task_prompt> 外层");
  const required = ["prompt_version", ...TASK_CONTRACT_REQUIRED];
  const missing = required.filter(
    (field) => !new RegExp(`<${field}>[\\s\\S]*?<\\/${field}>`, "u").test(content),
  );
  if (missing.length) throw new Error(`render 输出缺少 Hook 契约字段：${missing.join(", ")}`);
}

function contractField(name, value) {
  return `  <${name}>${xmlEscape(formatContractValue(value))}</${name}>`;
}

function formatContractValue(value) {
  if (Array.isArray(value)) return value.map((item) => `- ${stringifyVariable(item)}`).join("\n");
  return stringifyVariable(value);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildVariableSchema(requiredText, optionalText, placeholders) {
  const hasExplicit = requiredText !== undefined || optionalText !== undefined;
  const required = hasExplicit ? parseCsv(requiredText) : [...placeholders];
  const optional = parseCsv(optionalText);
  const schema = { required: unique(required), optional: unique(optional) };
  validateVariables(schema);
  const declared = new Set([...schema.required, ...schema.optional]);
  const unknown = placeholders.filter((name) => !declared.has(name));
  if (unknown.length) throw new Error(`模板包含未声明变量：${unknown.join(", ")}`);
  const unused = schema.required.filter((name) => !placeholders.includes(name));
  if (unused.length) throw new Error(`必填变量未在模板中使用：${unused.join(", ")}`);
  return schema;
}

function inferVariableSchema(content) {
  return { required: listPlaceholders(content), optional: [] };
}

function validateVariables(schema) {
  if (!isPlainObject(schema)) throw new Error("variables 必须是对象");
  const required = arrayOfStrings(schema.required || [], "variables.required");
  const optional = arrayOfStrings(schema.optional || [], "variables.optional");
  for (const name of [...required, ...optional]) assertVariableName(name);
  const duplicate = required.find((name) => optional.includes(name));
  if (duplicate) throw new Error(`变量不能同时必填和可选：${duplicate}`);
}

function listPlaceholders(content) {
  const result = [];
  for (const match of content.matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g)) {
    if (!result.includes(match[1])) result.push(match[1]);
  }
  return result;
}

function sanitizePrompt(content) {
  let next = normalizePrompt(content);
  let redactions = 0;
  const replace = (pattern, replacer) => {
    next = next.replace(pattern, (...args) => {
      redactions += 1;
      return typeof replacer === "function" ? replacer(...args) : replacer;
    });
  };
  replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi, "[REDACTED_PRIVATE_KEY]");
  replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [REDACTED]");
  replace(
    /\b(api[-_]?key|access[-_]?key|private[-_]?key|secret|token|password|passwd|credential|authorization|cookie)\b(\s*[:=]\s*)(["']?)([^\s"'`]+)\3/gi,
    (_, key, separator, quote) => `${key}${separator}${quote}[REDACTED]${quote}`,
  );
  return { content: normalizePrompt(next), redactions };
}

function findLiteralSecrets(content) {
  const hits = [];
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(content)) hits.push("private-key");
  if (/\bBearer\s+(?!\[REDACTED\])[A-Za-z0-9._~+/=-]{8,}/i.test(content)) hits.push("bearer-token");
  if (
    /\b(api[-_]?key|access[-_]?key|private[-_]?key|secret|token|password|passwd|credential|authorization|cookie)\b\s*[:=]\s*(?!["']?\[REDACTED\])["']?[^\s"'`]{4,}/i.test(
      content,
    )
  ) {
    hits.push("secret-assignment");
  }
  return hits;
}

function redactSensitiveVariables(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactSensitiveVariables(item, key));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, redactSensitiveVariables(child, childKey)]));
  }
  return value;
}

function redactDeep(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactDeep(item, key));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, redactDeep(child, childKey)]));
  }
  return value;
}

function redactText(input) {
  let text = String(input ?? "");
  text = text.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi, "[REDACTED_PRIVATE_KEY]");
  text = text.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [REDACTED]");
  text = text.replace(
    /\b(api[-_]?key|access[-_]?key|private[-_]?key|secret|token|password|passwd|credential|authorization|cookie)\b(\s*[:=]\s*)(["']?)([^\s"'`]+)\3/gi,
    (_, key, separator, quote) => `${key}${separator}${quote}[REDACTED]${quote}`,
  );
  return text;
}

function parseApprovals(value) {
  const approvals = parseCsv(value);
  for (const approver of approvals) {
    if (!DEFAULT_AGENTS.includes(approver)) throw new Error(`未知审批 Agent：${approver}`);
  }
  return approvals;
}

function compactActiveEntry(entry) {
  if (!entry) return null;
  return {
    version: entry.version,
    path: entry.path,
    sha256: entry.sha256,
    activatedAt: entry.activatedAt,
    candidateId: entry.candidateId || null,
    risk: entry.risk || "high",
    variables: entry.variables || { required: [], optional: [] },
  };
}

function persistentActiveEntry(entry) {
  return {
    ...compactActiveEntry(entry),
    previous: entry?.previous ? compactActiveEntry(entry.previous) : null,
  };
}

async function withPromptLock(context, operation) {
  fs.mkdirSync(context.promptRoot, { recursive: true });
  const lockFile = path.join(context.promptRoot, ".prompt-tools.lock");
  let descriptor;
  try {
    descriptor = fs.openSync(lockFile, "wx", 0o600);
    fs.writeFileSync(descriptor, `${process.pid}\n${nowIso()}\n`, "utf8");
  } catch (error) {
    if (error.code === "EEXIST") throw new Error("提示词仓库正被另一个进程修改，请稍后重试");
    throw error;
  }
  try {
    return await operation();
  } finally {
    try {
      if (descriptor !== undefined) fs.closeSync(descriptor);
    } finally {
      try {
        fs.unlinkSync(lockFile);
      } catch {
        // A missing lock during cleanup does not invalidate the committed writes.
      }
    }
  }
}

function atomicWrite(file, content, mode = 0o644) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, "wx", mode);
    fs.writeFileSync(descriptor, content, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
    try {
      const directory = fs.openSync(path.dirname(file), "r");
      fs.fsyncSync(directory);
      fs.closeSync(directory);
    } catch {
      // Directory fsync is not available on every supported platform.
    }
  } catch (error) {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    try {
      fs.unlinkSync(temporary);
    } catch {
      // Preserve the original error.
    }
    throw error;
  }
}

function atomicWriteJson(file, value) {
  atomicWrite(file, `${JSON.stringify(redactDeep(value), null, 2)}\n`);
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${label} JSON 无法解析：${redactText(error.message)}`);
  }
}

function resolveInsideRoot(root, relative, label) {
  assertRelativePath(relative, label);
  const absolute = path.resolve(root, relative);
  const boundary = `${path.resolve(root)}${path.sep}`;
  if (absolute !== path.resolve(root) && !absolute.startsWith(boundary)) throw new Error(`${label} 不能越过 AI-Teams 根目录`);
  return absolute;
}

function portablePath(root, file) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (!relative.startsWith("../") && relative !== "..") return relative || ".";
  const parent = path.dirname(root);
  const parentRelative = path.relative(parent, file).replaceAll("\\", "/");
  if (path.basename(parent) === ".claude" && !parentRelative.startsWith("../")) return `../${parentRelative}`;
  return `[external]/${path.basename(file)}`;
}

function assertRelativePath(value, label) {
  if (typeof value !== "string" || !value) throw new Error(`${label} 必须是非空相对路径`);
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) throw new Error(`${label} 不能是绝对路径`);
  const normalized = value.replaceAll("\\", "/");
  if (normalized.split("/").includes("..")) throw new Error(`${label} 不能包含 ..`);
}

function assertReadableNonSensitiveFile(file, label) {
  if (SENSITIVE_FILE.test(file)) throw new Error(`${label} 指向敏感文件，拒绝读取`);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`${label} 文件不存在：${path.basename(file)}`);
}

function requireAgent(context, value) {
  if (!value) throw new Error("缺少 --agent");
  assertSafeId(value, "--agent");
  if (!fs.existsSync(path.join(context.agentDir, `${value}.md`))) {
    throw new Error(`未注册的 Claude Code Agent：${value}`);
  }
  return value;
}

function requireKind(value) {
  if (!value) throw new Error("缺少 --kind");
  assertKind(value);
  return value;
}

function requireVersion(value) {
  if (!value) throw new Error("缺少 --version");
  assertVersion(value);
  return value;
}

function requireOption(options, key, display) {
  if (!options[key]) throw new Error(`缺少 ${display}`);
  return options[key];
}

function assertKind(kind) {
  if (!PROMPT_KINDS.has(kind)) throw new Error("kind 必须是 system、task 或 retry");
}

function assertVersion(version) {
  if (typeof version !== "string" || !/^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/.test(version)) {
    throw new Error("version 只能包含字母、数字、点、下划线和连字符，最长 64 字符");
  }
}

function assertSafeId(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${label} 必须是小写 kebab-case`);
  }
}

function assertVariableName(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(value)) throw new Error(`变量名无效：${value}`);
}

function assertSha(value, label) {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} 必须是 SHA-256 十六进制值`);
}

function parseCsv(value) {
  if (!value) return [];
  return unique(
    String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function arrayOfStrings(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`${label} 必须是字符串数组`);
  return value;
}

function unique(values) {
  return [...new Set(values)];
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringifyVariable(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function normalizePrompt(content) {
  return `${String(content).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trimEnd()}\n`;
}

function safeSegment(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "version";
}

function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(redactDeep(value), null, 2)}\n`);
}

function printHelp(command) {
  const common = `通用参数：
  --root <目录>           AI-Teams 根目录；默认自动定位
  --json                  输出 JSON
  --dry-run               明确只预览（写命令默认即为 dry-run）
  --write                 执行原子写入
  -h, --help              显示帮助

安全约束：
  - 无第三方依赖，持久化路径均保存为相对 AI-Teams 根的路径。
  - 敏感字段、Bearer Token、私钥和疑似凭据会脱敏。
  - evolve 只创建 candidate；只有 eval 通过并满足审批后 activate 才能切换 active。
  - system prompt 激活后仍需单独 compile；compile 保留 .claude/agents 的原 frontmatter。`;
  const help = {
    status: `用法：
  node tools/bin/ai-teams-prompt-status.mjs [--agent <id>] [--json] [--root <目录>]

显示 active/candidate 状态、SHA-256 完整性和 system prompt 编译同步状态。`,
    render: `用法：
  node tools/bin/ai-teams-prompt-render.mjs --agent <id> --kind <task|retry|system> [--vars <JSON或文件>] [--set key=value]
  node tools/bin/ai-teams-prompt-render.mjs --candidate <id> [--vars <JSON或文件>] [--set key=value]
  [--output <AI-Teams根内相对路径> --write]

task/retry 输出强制包含 <ai_teams_task_prompt>、prompt_version、task_id、objective、project_context、
allowed_scope、forbidden_scope、output_contract、acceptance；未指定 --output 时输出到 stdout。
敏感变量值始终替换为 [REDACTED]。`,
    compile: `用法：
  node tools/bin/ai-teams-prompt-compile.mjs --agent <id> [--target-dir <目录>] [--write]
  node tools/bin/ai-teams-prompt-compile.mjs --all [--target-dir <目录>] [--write]

把 active system prompt 编译到 Claude Code 官方 Agent 文件正文，原样保留 YAML frontmatter，
包括 tools、color、style、description；--target-dir 相对 --root 解析，也支持绝对目录。`,
    eval: `用法：
  node tools/bin/ai-teams-prompt-eval.mjs --candidate <id> [--cases <JSON文件>] [--write]
  node tools/bin/ai-teams-prompt-eval.mjs --agent <id> --kind <system|task|retry> [--cases <JSON文件>]

执行 Schema、变量、SHA-256、敏感字面量、frontmatter 和基线 rubric 检查。
未传 --cases 时自动读取 prompts/agents/<agent>/evals/cases.json。
CLI 不冒充模型行为评测；多次模型试运行、QA judge 与人工抽查由 /ai:prompt-eval 流程记录。`,
    evolve: `用法：
  node tools/bin/ai-teams-prompt-evolve.mjs --agent <id> --kind <system|task|retry> --version <版本>
    (--input <提示词文件> | --from-agent | --from-active)
    [--risk <low|high>] [--reason <原因>] [--failure-type <类型>] [--event-id <事件>]
    [--required <a,b>] [--optional <c,d>] [--candidate-id <id>] [--write]

只创建候选，不修改 active。system prompt 不允许模板变量。`,
    activate: `用法：
  node tools/bin/ai-teams-prompt-activate.mjs --candidate <id> --approve <agent,agent,...> [--write]

low 风险需要 lead,qa；high 风险需要 lead,qa,role,security-reviewer。候选必须先通过写入式 eval。`,
    rollback: `用法：
  node tools/bin/ai-teams-prompt-rollback.mjs --agent <id> [--kind <system|task|retry>] [--to <版本>]
    --approve lead [--compile] [--reason <原因>] [--write]

默认回滚到 active.previous；--compile 仅在 system prompt 回滚后同步 Agent 正文。`,
    history: `用法：
  node tools/bin/ai-teams-prompt-history.mjs [--agent <id>] [--kind <system|task|retry>] [--json]

显示 activate 与 rollback 的脱敏历史记录。`,
  };
  process.stdout.write(`${help[command] || "AI-Teams Prompt Tools"}\n\n${common}\n`);
}
