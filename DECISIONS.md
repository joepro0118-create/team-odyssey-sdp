# Decisions

## Confirmed with Member 3

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
