'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

// Shiprr supplies PORT at runtime. Keep a local fallback for testing.
process.env.PORT = String(process.env.PORT || '20128');
process.env.HOSTNAME = process.env.NINE_ROUTER_HOST || '0.0.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'true';
process.env.REQUIRE_API_KEY = process.env.REQUIRE_API_KEY || 'true';
process.env.INITIAL_PASSWORD = process.env.INITIAL_PASSWORD || 'admin';
process.env.DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), '.9router');

const dataDir = path.resolve(process.env.DATA_DIR);
fs.mkdirSync(dataDir, { recursive: true });

// Create stable per-deployment secrets unless the operator supplied their own.
// Keeping them in DATA_DIR avoids changing JWT/API secrets every process restart
// while the platform's ephemeral filesystem remains intact.
const secretsFile = path.join(dataDir, '.shiprr-secrets.json');
let savedSecrets = {};
try {
  savedSecrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) {
    console.error('Could not read saved secret file:', error.message);
    process.exit(1);
  }
}

const secretNames = ['JWT_SECRET', 'API_KEY_SECRET', 'MACHINE_ID_SALT'];
let secretsChanged = false;
for (const name of secretNames) {
  if (!process.env[name]) {
    if (!savedSecrets[name]) {
      savedSecrets[name] = crypto.randomBytes(48).toString('hex');
      secretsChanged = true;
    }
    process.env[name] = savedSecrets[name];
  }
}
if (secretsChanged || !fs.existsSync(secretsFile)) {
  fs.writeFileSync(secretsFile, JSON.stringify(savedSecrets, null, 2), { mode: 0o600 });
  try { fs.chmodSync(secretsFile, 0o600); } catch {}
}

const bin = path.join(__dirname, 'node_modules', '.bin', '9router');
const args = ['--port', process.env.PORT, '--no-browser', '--skip-update'];
console.log(`Starting 9Router on 0.0.0.0:${process.env.PORT}`);
console.log(`Data directory: ${process.env.DATA_DIR}`);
console.log('Default initial dashboard password: admin (unless INITIAL_PASSWORD is overridden).');
console.log('Note: INITIAL_PASSWORD applies only when no password has already been saved.');

const child = spawn(bin, args, {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start 9Router:', error.message);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`9Router stopped after signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}
