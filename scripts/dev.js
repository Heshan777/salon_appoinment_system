const { spawn, execSync } = require('child_process');
const path = require('path');

const services = [
  { name: 'API-GATEWAY', dir: 'services/api-gateway', port: 5000 },
  { name: 'AUTH-SERVICE', dir: 'services/auth-service', port: 5001 },
  { name: 'BOOKING-SERVICE', dir: 'services/booking-service', port: 5002 },
  { name: 'CATALOG-SERVICE', dir: 'services/catalog-service', port: 5003 },
  { name: 'PAYMENT-SERVICE', dir: 'services/payment-service', port: 5004 },
  { name: 'NOTIF-SERVICE', dir: 'services/notification-service', port: 5005 },
  { name: 'AI-SERVICE', dir: 'services/ai-assistant-service', port: 5006 },
  { name: 'INVENTORY-SERVICE', dir: 'services/inventory-service', port: 5007 }
];

console.log('====================================================');
console.log('💈 Starting GlowSync Platform Microservices (8 Services) 💈');
console.log('====================================================');

// Pre-flight: automatically free any lingering processes on microservice ports
function clearPorts() {
  try {
    if (process.platform === 'win32') {
      execSync('powershell -NoProfile -Command "5000..5007 | ForEach-Object { $conns = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue; foreach ($c in $conns) { if ($c.OwningProcess -and $c.OwningProcess -ne $PID) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }"', { stdio: 'ignore' });
    }
  } catch (err) {
    // Silently continue if ports were already free
  }
}

clearPorts();

const processes = [];

services.forEach(s => {
  const child = spawn('node', ['src/index.js'], {
    cwd: path.resolve(__dirname, '..', s.dir),
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: s.port }
  });

  child.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.log(`[${s.name}] ${line}`));
  });

  child.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.error(`[${s.name} ERR] ${line}`));
  });

  child.on('close', code => {
    console.log(`[${s.name}] Exited with code ${code}`);
  });

  processes.push(child);
});

function cleanup() {
  console.log('\nShutting down microservices...');
  processes.forEach(p => {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' });
      } else {
        p.kill();
      }
    } catch (e) {}
  });
  clearPorts();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Keep parent process alive
setInterval(() => {}, 1000 * 60 * 60);
