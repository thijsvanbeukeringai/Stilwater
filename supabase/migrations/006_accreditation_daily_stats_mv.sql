-- Materialized view: per project per dag totalen voor het dashboard.
-- security_invoker zodat de view RLS van onderliggende tabellen respecteert.

create materialized view if not exists accreditation_daily_stats as
with days as (
  select
    p.id as project_id,
    unnest(coalesce(p.show_days, '{}') || coalesce(p.build_days, '{}')) as day
  from projects p
),
person_days as (
  select
    person.project_id,
    d.day,
    count(*) filter (where person.status = 'approved' and d.day = any (person.approved_days)) as approved_count,
    count(*) filter (where person.status = 'checked_in' and d.day = any (person.approved_days)) as checked_in_count
  from accreditation_persons person
  cross join lateral (select unnest(person.approved_days) as day) d
  group by person.project_id, d.day
),
meals as (
  select
    person.project_id,
    meal.day,
    sum(case when 'breakfast' = any (meal.meals) then 1 else 0 end) as breakfast,
    sum(case when 'lunch'     = any (meal.meals) then 1 else 0 end) as lunch,
    sum(case when 'dinner'    = any (meal.meals) then 1 else 0 end) as dinner,
    sum(case when 'nightsnack'= any (meal.meals) then 1 else 0 end) as nightsnack
  from accreditation_persons person
  cross join lateral (
    select key as day, array(select jsonb_array_elements_text(value)) as meals
    from jsonb_each(person.meal_selections)
  ) meal
  where person.status in ('approved','checked_in')
  group by person.project_id, meal.day
),
items as (
  select
    person.project_id,
    coalesce(pi.day, 'global') as day,
    pi.item_type_id,
    sum(pi.quantity)::int as qty
  from accreditation_person_items pi
  join accreditation_persons person on person.id = pi.person_id
  where person.status in ('approved','checked_in')
  group by person.project_id, pi.day, pi.item_type_id
)
select
  d.project_id,
  d.day,
  coalesce(pd.approved_count, 0)   as persons_approved,
  coalesce(pd.checked_in_count, 0) as persons_checked_in,
  coalesce(m.breakfast, 0)         as meals_breakfast,
  coalesce(m.lunch, 0)             as meals_lunch,
  coalesce(m.dinner, 0)            as meals_dinner,
  coalesce(m.nightsnack, 0)        as meals_nightsnack,
  coalesce(
    (
      select jsonb_object_agg(it.item_type_id, it.qty)
      from items it
      where it.project_id = d.project_id and it.day = d.day
    ),
    '{}'::jsonb
  ) as item_totals
from days d
left join person_days pd on pd.project_id = d.project_id and pd.day = d.day
left join meals m       on m.project_id  = d.project_id and m.day  = d.day;

create unique index if not exists ux_acc_daily_stats_project_day
  on accreditation_daily_stats (project_id, day);

-- Refresh hook (gebruikt vanuit server action na bulk approve).
create or replace function refresh_accreditation_daily_stats()
returns void language sql security definer as $$
  refresh materialized view concurrently accreditation_daily_stats;
$$;
