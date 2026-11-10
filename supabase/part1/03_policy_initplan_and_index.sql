-- Work out the current user once per query, not once per row.
alter policy "Users can read their own orders"
  on public.lab_orders
  using ((select auth.uid()) = user_id);

alter policy "Users can add their own orders"
  on public.lab_orders
  with check ((select auth.uid()) = user_id);

-- Policies filter by user_id on every request, so look it up by index.
create index lab_orders_user_id_idx on public.lab_orders (user_id);
