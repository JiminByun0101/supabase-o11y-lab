-- Part 1, step 1: create the table and let signed-in users read and add. Run only in a throwaway project.
create table public.lab_orders (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item text not null,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- Signed-in users can read and add orders. Visitors who aren't signed in get nothing.
grant select, insert on public.lab_orders to authenticated;
