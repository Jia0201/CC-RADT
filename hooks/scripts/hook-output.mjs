const additionalContextEvents = new Set([
  "SessionStart",
  "Setup",
  "SubagentStart",
  "UserPromptSubmit",
  "UserPromptExpansion",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PostToolBatch",
]);

export function buildHookContextOutput(eventName, message, options = {}) {
  const event = String(eventName || "");
  const output = { suppressOutput: true };

  if (additionalContextEvents.has(event)) {
    output.hookSpecificOutput = {
      hookEventName: event,
      additionalContext: String(message || ""),
    };
    return output;
  }

  if (event === "Stop" && options.blockOnStop && !options.stopHookActive) {
    output.decision = "block";
    output.reason = String(message || "");
  }

  return output;
}

export function emitHookContext(eventName, message, options = {}) {
  console.log(JSON.stringify(buildHookContextOutput(eventName, message, options)));
}

