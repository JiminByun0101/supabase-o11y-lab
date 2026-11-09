# supabase-o11y-lab

Companion app for the **Opening the Black Box** series on Supabase observability.
A user signs in with email and password in the browser, sees their own orders, and adds new ones.

> **Use a throwaway Supabase project.** You will create test users and test data in it. Never point this app at a project that serves real users.

## Run it

1. Create a new free project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. In **Authentication → Users → Add user → Create new user**, create `demo1@example.com` and `demo2@example.com`, each with a password and **Auto Confirm User** turned on.
3. Clone this repo and install:
   ```bash
   git clone https://github.com/JiminByun0101/supabase-o11y-lab.git
   cd supabase-o11y-lab
   npm install
   cp .env.example .env.local
   ```
4. Fill in `.env.local` with your Project URL and Publishable key. It holds only those two values. You sign in with the demo user's email and password in the browser.
5. `npm run dev`, open http://localhost:3000, and sign in. Until you create the `lab_orders` table in Part 1, the list shows a "table not found" error. That is expected.

You need Node.js 20.9 or later.

## Where things are

| Where | What |
| --- | --- |
| `supabase/part1/` to `supabase/part4/` | The SQL for each part |
| `supabase/reset.sql` | Removes the demo table so you can start over |
| branch `part/4_after` | `main` plus the finished tracing code for Part 4 |

## Cleanup

- Delete the throwaway Supabase project, or run `supabase/reset.sql`.
- If you tried Part 5, **delete the Log Drain** (Project Settings → Log Drains) and confirm the list is empty.
- Delete any Grafana alert rules and revoke the Grafana Cloud key.
