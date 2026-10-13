-- Structural security audit for the Tolong Phase 4 backend.
-- Every row should return passed = true.

select 'browser_cannot_insert_points' as check_name,
       (not has_table_privilege('authenticated', 'public.point_transactions', 'INSERT'))::text as passed
union all
select 'browser_cannot_update_points',
       (not has_table_privilege('authenticated', 'public.point_transactions', 'UPDATE'))::text
union all
select 'listing_owner_update_policy',
       exists(
         select 1 from pg_policies
         where schemaname = 'public'
           and tablename = 'listings'
           and policyname = 'listings_update_own_open'
       )::text
union all
select 'assignment_participant_policy',
       exists(
         select 1 from pg_policies
         where schemaname = 'public'
           and tablename = 'task_assignments'
           and policyname = 'assignments_read_participants_or_operator'
       )::text
union all
select 'own_points_policy',
       exists(
         select 1 from pg_policies
         where schemaname = 'public'
           and tablename = 'point_transactions'
           and policyname = 'points_read_own_or_operator'
       )::text
union all
select 'self_accept_guard',
       (
         position(
           'You cannot accept your own listing'
           in pg_get_functiondef('public.accept_listing(uuid)'::regprocedure)
         ) > 0
       )::text
union all
select 'qr_reuse_guard',
       (
         position(
           'c.used_at is null'
           in lower(pg_get_functiondef('public.confirm_completion(text)'::regprocedure))
         ) > 0
         and exists(
           select 1 from pg_indexes
           where schemaname = 'public'
             and indexname = 'point_transactions_one_reward_per_assignment'
         )
       )::text
union all
select 'trusted_reward_redemption',
       (
         position(
           'for update'
           in lower(pg_get_functiondef('public.redeem_reward(uuid)'::regprocedure))
         ) > 0
         and position(
           'insufficient points'
           in lower(pg_get_functiondef('public.redeem_reward(uuid)'::regprocedure))
         ) > 0
       )::text;

