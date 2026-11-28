# Part 2 — Just Launched

Continue with the throwaway project and the order app from Part 1. Never run the fault-injection SQL against a project that serves real users.

## Reports and logs

Run `node supabase/part2/generate_traffic.mjs` from the repository root. It loads orders, inserts three test orders and requests a missing table. It is unchanged for this exercise.

## Step 4 — Health Advisor

Use the existing order app. No Edge Function, additional dependency or migration is needed. The SQL files below are manual exercises, not migrations to apply together.

| File | Purpose |
| --- | --- |
| `04_inspect_order_policies.sql` | Inspect the existing RLS policies before the test and during diagnosis. |
| `05_add_recursive_order_policy.sql` | Intentionally introduce a recursive SELECT policy in the throwaway project. |
| `06_remove_recursive_order_policy.sql` | Remove only the faulty policy; safe to run again if cleanup is needed. |
| `watch_orders.mjs` | Repeat the order-list request every 30 seconds without writing data. |

1. Check that the two demo users can load their own orders and that the existing Part 1 policies are present. Open Health Advisor and refresh.
2. Run `05_add_recursive_order_policy.sql` in SQL Editor. Reload the order list; verify that it fails. The error is SQLSTATE `42P17`, mapped to HTTP `500` by PostgREST.
3. In a second terminal at the repository root, run `node supabase/part2/watch_orders.mjs`. It reads `.env.local`, asks for the demo user password, and prints the HTTP status of a GET request every 30 seconds. Expect `500` with `42P17`. Refresh Health Advisor after two complete five-minute periods. The Data API finding requires at least 10% 5XX responses in both periods; the detection delay is not guaranteed. Keep the script running while investigating. It stops automatically after 25 minutes or when you press Ctrl+C. It does not insert orders or create 404s.
4. Open the finding and choose **View logs**. In API Gateway logs, locate `GET /rest/v1/lab_orders` with status `500`. Inspect Postgres errors at the same time; look for `42P17` and `infinite recursion`. Inspect the policies again using `04_inspect_order_policies.sql`.
5. In the throwaway project only, stop the script with Ctrl+C and stop reloading the app before applying the fix. Refresh Health Advisor later. If the finding disappears, reload the order page to check whether the problem still exists. Do not rely on a fixed clearing time.
6. Run `06_remove_recursive_order_policy.sql` to restore the original configuration. Verify that both demo users can see only their own orders; restart the script briefly or reload the app to confirm fresh `200` responses in API Gateway logs, then stop the script. Refresh Health Advisor. If you stop the exercise early, run this cleanup SQL immediately.

References: [Advisors](https://supabase.com/docs/guides/observability/advisors), [Health Check Advisors](https://supabase.com/features/health-check-advisors), [PostgREST error codes](https://supabase.com/docs/guides/api/rest/postgrest-error-codes).
