-- Check every row against the policies below.
alter table public.lab_orders enable row level security;

create policy "Users can read their own orders"
  on public.lab_orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own orders"
  on public.lab_orders for insert
  to authenticated
  with check (auth.uid() = user_id);
