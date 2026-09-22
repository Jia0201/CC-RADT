import { parentPort, workerData } from 'node:worker_threads';
import { Collector } from './collector.mjs';

const collector = new Collector(workerData);
function scan() {
  collector.scan();
  parentPort.postMessage({ type: 'state', state: collector.view() });
}
parentPort.on('message', message => {
  let evidence;
  if (message.type === 'evidence') evidence = collector.snapshots.find(item => item.id === message.id) || [...collector.sources.values()].find(item => item.id === message.id);
  else if (message.type === 'session') evidence = collector.native.sessions.find(item => item.id === message.id);
  else if (message.type === 'catalog') evidence = collector.catalog.items.find(item => item.id === message.id);
  else if (message.type === 'worktree') evidence = collector.worktree.state.files.find(item => item.id === message.id);
  else return;
  parentPort.postMessage({ type: 'evidence', requestId: message.requestId, evidence: evidence || null });
});
scan();
setInterval(scan, 2000);
