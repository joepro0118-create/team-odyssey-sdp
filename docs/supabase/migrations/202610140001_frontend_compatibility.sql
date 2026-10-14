-- Align the marketplace frontend with the trusted Supabase backend.
-- Apply after 202610130002_secure_trigger_functions.sql.

alter table public.listings
  add column if not exists area_label text not null default 'Community hub'
    check (char_length(area_label) between 2 and 80),
  add column if not exists timing text not null default 'Flexible timing'
    check (char_length(timing) between 3 and 80);

-- Accounts that existed before the profile trigger was installed also need a
-- resident row. Metadata remains fictional and can be changed in the demo.
insert into public.profiles (id, anonymous_label, role, area_label)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'anonymous_label', ''),
    'Resident ' || upper(left(u.id::text, 6))
  ),
  'resident',
  coalesce(
    nullif(u.raw_user_meta_data ->> 'area_label', ''),
    'Demo Township'
  )
from auth.users u
on conflict (id) do nothing;

create or replace function public.create_listing(
  p_listing_type text,
  p_category text,
  p_title text,
  p_description text,
  p_area_label text,
  p_timing text
)
returns public.listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_listing public.listings;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_listing_type not in ('request', 'offer', 'lend') then
    raise exception 'Invalid listing type';
  end if;

  insert into public.listings (
    creator_id,
    listing_type,
    category,
    title,
    description,
    area_label,
    timing,
    points_reward,
    status
  ) values (
    current_user_id,
    p_listing_type,
    trim(p_category),
    trim(p_title),
    trim(p_description),
    trim(p_area_label),
    trim(p_timing),
    50,
    'open'
  )
  returning * into new_listing;

  return new_listing;
end;
$$;

create or replace function public.cancel_listing(p_listing_id uuid)
returns public.listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  cancelled_listing public.listings;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.listings
  set status = 'cancelled'
  where id = p_listing_id
    and creator_id = current_user_id
    and status = 'open'
  returning * into cancelled_listing;

  if cancelled_listing.id is null then
    raise exception 'Open listing owned by the current resident not found';
  end if;

  return cancelled_listing;
end;
$$;

-- Listing creation and status changes must go through trusted RPC functions.
revoke insert, update, delete on public.listings from anon, authenticated;

revoke all on function public.create_listing(text, text, text, text, text, text)
  from public, anon;
revoke all on function public.cancel_listing(uuid) from public, anon;

grant execute on function public.create_listing(text, text, text, text, text, text)
  to authenticated;
grant execute on function public.cancel_listing(uuid) to authenticated;
