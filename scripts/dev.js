const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'API-GATEWAY', dir: 'services/api-gateway', port: 5000 },
  { name: 'AUTH-SERVICE', dir: 'services/auth-service', port: 5001 },
  { name: 'BOOKING-SERVICE', dir: 'services/booking-service', port: 5002 },
  { name: 'CATALOG-SERVICE', dir: 'services/catalog-service', port: 5003 },
  { name: 'PAYMENT-SERVICE', dir: 'services/payment-service', port: 5004 },
  { name: 'NOTIF-SERVICE', dir: 'services/notification-service', port: 5005 },
  { name: 'AI-SERVICE', dir: 'services/ai-assistant-service', port: 5006 }
];

console.log('====================================================');
console.log('💈 Starting Salon Management System Microservices 💈');
console.log('====================================================');

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

process.on('SIGINT', () => {
  console.log('\nShutting down all microservices...');
  processes.forEach(p => p.kill());
  process.exit();
});

// Keep parent process alive indefinitely
setInterval(() => {}, 1000 * 60 * 60);
