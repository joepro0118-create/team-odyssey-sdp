-- Allow the listing owner to cancel/delete their own listing as long as it has not been completed.

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
    and status in ('open', 'accepted', 'awaiting_confirmation')
  returning * into cancelled_listing;

  if cancelled_listing.id is null then
    raise exception 'Active listing owned by the current resident not found';
  end if;

  return cancelled_listing;
end;
$$;

revoke all on function public.cancel_listing(uuid) from public, anon;
grant execute on function public.cancel_listing(uuid) to authenticated;
