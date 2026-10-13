-- Tolong fake demo data
-- Run after creating these confirmed demo Auth users:
-- requester@tolong-demo.test, helper@tolong-demo.test, operator@tolong-demo.test
-- Do not put their passwords in this repository.

update public.profiles p
set anonymous_label = case u.email
      when 'requester@tolong-demo.test' then 'Resident 104'
      when 'helper@tolong-demo.test' then 'Resident 208'
      when 'operator@tolong-demo.test' then 'Township Operator'
    end,
    role = case when u.email = 'operator@tolong-demo.test' then 'operator' else 'resident' end,
    area_label = 'Demo Township'
from auth.users u
where p.id = u.id
  and u.email in (
    'requester@tolong-demo.test',
    'helper@tolong-demo.test',
    'operator@tolong-demo.test'
  );

insert into public.rewards (id, title, description, points_cost, stock, active, is_demo)
values
  ('10000000-0000-4000-8000-000000000001', 'Community Café Drink', 'Demo reward for one drink at the fictional community café.', 100, 20, true, true),
  ('10000000-0000-4000-8000-000000000002', 'Sports Court Pass', 'Demo reward for one fictional township sports court session.', 200, 10, true, true),
  ('10000000-0000-4000-8000-000000000003', 'Family Activity Pass', 'Demo reward for one fictional township family activity.', 300, 5, true, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  points_cost = excluded.points_cost,
  stock = excluded.stock,
  active = excluded.active,
  is_demo = excluded.is_demo;

insert into public.listings (
  id, creator_id, listing_type, category, title, description, points_reward, status
)
select
  '20000000-0000-4000-8000-000000000001',
  u.id,
  'request',
  'Groceries',
  'Help collect a few groceries',
  'Demo request for collecting a small grocery order from a nearby shop.',
  50,
  'open'
from auth.users u
where u.email = 'requester@tolong-demo.test'
on conflict (id) do nothing;

insert into public.listings (
  id, creator_id, listing_type, category, title, description, points_reward, status
)
select
  '20000000-0000-4000-8000-000000000002',
  u.id,
  'lend',
  'Household',
  'Foldable ladder available to borrow',
  'Demo listing for a foldable household ladder available for a short loan.',
  50,
  'open'
from auth.users u
where u.email = 'helper@tolong-demo.test'
on conflict (id) do nothing;

