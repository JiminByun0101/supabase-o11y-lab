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

1. Check that the two demo users can load their own orders and that the existing Part 1 policies are present. Open Health Advisor and refresh.
2. Run `05_add_recursive_order_policy.sql` in SQL Editor. Reload the order list; verify that it fails. The error is SQLSTATE `42P17`, mapped to HTTP `500` by PostgREST.
3. Reload the app several times in each of two consecutive five-minute periods. The Data API finding requires at least 10% 5XX responses in both periods (observed in the finding description). Refresh Health Advisor after both periods finish. The exact number of reloads and detection delay are not guaranteed. The existing traffic generator also writes data and creates 404s, so it is not needed here.
4. Open the finding and choose **View logs**. In API Gateway logs, locate `GET /rest/v1/lab_orders` with status `500`. Inspect Postgres errors at the same time; look for `42P17` and `infinite recursion`. Inspect the policies again using `04_inspect_order_policies.sql`.
5. In the throwaway project only, stop sending requests before applying the fix. Refresh Health Advisor later. If the finding disappears, reload the order page to check whether the problem still exists. Do not rely on a fixed clearing time.
6. Run `06_remove_recursive_order_policy.sql` to restore the original configuration. Verify that both demo users can see only their own orders; confirm fresh `200` responses in API Gateway logs. Refresh Health Advisor. If you stop the exercise early, run this cleanup SQL immediately.

References: [Advisors](https://supabase.com/docs/guides/observability/advisors), [Health Check Advisors](https://supabase.com/features/health-check-advisors), [PostgREST error codes](https://supabase.com/docs/guides/api/rest/postgrest-error-codes).
