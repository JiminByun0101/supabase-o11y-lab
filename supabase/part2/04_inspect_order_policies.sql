-- Part 2, Step 4: inspect existing RLS policies before the exercise.
select policyname, permissive, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename = 'lab_orders';
