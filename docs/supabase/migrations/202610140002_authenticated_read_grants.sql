-- PostgreSQL checks table privileges before row-level security policies.
-- Authenticated residents need SELECT on frontend-facing tables so RLS can
-- decide which rows each resident is allowed to read. Mutations continue to
-- use the trusted SECURITY DEFINER RPC functions.

grant usage on schema public to authenticated;

grant select on table
  public.profiles,
  public.listings,
  public.task_assignments,
  public.task_confirmations,
  public.rewards,
  public.reward_redemptions,
  public.point_transactions
to authenticated;

revoke insert, update, delete on table
  public.profiles,
  public.listings,
  public.task_assignments,
  public.task_confirmations,
  public.rewards,
  public.reward_redemptions,
  public.point_transactions
from anon, authenticated;
