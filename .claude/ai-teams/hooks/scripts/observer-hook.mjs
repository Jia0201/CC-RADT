#!/usr/bin/env node
// Additive, fail-open observation only. No task commands, permissions or business writes.
import { context, ensureService, recordHook, firstNotice, accessURL } from '../../tools/observer/runtime.mjs';

if (process.env.AI_TEAMS_OBSERVER === '0') process.exit(0);
let data;
try {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 2 * 1024 * 1024) process.exit(0);
  }
  data = JSON.parse(input);
  const ctx = context();
  const record = recordHook(ctx, data);
  if (record && data.hook_event_name === 'SessionStart') {
    const service = await ensureService(ctx);
    if (firstNotice(ctx, service, record.sessionId)) {
      const url = accessURL(service, record.sessionId);
      const message = `CC-RADT 只读观察台已就绪\n${url}\n当前会话：${record.sessionId}。同项目多会话共享服务，可在页面切换；执行与审批仍在 CC CLI。`;
      console.log(JSON.stringify({
        systemMessage: message,
        hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: '请在首次回复中简短展示以下本机观察台地址，方便用户打开。不要启动浏览器或重复启动服务。\n' + message },
      }));
    }
  }
} catch {
  // Never return exit 2 or a decision field: an observer failure cannot block Claude.
  if (data?.hook_event_name === 'SessionStart') console.log(JSON.stringify({ systemMessage: 'CC-RADT 观察台暂不可用；不影响 CC 执行。可在终端运行 tools/observer/cli.mjs status 检查。' }));
}
