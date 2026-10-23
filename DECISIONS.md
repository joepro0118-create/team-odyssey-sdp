# Decisions

## Supabase integration

- 2026-10-14: Replace the per-tab/in-memory resident demo with Supabase Auth, RLS-backed shared listings, QR handover confirmation, trusted points transactions, and demo reward redemption. Use two separate fictional accounts to demonstrate the two-resident flow.
- 2026-10-14: Keep all privileged state transitions in authenticated Next.js routes and Supabase security-definer functions. The browser receives only the Supabase project URL and publishable key; no service-role key is used.

## Confirmed with Member 3

- 2026-10-13: Create branch `Emma` and deploy a clearly labelled Vercel preview now; Member 4 connects Supabase later. The hosted preview uses per-tab simulated state that resets on reload, while the local server demo remains available.

- 2026-10-12: Build Member 3's marketplace feed, templates, listing creation, and acceptance flow in the team repository.
- 2026-10-12: Use the recommended Next.js + React + TypeScript + Tailwind stack, with a working demo backend now; Member 4 connects Supabase later.
- 2026-10-12: Keep the demo runnable without keys. The backend uses one Node.js process and fictional resident switching, explicitly labelled as simulated.

## Provisional implementation defaults for team review

These are demo placeholders, not claims that the whole team approved branding, data design, or business rules.

- 2026-10-12: Retain the working name Tolong from the supplied project context; use a warm green/cream interface and temporary CSS illustration. No final logo is established.
- 2026-10-12: Provide English marketplace copy, five categories, six editable templates, and generic fictional areas. Edit `src/lib/types.ts` to change these.
- 2026-10-12: Use plain accessible components and the native HTML dialog on top of Tailwind's CSS pipeline; no shadcn dependency is needed for this feature set.
- 2026-10-12: An open listing can be accepted by one different resident. Acceptance is a match, not exchange completion; later cancellation, return, expiry, and completion rules remain for the team to decide.
- 2026-10-12: Do not assign point values, reward inventory, confirmation methods, real identities, or final Supabase table designs in this contribution.
- 2026-10-12: Defer the shared inclusion module until the core loop and team integrations work.
- 2026-10-14: Selectively integrate Emma's login UI and Google PKCE flow into the working Supabase branch. Share one cookie-backed session; retain authenticated API routes, RLS and trusted database functions. Keep email demo signup. Do not reintroduce per-tab demo identities.

## Design overhaul (Member 5 Claude Design)

- 2026-10-15: Adopt official Sime Darby Property brand styling from `docs/design/concept.html` (90% fidelity target). Palette: `#C8102E` (Red), `#E8602A` (Orange), `#FFC72C` (Yellow/Gold), `#1B1416` (Charcoal ink), `#6B6063` (Muted), `#EFEDEB` (Warm grey page background). Montserrat typography. Curved 20px/28px cards and pill buttons.
- 2026-10-15: Convert modal-based screens to mobile-first full-screen views with floating curved bottom tab bar: Home, Activity, Post (raised yellow button), Rewards, Profile.
- 2026-10-15: Retain trusted server-side QR verification flow (helper generates temporary QR, requester scans QR) matching Supabase RPC.
- 2026-10-15: Show 'Verified resident' badge and avatar on request details before acceptance; full unit and contact details shared only after acceptance.
- 2026-10-15: Implement in-app task coordination chat per `docs/TASK_COORDINATION_CHAT.md` for accepted task participants.
- 2026-10-15: Add "Medicine (OTC)" category with guardrails against prescription drug requests per AGENTS.md.
- 2026-10-16: Open the Tolong Assistant from a Ryt-style prompt bar on Home (typed text becomes the first message) and from a link on the Post form; the floating assistant button is removed.
- 2026-10-19: Build the staff log in (`/dashboard/login`) and management dashboard (`/dashboard`) matching `DashLogin.dc.html` and `Dashboard.dc.html`, discarding the sidebar "Phone view" button, using a sessionStorage prototype staff session (no passwords stored), and using the `Dashboard.dc.html` demo dataset backed by an optional `/api/operator/summary` endpoint.

## Brand identity & logo integration

- 2026-10-23: Integrated official SimeHelp logo from design asset (`15 · SimeHelp logo-html`) across the platform, including standalone vector assets in `public/` (`icon.svg`, `logo.svg`, `logo-reversed.svg`, `logo-stacked.svg`), dynamic OG/PWA icons (`icon.tsx`, `apple-icon.tsx`, `manifest.ts`), dedicated React component (`SimeHelpLogo`), resident authentication hero, resident feed header, profile badge, and township staff dashboard views.
