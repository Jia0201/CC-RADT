import { parentPort, workerData } from 'node:worker_threads';
import { Collector } from './collector.mjs';

const collector = new Collector(workerData);
function scan() {
  collector.scan();
  parentPort.postMessage({ type: 'state', state: collector.view() });
}
parentPort.on('message', message => {
  if (message.type !== 'evidence') return;
  const evidence = collector.snapshots.find(item => item.id === message.id) || [...collector.sources.values()].find(item => item.id === message.id);
  parentPort.postMessage({ type: 'evidence', requestId: message.requestId, evidence: evidence || null });
});
scan();
setInterval(scan, 2000);
