create table public.lab_orders (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item text not null,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- Signed-in users can read and add orders. Visitors who aren't signed in get nothing.
grant select, insert on public.lab_orders to authenticated;

-- Check every row against the policies below.
alter table public.lab_orders enable row level security;

create policy "Users can read their own orders"
  on public.lab_orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own orders"
  on public.lab_orders for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policies filter by user_id on every request, so look it up by index.
create index lab_orders_user_id_idx on public.lab_orders (user_id);