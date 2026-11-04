# supabase-o11y-lab

Companion demo app for the **Opening the Black Box: Monitoring and Debugging Your Supabase App** series.

> **Use a throwaway Supabase project.** Parts 3 and 4 open dozens of database connections and insert 1,000,000 rows. Never run these scripts against a production project.

## What You Need

| Item | Needed for | Notes |
| --- | --- | --- |
| Node.js 20.9 or later | All parts | Required by Next.js and by `node --env-file`. Check with `node -v`. |
| A free Supabase project | Parts 1–4 | Use a throwaway project. |
| An AI coding tool with MCP support (Claude Code, Cursor, Codex) | Parts 1, 2 | Optional, for the read-only MCP checks. |
| A free Grafana Cloud account | Parts 3–5 | Metrics, traces, and logs in one stack. |
| Supabase Pro plan | Part 5 only | Log Drains cost about $60/month while active. Delete the drain after testing. |

## Quick Start (Once for the Series)

1. Create a new, free project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. In **Authentication → Users → Add user**, create `demo1@example.com` and `demo2@example.com` with **Auto Confirm User** turned on.
3. Clone this repo and install dependencies:
   ```bash
   git clone https://github.com/JiminByun0101/supabase-o11y-lab.git
   cd supabase-o11y-lab
   npm install
   cp .env.example .env.local
   ```
4. Fill in `.env.local` with your project's URL, publishable key, and `demo1@example.com` credentials.
5. Run `npm run dev` and open `http://localhost:3000/api/orders`. Until you create the `lab_orders` table (Part 1), the app returns an error saying the table is missing. That is expected.

To start over at any time, run `supabase/reset.sql` in the SQL Editor.

## Branches by Part

Check out the branch that matches the post you are reading. Branches build on each other in this order:

`main` → `part/1_before` → `part/1_after` → `part/2` → `part/3` → `part/4_before` → `part/4_after` → `part/5`

Parts 1 and 4 have a `_before` and an `_after` branch because the code changes there. Use `_before` to follow the post, and compare with `_after` if you get stuck.

| Branch | Post | What it adds | What you run | Needs |
| --- | --- | --- | --- | --- |
| `part/1_before` | Part 1: Before You Launch (start) | `supabase/part1/01-start.sql`: a table with no RLS and no index | Run `01-start.sql` in the SQL Editor, then open `/api/orders` | Free |
| `part/1_after` | Part 1 (finished) | `02-security-fix.sql` and `03-performance-fix.sql` | Run `02` then `03`, refreshing the Advisors after each | Free |
| `part/2` | Part 2: Just Launched | Traffic generator for a baseline and the AI agent check | `node --env-file=.env.local scripts/traffic.mjs 10` | Free |
| `part/3` | Part 3: Get Alerted | Script that holds connections open to test your alert | `node --env-file=.env.local scripts/hold-connections.mjs 35 300` | Free + Grafana |
| `part/4_before` | Part 4: Find the Cause (start) | `supabase/part4/01-seed-slow.sql` and `02-fix.sql`, no tracing code yet | Add the tracing code from the post, then run `01-seed-slow.sql` | Free + Grafana |
| `part/4_after` | Part 4 (finished) | OpenTelemetry trace propagation and the `OTEL_*` settings | `npm run dev`, then follow the post | Free + Grafana |
| `part/5` | Part 5: Into Your Own Tools | OTLP Log Drain and Tempo-to-Loki settings in `docs/part5.md` | Follow `docs/part5.md` | Pro + Grafana |

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `/api/orders` returns 500, "table not found" | The table does not exist yet | Run `01-start.sql` from Part 1. This is expected on `main`. |
| `/api/orders` returns `[]` | RLS is on but there is no policy, or the demo user has no rows | Run `02-security-fix.sql` and check that `01-start.sql` inserted rows. |
| `Invalid login credentials` | Wrong values in `.env.local`, or Auto Confirm User was off | Fix the env values, or recreate the demo user with Auto Confirm User on. |
| `permission denied for table lab_orders` (`42501`) | Missing table grant | Run `grant select on public.lab_orders to authenticated;`. |
| `01-start.sql` fails with "relation already exists" | A previous run left the table behind | Run `supabase/reset.sql`, then `01-start.sql` again. |
| `hold-connections.mjs` fails with `ENOTFOUND` or `ENETUNREACH` | Your network has no IPv6 for the direct connection | Use the session pooler connection string, but its pool size may stop you from reaching your target. |
| Grafana alert shows `No data` | Wrong data source or metric name | Check the metric names in **Explore → Metrics browser**. |
| No traces in Tempo | `OTEL_*` variables missing, or the dev server was not restarted | Fix `.env.local` and restart `npm run dev`. |
| `trace_id` not found in Supabase Logs | `@supabase/supabase-js` is older than 2.112.3, or the tracing import is missing | Run `npm ls @supabase/supabase-js` and check `src/instrumentation.ts`. |
| No logs arrive in Loki | The drain endpoint does not end in `/v1/logs`, or the header uses `%20` | Use the full `/v1/logs` path and a real space after `Basic`. |

## Cleanup

- Delete the throwaway Supabase project, or run `supabase/reset.sql`.
- **Delete the Log Drain** (Project Settings → Log Drains) and confirm the list is empty.
- Delete the Grafana alert rule and revoke the Grafana Cloud token.