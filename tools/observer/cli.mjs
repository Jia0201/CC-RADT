#!/usr/bin/env node
import process from 'node:process';
import { context, optionsFromArgs, ensureService, probe, accessURL } from './runtime.mjs';

const [command = 'help', ...args] = process.argv.slice(2);
try {
  if (command === 'help' || command === '--help') {
    console.log('CC-RADT 只读观察台\nnode tools/observer/cli.mjs start|status|stop [--project <业务目录>]\n安装态：node .claude/ai-teams/tools/observer/cli.mjs start|status|stop\nAI_TEAMS_OBSERVER=0 禁用自动观测。stop 只停止观察器，不操作 CC 会话。');
  } else {
    const ctx = context(optionsFromArgs(args));
    if (command === 'start') console.log(accessURL(await ensureService(ctx)));
    else if (command === 'status') {
      const service = await probe(ctx);
      console.log(JSON.stringify({ running: !!service, url: service ? accessURL(service) : null, dataDir: ctx.dataDir }, null, 2));
    } else if (command === 'stop') {
      const service = await probe(ctx);
      // Verify authenticated service identity before signaling this specific observer PID.
      if (service) process.kill(service.pid, 'SIGTERM');
      console.log(service ? '已请求停止本项目观察器；CC 会话不受影响。' : '本项目没有已验证的观察服务。');
    } else throw new Error('未知命令；使用 --help');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
