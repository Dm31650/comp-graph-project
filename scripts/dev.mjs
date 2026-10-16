import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const apiPort = process.env.API_PORT || '3001';
const children = [];
let closing = false;
function stop(code = 0) {
 if (closing) return;
 closing = true;
 children.forEach(child => child.kill());
 process.exitCode = code;
}
function launch(args) {
 const child = spawn(process.execPath, args, { cwd, stdio: 'inherit' });
 children.push(child);
 child.on('error', error => { console.error(error.message); stop(1); });
 child.on('exit', code => stop(code || 0));
 return child;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
async function apiIsHealthy() {
 try {
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(1000) });
  const health = await response.json();
  return response.ok && health.service === 'showroom-accounts' && health.database === 'ready';
 } catch { return false; }
}
// A restarted dev session can find an API server from the previous run still bound to the port.
let ready = await apiIsHealthy();
if (ready) console.log(`Reusing account server already running on port ${apiPort}`);
else launch(['server/index.mjs']);
for (let attempt = 0; attempt < 40 && !closing && !ready; attempt++) {
 await delay(250);
 ready = await apiIsHealthy();
}
if (!closing && ready) launch(['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort']);
else if (!closing) { console.error('The account server could not start. Check the error above; the website has not been started.'); stop(1); }
