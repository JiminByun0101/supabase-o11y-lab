-- Part 2, Step 4: undo only the intentionally faulty policy.
-- The original Part 1 SELECT and INSERT policies remain in place.
drop policy if exists "check_order_access"
on public.lab_orders;
