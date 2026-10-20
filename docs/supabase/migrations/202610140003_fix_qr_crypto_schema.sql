-- Supabase installs pgcrypto in the extensions schema. These trusted
-- functions intentionally use an empty search_path, so pgcrypto calls must be
-- schema-qualified to resolve safely at runtime.

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

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.task_confirmations (
    assignment_id, token_hash, expires_at, used_at, confirmed_by
  ) values (
    p_assignment_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
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
  where c.token_hash = encode(extensions.digest(p_qr_token, 'sha256'), 'hex')
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

revoke all on function public.create_confirmation(uuid) from public, anon;
revoke all on function public.confirm_completion(text) from public, anon;

grant execute on function public.create_confirmation(uuid) to authenticated;
grant execute on function public.confirm_completion(text) to authenticated;
