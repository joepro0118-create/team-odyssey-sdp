-- Tolong Phase 4 backend
-- All application data in this hackathon prototype is simulated.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  anonymous_label text not null check (char_length(anonymous_label) between 3 and 40),
  role text not null default 'resident' check (role in ('resident', 'operator')),
  area_label text not null default 'Demo Township' check (char_length(area_label) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('request', 'offer', 'lend')),
  category text not null check (char_length(category) between 2 and 40),
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 3 and 1000),
  points_reward integer not null default 50 check (points_reward > 0 and points_reward <= 500),
  status text not null default 'open'
    check (status in ('open', 'accepted', 'awaiting_confirmation', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  helper_id uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.task_confirmations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.task_assignments(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (used_at is null or confirmed_by is not null)
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 3 and 500),
  points_cost integer not null check (points_cost > 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.task_assignments(id) on delete restrict,
  redemption_id uuid references public.reward_redemptions(id) on delete restrict,
  amount integer not null check (amount <> 0),
  transaction_type text not null check (transaction_type in ('task_reward', 'redemption')),
  created_at timestamptz not null default now(),
  check (
    (transaction_type = 'task_reward' and amount > 0 and assignment_id is not null and redemption_id is null)
    or
    (transaction_type = 'redemption' and amount < 0 and assignment_id is null and redemption_id is not null)
  )
);

create unique index point_transactions_one_reward_per_assignment
  on public.point_transactions (assignment_id)
  where transaction_type = 'task_reward';

create unique index point_transactions_one_charge_per_redemption
  on public.point_transactions (redemption_id)
  where transaction_type = 'redemption';

create index listings_status_created_at_idx on public.listings (status, created_at desc);
create index listings_creator_id_idx on public.listings (creator_id);
create index listings_category_idx on public.listings (category);
create index task_assignments_helper_id_idx on public.task_assignments (helper_id);
create index task_confirmations_expires_at_idx on public.task_confirmations (expires_at);
create index point_transactions_user_id_created_at_idx
  on public.point_transactions (user_id, created_at desc);
create index reward_redemptions_user_id_created_at_idx
  on public.reward_redemptions (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, anonymous_label, role, area_label)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'anonymous_label', ''), 'Resident ' || upper(left(new.id::text, 6))),
    'resident',
    coalesce(nullif(new.raw_user_meta_data ->> 'area_label', ''), 'Demo Township')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_confirmations enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.point_transactions enable row level security;

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'operator'
  );
$$;

create policy profiles_read_self_or_operator
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or public.is_operator()
);

create policy listings_read_authenticated
on public.listings for select
to authenticated
using (true);

create policy listings_create_own
on public.listings for insert
to authenticated
with check (creator_id = (select auth.uid()) and status = 'open');

create policy listings_update_own_open
on public.listings for update
to authenticated
using (creator_id = (select auth.uid()) and status = 'open')
with check (
  creator_id = (select auth.uid())
  and status in ('open', 'cancelled')
);

create policy assignments_read_participants_or_operator
on public.task_assignments for select
to authenticated
using (
  helper_id = (select auth.uid())
  or exists (
    select 1 from public.listings l
    where l.id = task_assignments.listing_id
      and l.creator_id = (select auth.uid())
  )
  or public.is_operator()
);

create policy confirmations_read_participants_or_operator
on public.task_confirmations for select
to authenticated
using (
  exists (
    select 1
    from public.task_assignments a
    join public.listings l on l.id = a.listing_id
    where a.id = task_confirmations.assignment_id
      and (a.helper_id = (select auth.uid()) or l.creator_id = (select auth.uid()))
  )
  or public.is_operator()
);

create policy rewards_read_active
on public.rewards for select
to authenticated
using (
  active = true
  or public.is_operator()
);

create policy redemptions_read_own_or_operator
on public.reward_redemptions for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_operator()
);

create policy points_read_own_or_operator
on public.point_transactions for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_operator()
);

create or replace function public.accept_listing(p_listing_id uuid)
returns public.task_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_listing public.listings;
  new_assignment public.task_assignments;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into selected_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then raise exception 'Listing not found'; end if;
  if selected_listing.status <> 'open' then raise exception 'Listing is not open'; end if;
  if selected_listing.creator_id = current_user_id then raise exception 'You cannot accept your own listing'; end if;

  insert into public.task_assignments (listing_id, helper_id)
  values (p_listing_id, current_user_id)
  returning * into new_assignment;

  update public.listings set status = 'accepted' where id = p_listing_id;
  return new_assignment;
end;
$$;

create or replace function public.create_confirmation(p_assignment_id uuid)
returns table (qr_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  raw_token text;
  token_expiry timestamptz := now() + interval '15 minutes';
  listing_id_value uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select a.listing_id into listing_id_value
  from public.task_assignments a
  join public.listings l on l.id = a.listing_id
  where a.id = p_assignment_id
    and l.creator_id = current_user_id
    and l.status in ('accepted', 'awaiting_confirmation')
  for update of a, l;

  if not found then raise exception 'Eligible assignment not found'; end if;

  raw_token := encode(gen_random_bytes(32), 'hex');

  insert into public.task_confirmations (
    assignment_id, token_hash, expires_at, used_at, confirmed_by
  ) values (
    p_assignment_id,
    encode(digest(raw_token, 'sha256'), 'hex'),
    token_expiry,
    null,
    null
  )
  on conflict (assignment_id) do update set
    token_hash = excluded.token_hash,
    expires_at = excluded.expires_at,
    used_at = null,
    confirmed_by = null,
    created_at = now();

  update public.listings
  set status = 'awaiting_confirmation'
  where id = listing_id_value;

  return query select raw_token, token_expiry;
end;
$$;

create or replace function public.confirm_completion(p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  confirmation_record record;
  awarded_points integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select c.id as confirmation_id, c.assignment_id, a.helper_id,
         l.id as listing_id, l.creator_id, l.points_reward
  into confirmation_record
  from public.task_confirmations c
  join public.task_assignments a on a.id = c.assignment_id
  join public.listings l on l.id = a.listing_id
  where c.token_hash = encode(digest(p_qr_token, 'sha256'), 'hex')
    and c.used_at is null
    and c.expires_at > now()
    and l.status = 'awaiting_confirmation'
  for update of c, a, l;

  if not found then raise exception 'QR token is invalid, expired, or already used'; end if;
  if confirmation_record.helper_id <> current_user_id then
    raise exception 'Only the assigned helper can confirm this task';
  end if;

  awarded_points := confirmation_record.points_reward;

  update public.task_confirmations
  set used_at = now(), confirmed_by = current_user_id
  where id = confirmation_record.confirmation_id;

  update public.task_assignments
  set completed_at = now()
  where id = confirmation_record.assignment_id;

  update public.listings
  set status = 'completed'
  where id = confirmation_record.listing_id;

  insert into public.point_transactions (
    user_id, assignment_id, amount, transaction_type
  ) values (
    confirmation_record.helper_id,
    confirmation_record.assignment_id,
    awarded_points,
    'task_reward'
  );

  return jsonb_build_object(
    'assignmentId', confirmation_record.assignment_id,
    'status', 'completed',
    'pointsAwarded', awarded_points
  );
end;
$$;

create or replace function public.get_my_points_balance()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.point_transactions
  where user_id = auth.uid();
$$;

create or replace function public.redeem_reward(p_reward_id uuid)
returns public.reward_redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_reward public.rewards;
  current_balance bigint;
  new_redemption public.reward_redemptions;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select * into selected_reward
  from public.rewards
  where id = p_reward_id
  for update;

  if not found or not selected_reward.active then raise exception 'Reward is unavailable'; end if;
  if selected_reward.stock <= 0 then raise exception 'Reward is out of stock'; end if;

  select coalesce(sum(amount), 0) into current_balance
  from public.point_transactions
  where user_id = current_user_id;

  if current_balance < selected_reward.points_cost then raise exception 'Insufficient points'; end if;

  insert into public.reward_redemptions (user_id, reward_id, points_spent)
  values (current_user_id, selected_reward.id, selected_reward.points_cost)
  returning * into new_redemption;

  insert into public.point_transactions (
    user_id, redemption_id, amount, transaction_type
  ) values (
    current_user_id,
    new_redemption.id,
    -selected_reward.points_cost,
    'redemption'
  );

  update public.rewards set stock = stock - 1 where id = selected_reward.id;
  return new_redemption;
end;
$$;

create or replace function public.operator_dashboard_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'operator'
  ) then
    raise exception 'Operator access required';
  end if;

  select jsonb_build_object(
    'openListings', count(*) filter (where status = 'open'),
    'acceptedListings', count(*) filter (where status in ('accepted', 'awaiting_confirmation')),
    'completedListings', count(*) filter (where status = 'completed'),
    'totalPointsAwarded', (
      select coalesce(sum(amount), 0)
      from public.point_transactions
      where transaction_type = 'task_reward'
    ),
    'totalRedemptions', (
      select count(*)
      from public.reward_redemptions
      where status = 'confirmed'
    )
  ) into result
  from public.listings;

  return result;
end;
$$;

revoke all on function public.accept_listing(uuid) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_operator() from public, anon;
revoke all on function public.create_confirmation(uuid) from public, anon;
revoke all on function public.confirm_completion(text) from public, anon;
revoke all on function public.get_my_points_balance() from public, anon;
revoke all on function public.redeem_reward(uuid) from public, anon;
revoke all on function public.operator_dashboard_summary() from public, anon;

grant execute on function public.accept_listing(uuid) to authenticated;
grant execute on function public.is_operator() to authenticated;
grant execute on function public.create_confirmation(uuid) to authenticated;
grant execute on function public.confirm_completion(text) to authenticated;
grant execute on function public.get_my_points_balance() to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.operator_dashboard_summary() to authenticated;

revoke insert, update, delete on public.task_assignments from anon, authenticated;
revoke insert, update, delete on public.task_confirmations from anon, authenticated;
revoke insert, update, delete on public.point_transactions from anon, authenticated;
revoke insert, update, delete on public.reward_redemptions from anon, authenticated;
revoke insert, update, delete on public.rewards from anon, authenticated;

