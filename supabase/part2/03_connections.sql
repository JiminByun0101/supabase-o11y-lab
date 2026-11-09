-- Open database connections, by what they are doing
select state, count(*)
from pg_stat_activity
group by state
order by count(*) desc;
