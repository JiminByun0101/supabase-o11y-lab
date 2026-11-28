// Part 2, Step 4: repeat the order-list request in your test project.
// Run from the repo folder: node supabase/part2/watch_orders.mjs
// This script reads orders only. Ctrl+C stops requests, not the faulty policy.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';

const INTERVAL_MS = 30_000;
const MAX_RUNTIME_MS = 25 * 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readConfig() {
  const path = join(repoRoot, '.env.local');
  if (!existsSync(path)) throw new Error('.env.local not found in the repository root.');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.');
  if (key.startsWith('sb_secret_')) throw new Error('Use the publishable key, not a secret key.');
  const base = new URL(url);
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) {
    throw new Error('Use an HTTPS project URL (HTTP is allowed only for local development).');
  }
  return { base, key };
}

async function askPassword(email) {
  if (process.env.DEMO_PASSWORD) return process.env.DEMO_PASSWORD;
  if (!process.stdin.isTTY) throw new Error('Run in an interactive terminal to enter the demo password.');
  const muted = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  rl.once('SIGINT', () => stop.abort());
  process.stdout.write(`Password for ${email}: `);
  try {
    return await rl.question('', { signal: stop.signal });
  } finally {
    rl.close();
    process.stdout.write('\n');
  }
}

const stop = new AbortController();
process.once('SIGINT', () => stop.abort());
process.once('SIGTERM', () => stop.abort());

function requestSignal(timeout = REQUEST_TIMEOUT_MS) {
  return AbortSignal.any([stop.signal, AbortSignal.timeout(timeout)]);
}

async function main() {
  const { base, key } = readConfig();
  const email = process.env.DEMO_EMAIL || 'demo1@example.com';
  const password = await askPassword(email);
  const authUrl = new URL('/auth/v1/token?grant_type=password', base);
  const auth = await fetch(authUrl, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: requestSignal(),
    redirect: 'error',
  });
  const session = await auth.json();
  if (!auth.ok || !session.access_token) {
    throw new Error(`Sign-in failed (HTTP ${auth.status}). Check the demo user and password.`);
  }

  const ordersUrl = new URL('/rest/v1/lab_orders', base);
  ordersUrl.searchParams.set('select', 'id,item,amount,created_at');
  ordersUrl.searchParams.set('order', 'created_at.desc');
  console.log(`Signed in as ${email}. Reading orders every 30 seconds for up to 25 minutes.`);
  console.log('Press Ctrl+C to stop. Use only the Supabase test project.\n');

  const deadline = performance.now() + MAX_RUNTIME_MS;
  while (!stop.signal.aborted && performance.now() < deadline) {
    const started = performance.now();
    const timestamp = new Date().toISOString();
    const response = await fetch(ordersUrl, {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
      signal: requestSignal(Math.max(1, Math.ceil(Math.min(REQUEST_TIMEOUT_MS, deadline - started)))),
      redirect: 'error',
    });
    // Consume the response but never print order data or credentials.
    const body = await response.text();
    let detail = '';
    if (!response.ok) {
      try {
        const error = JSON.parse(body);
        detail = typeof error.code === 'string' ? ` — ${error.code}` : '';
        if (typeof error.message === 'string') detail += `: ${error.message.replace(/\s+/g, ' ').slice(0, 240)}`;
      } catch { /* The HTTP status is still useful for non-JSON errors. */ }
    }
    console.log(`${timestamp} GET /rest/v1/lab_orders -> ${response.status}${detail}`);
    if (response.status >= 400 && response.status < 500) {
      throw new Error('Unexpected client error. Check the test project, table and demo session before retrying.');
    }
    const remaining = deadline - performance.now();
    if (remaining <= 0) break;
    await sleep(Math.min(remaining, Math.max(0, INTERVAL_MS - (performance.now() - started))), undefined, { signal: stop.signal });
  }
}

try {
  await main();
} catch (error) {
  if (!stop.signal.aborted) {
    console.error(`\n${error.message}`);
    process.exitCode = 1;
  }
} finally {
  console.log('\nOrder requests stopped. If the faulty policy is still installed, run 06_remove_recursive_order_policy.sql in SQL Editor to clean up.');
}
