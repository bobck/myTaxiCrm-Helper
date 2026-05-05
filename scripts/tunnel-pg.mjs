#!/usr/bin/env node
// SSH tunnel to a remote PostgreSQL.
// Reads all settings from .env via `node -r dotenv/config`.
// Run: npm run tunnel:pg
// Ctrl+C to close.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

function requireEnv(name) {
  const v = process.env[name];
  if (!v || String(v).trim() === '') {
    console.error(`error: env var ${name} is not set (define it in .env)`);
    process.exit(1);
  }
  return v;
}

function expandHome(p) {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return homedir() + p.slice(1);
  return p;
}

const KEY = expandHome(requireEnv('SSH_PRIVATE_KEY_PATH'));
const SSH_USER = requireEnv('SSH_USER');
const SSH_HOST = requireEnv('SSH_HOST');
const LOCAL_PORT = requireEnv('LOCAL_PG_PORT');
const REMOTE_HOST = requireEnv('REMOTE_PG_HOST');
const REMOTE_PORT = requireEnv('REMOTE_PG_PORT');

if (!existsSync(KEY)) {
  console.error(`error: SSH key not found at ${KEY}`);
  process.exit(1);
}

console.log(
  `tunnel: 127.0.0.1:${LOCAL_PORT} -> ${SSH_HOST}:${REMOTE_HOST}:${REMOTE_PORT}`
);
console.log('Ctrl+C to close.\n');

const args = [
  '-i',
  KEY,
  '-N',
  '-o',
  'IdentitiesOnly=yes',
  '-o',
  'ExitOnForwardFailure=yes',
  '-o',
  'ServerAliveInterval=30',
  '-o',
  'ServerAliveCountMax=3',
  '-L',
  `${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT}`,
  `${SSH_USER}@${SSH_HOST}`,
];

const child = spawn('ssh', args, { stdio: 'inherit' });

const forwardSignal = (sig) => () => child.kill(sig);
process.on('SIGINT', forwardSignal('SIGINT'));
process.on('SIGTERM', forwardSignal('SIGTERM'));

child.on('exit', (code) => process.exit(code ?? 0));
