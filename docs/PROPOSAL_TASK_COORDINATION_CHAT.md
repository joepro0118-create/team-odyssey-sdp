# Proposal: Post-Acceptance Task Coordination Chat

**Status:** Under Team Discussion  
**Date Proposed:** 2026-10-14  
**Context:** Hackathon Core Loop Coordination & Resident Privacy  

---

## 1. Problem Statement

In the current MVP flow:
1. Resident A posts a request (e.g. *"Need to borrow a drill"* or *"Parcel pickup"*).
2. Resident B accepts the task.
3. The app displays the neighbour's display name and a static meeting note.
4. Both meet in person and scan a QR code to confirm.

### The Friction
There is currently **no live communication channel** once a task is accepted. In real scenarios, residents need to coordinate handover logistics:
- *"I'm downstairs at Block B lobby."*
- *"Give me 5 minutes, coming down now."*
- *"Can we reschedule to 7:00 PM?"*
- *"Where exactly should we meet?"*

Without direct coordination, either resident is left waiting or guessing, increasing the risk of failed exchanges.

---

## 2. Alignment with Core Rules (`AGENTS.md`)

- **Privacy First:** External communication (like WhatsApp or phone numbers) forces neighbours to reveal private personal contact details to strangers. An **in-app, task-bound coordination chat protects resident privacy** by keeping everything inside the app under anonymous display names.
- **Useful First, Social Second:** The chat is not a persistent social network. It exists solely to facilitate the physical handover.
- **Lifecycle Bound:** The conversation unlocks upon task acceptance and automatically locks (or archives) when the QR code is scanned and the task is marked `completed`.

---

## 3. Options for Team Discussion

### Option 1: Task-Bound In-App Quick Chat (Recommended)
- **Description:** A lightweight chat drawer or panel inside the active task detail view.
- **Access:** Strictly restricted to the 2 participants (requester and helper) via Supabase Row-Level Security (RLS).
- **Behavior:** 
  - Enabled when `task.status === 'accepted'` or `'awaiting_confirmation'`.
  - Automatically disabled/read-only once `task.status === 'completed'`.
- **Backend Requirements:** A single Supabase table (`task_messages`) with columns `id`, `task_id`, `sender_id`, `message`, `created_at` protected by RLS policies.
- **Pros:** Flexible, natural coordination, keeps phone numbers private.
- **Cons:** Requires a basic chat UI component and Supabase table.

### Option 2: 1-Tap Preset Status Pings (Minimalist Alternative)
- **Description:** Instead of open text, provide quick status buttons:
  - 🏃 *"On my way"*
  - 📍 *"I've arrived at the meetup spot"*
  - ⏱️ *"Running 5 minutes late"*
  - 👍 *"Acknowledged"*
- **Pros:** Extremely fast to implement, zero moderation or inappropriate content risk.
- **Cons:** Less flexible if a resident needs to communicate specific instructions (e.g., *"Leave it with the guard"*).

### Option 3: WhatsApp Click-to-Chat Linkout
- **Description:** A button that opens WhatsApp using `wa.me/<phone_number>`.
- **Pros:** Easiest to implement.
- **Cons:** **Violates privacy principles in `AGENTS.md`** by exposing personal phone numbers. Not recommended.

---

## 4. Key Questions for the Team

1. **Option Selection:** Does the team prefer open in-app messaging (Option 1) or 1-tap quick status pings (Option 2)?
2. **Message Retention:** Should messages be wiped upon QR completion, or remain viewable as read-only history?
3. **Task Assignment:**
   - **Member 3 (Frontend):** Chat bubble / status component in `src/components/listing-detail.tsx`.
   - **Member 4 (Backend):** `task_messages` table migration and RLS policies.
