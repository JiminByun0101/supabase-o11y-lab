alter table public.lab_orders enable row level security;

create policy "own orders" on public.lab_orders
  for select using (user_id = auth.uid());