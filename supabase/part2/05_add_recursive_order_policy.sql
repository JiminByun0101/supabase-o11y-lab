-- Part 2, Step 4: intentionally break order reads in the throwaway project only.
-- Run manually in SQL Editor, never as a production migration.
-- This policy queries its own table and causes SQLSTATE 42P17 (HTTP 500).
-- Keep 06_remove_recursive_order_policy.sql ready to undo this change.
create policy "check_order_access"
on public.lab_orders
as restrictive
for select
to authenticated
using (
  exists (
    select 1
    from public.lab_orders as existing_order
    where existing_order.id = lab_orders.id
      and existing_order.user_id = (select auth.uid())
  )
);
