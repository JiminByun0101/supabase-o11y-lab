-- The ten queries that take the most total time
select
  calls,
  round(total_exec_time::numeric, 1) as total_ms,
  round(mean_exec_time::numeric, 2) as mean_ms,
  left(query, 80) as query
from extensions.pg_stat_statements
order by total_exec_time desc
limit 10;
