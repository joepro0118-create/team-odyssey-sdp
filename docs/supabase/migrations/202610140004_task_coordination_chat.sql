-- Task coordination chat migration
-- Enables in-app coordination between task participants (creator and helper)
-- Messages are only accessible to the two participants of the active task.

create table if not exists public.task_messages (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.task_assignments(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_task_messages_assignment_id_created
  on public.task_messages(assignment_id, created_at asc);

alter table public.task_messages enable row level security;

-- Only task participants can read messages
create policy "task_messages_select_participants"
  on public.task_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.task_assignments a
      join public.listings l on l.id = a.listing_id
      where a.id = task_messages.assignment_id
        and (a.helper_id = auth.uid() or l.creator_id = auth.uid())
    )
  );

-- Only task participants can send messages while task is active
create policy "task_messages_insert_participants"
  on public.task_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.task_assignments a
      join public.listings l on l.id = a.listing_id
      where a.id = task_messages.assignment_id
        and (a.helper_id = auth.uid() or l.creator_id = auth.uid())
        and l.status in ('accepted', 'awaiting_confirmation')
    )
  );

grant select, insert on public.task_messages to authenticated;
