# Feature Specification: Task Coordination Chat

**Status:** Ready to Implement (Pending Team Greenlight)  
**Target:** Core Loop In-Person Coordination  
**Tech:** Supabase PostgreSQL (RLS) + Next.js App Router  

---

## 1. Overview & Purpose

Once a task is accepted, the requester and helper must coordinate handover details (e.g., *"I'm downstairs at Block B lobby"*, *"Give me 5 mins"*).

This feature adds a **task-bound, in-app messaging box** directly inside the active listing detail view.

### Privacy & Safety Rules (`AGENTS.md`)
- **Zero Phone Number Sharing:** Keeps residents' real phone numbers and personal WhatsApp accounts private.
- **Strictly Scoped:** Accessible **only** to the two participants of the task.
- **Auto-Closing:** Enabled while the task is `accepted` or `awaiting_confirmation`. Automatically locks into a read-only state when the task is confirmed via QR code.

---

## 2. Database Schema & RLS Security

### Migration: `docs/supabase/migrations/202610140004_task_coordination_chat.sql`

```sql
-- 1. Create table for task messages
CREATE TABLE IF NOT EXISTS public.task_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient chronological loading
CREATE INDEX IF NOT EXISTS idx_task_messages_task_id_created 
  ON public.task_messages(task_id, created_at ASC);

-- Enable Row Level Security
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policy: Only task participants can read messages
CREATE POLICY "Participants can read task messages"
  ON public.task_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.listings l ON l.id = t.listing_id
      WHERE t.id = task_messages.task_id
        AND (l.owner_id = auth.uid() OR t.helper_id = auth.uid())
    )
  );

-- 3. RLS Policy: Only task participants can send messages, AND only while task is active
CREATE POLICY "Participants can send task messages while active"
  ON public.task_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.listings l ON l.id = t.listing_id
      WHERE t.id = task_messages.task_id
        AND (l.owner_id = auth.uid() OR t.helper_id = auth.uid())
        AND t.status IN ('accepted', 'awaiting_confirmation')
    )
  );
```

---

## 3. Backend API Contract

### `GET /api/tasks/[id]/messages`
- **Auth:** Requires authenticated Supabase session.
- **Validation:** Verifies caller is requester or helper.
- **Response:**
  ```json
  {
    "messages": [
      {
        "id": "uuid",
        "senderId": "uuid",
        "isSelf": true,
        "senderLabel": "Requester",
        "message": "I'm downstairs at Block B lobby.",
        "createdAt": "2026-10-14T12:00:00Z"
      }
    ],
    "isLocked": false
  }
  ```

### `POST /api/tasks/[id]/messages`
- **Auth:** Requires authenticated Supabase session.
- **Payload:** `{ "message": "On my way down now!" }`
- **Validation:** 1–500 characters, rejects if task is already `completed`.
- **Response:** HTTP 201 with created message object.

---

## 4. Frontend UI Implementation

### Component: `src/components/task-chat.tsx`
- Embedded directly within `src/components/listing-detail.tsx` under the contact / connection panel.
- **UI Elements:**
  - Message thread display (chat bubbles: self on right, neighbour on left).
  - Quick action chips for common logistics (e.g., *"On my way"*, *"I've arrived"*, *"5 mins late"*).
  - Clean text input field with Send button.
  - Locked banner once completed: *"Handover confirmed. Chat is now closed."*

---

## 5. Ready-to-Execute Implementation Steps

When the team gives the green light, simply prompt:
> **"Implement task coordination chat from docs/TASK_COORDINATION_CHAT.md"**

The execution sequence will be:
1. Run SQL migration script `202610140004_task_coordination_chat.sql`.
2. Add route handler `src/app/api/tasks/[id]/messages/route.ts`.
3. Create `src/components/task-chat.tsx` and mount inside `src/components/listing-detail.tsx`.
4. Add styling in `src/app/globals.css`.
