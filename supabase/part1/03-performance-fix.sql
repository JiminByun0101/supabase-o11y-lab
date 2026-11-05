drop policy "own orders" on public.lab_orders;

create policy "own orders" on public.lab_orders
  for select using (user_id = (select auth.uid()));

create index on public.lab_orders (user_id);