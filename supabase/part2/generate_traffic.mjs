// Part 2: send the same requests the demo app sends, so the Observability page has data.
// Run it from the repo folder: node supabase/part2/generate_traffic.mjs
// It reads your Project URL and Publishable key from .env.local and asks for the demo1 password.
// Run it only against your throwaway project: it adds three test orders for demo1.

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const envPath = [join(process.cwd(), '.env.local'), join(repoRoot, '.env.local')].find(existsSync);

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

if (!envPath) {
  fail('.env.local not found. Create it from .env.example and fill in your Project URL and Publishable key (Part 0, Step 5).');
}

const env = {};
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  fail(`NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is empty in ${envPath}.`);
}

// Ask for the password without showing it on screen.
function askPassword(question) {
  return new Promise((resolvePassword) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolvePassword(answer);
    });
  });
}

const email = process.env.DEMO_EMAIL || 'demo1@example.com';
const password = process.env.DEMO_PASSWORD || (await askPassword(`Password for ${email}: `));

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const signIn = await supabase.auth.signInWithPassword({ email, password });
if (signIn.error) {
  fail(`Sign-in failed: ${signIn.error.message}\nCheck the password, and that the user was created with Auto Confirm User turned on (Part 0).`);
}
console.log(`Signed in as ${email}`);

const show = (label, error) => console.log(`${label} -> ${error ? `failed (${error.message})` : 'ok'}`);

// Load the orders list 10 times, like the app does.
for (let i = 1; i <= 10; i++) {
  const { error } = await supabase
    .from('lab_orders')
    .select('id, item, amount, created_at')
    .order('created_at', { ascending: false });
  show('GET  lab_orders   ', error);
  if (error?.code === 'PGRST205') {
    fail('The lab_orders table does not exist yet. Run supabase/part1/01_create_table_and_grant.sql from Part 1 first.');
  }
}

// Add three orders, like the app does.
for (let i = 1; i <= 3; i++) {
  const { error } = await supabase.from('lab_orders').insert({ item: `Test order ${i}`, amount: i * 10 });
  show('POST lab_orders   ', error);
}

// Ask for a table that does not exist, so failed requests show up too.
for (let i = 1; i <= 3; i++) {
  const { error } = await supabase.from('missing_table').select('*');
  console.log(`GET  missing_table -> ${error ? 'failed, as expected' : 'ok'}`);
}

console.log('\nDone. Open Observability in your dashboard to see the requests.');