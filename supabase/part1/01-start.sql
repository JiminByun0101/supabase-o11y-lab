create table public.lab_orders (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  item text,
  amount numeric,
  created_at timestamptz not null default now()
);

grant select on public.lab_orders to authenticated;

insert into public.lab_orders (user_id, item, amount)
select id, 'sample item for ' || email, 10 from auth.users;

select * from public.lab_orders;