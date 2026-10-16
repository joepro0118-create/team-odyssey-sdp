# Feature Specification: Task Coordination Chat

**Status:** Implemented on `zinc`; migration applied to Tolong; phone/browser verification pending
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

Use [`docs/supabase/migrations/202610140004_task_coordination_chat.sql`](supabase/migrations/202610140004_task_coordination_chat.sql) as the source of truth. Messages reference `task_assignments.id`; participation is checked against `task_assignments.helper_id` and `listings.creator_id`. The listing's status controls whether new messages are allowed.

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

## 4. Frontend UI Architecture (Designed for Easy Overhaul)

To ensure **Member 5 can easily overhaul the entire UI** without touching backend logic:

### 1. Chat state
The current implementation keeps chat state and API calls in `src/components/task-chat.tsx`. A future visual overhaul can extract these into `src/lib/hooks/use-task-chat.ts` if needed.

### 2. Chat Component: `src/components/task-chat.tsx`
- **Current placement:** Rendered from listing detail and progress screens. Its presentation can be changed without changing the server route or database policies.
- **Overhaul-ready layout:**
  - Message thread display (chat bubbles: self on right, neighbour on left).
  - 1-tap quick action chips (*"On my way"*, *"I've arrived"*, *"5 mins late"*).
  - Text input field with accessible send button.
  - Locked banner once completed (*"Handover confirmed. Chat is closed."*).

### 3. Isolated Styling:
- Styles are namespaced under `.task-chat-*` classes and driven by design tokens (CSS variables for bubble colors, borders, and radius).
- When Member 5 delivers the final Figma design system, the chat appearance can be re-skinned or converted to Tailwind CSS in minutes without refactoring components.

---

## 5. Ready-to-Execute Implementation Steps

The route, component, and styling are present on `zinc`. The migration was applied to the Tolong Supabase project. Rolled-back database checks confirmed that a helper can insert a message, the requester can read it, and an unrelated account can neither read nor send one. Complete the browser test with signed-in requester and helper accounts before calling the feature done.
