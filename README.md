# Tolong · Team Odyssey

Tolong is a mobile-friendly neighbourhood-help prototype for the Sime Darby Property University Hackathon 2026. It connects authenticated fictional residents through a shared Supabase-backed marketplace.

The implemented demo loop is:

1. Sign up or sign in with a fictional demo account.
2. Browse or post a request, offer, or lending listing.
3. Accept a listing from a second account.
4. The helper generates a short-lived QR code at handover.
5. The requester scans the QR code to complete the task.
6. The helper receives demo points and can redeem a demo reward.

All residents, places, listings, and rewards must remain fictional. Points have no cash value. Tolong connects residents; it does not employ or insure them.

## Local setup

Use Node.js 22 or 24 LTS and npm.

1. Copy `.env.example` to `.env.local`.
2. In Supabase, open **Project Settings → API** and copy the project URL and publishable key into `.env.local`.
3. Apply the SQL migrations in filename order from `docs/supabase/migrations/`.
4. Optionally run `docs/supabase/seed.sql` to add fictional rewards and listings.
5. Install and start the app:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a two-resident test, use two separate browsers or devices and two fictional accounts.

## Supabase integration

- Browser authentication uses only the public project URL and publishable key.
- Every API request sends the current Supabase access token to a same-origin Next.js route.
- The route verifies the user with Supabase Auth and performs database operations under that user's RLS context.
- Trusted database functions perform acceptance, QR confirmation, point awards, and redemptions.
- No service-role key or secret belongs in the browser or repository.

The frontend compatibility migration adds `area_label` and `timing` to listings and adds trusted listing-create/cancel functions. It must be applied after the two `20261013...` backend migrations.

## Main endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/listings` | Authenticated feed and current resident summary |
| `POST /api/listings` | Create a validated listing |
| `GET /api/listings/:id` | Listing detail and participant state |
| `POST /api/listings/:id/accept` | Atomically accept an open listing |
| `POST /api/tasks/:id/confirmation` | Helper creates a 15-minute QR token |
| `POST /api/tasks/confirm` | Requester confirms completion and awards points |
| `GET /api/rewards` | Current balance and active demo rewards |
| `POST /api/rewards/:id/redeem` | Atomically redeem a demo reward |

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The local unit suite covers validation, privacy boundaries, listing creation, and acceptance. A complete live test still requires two Supabase demo accounts and two browser/device sessions.

## Important files

- `src/lib/types.ts` — frontend/API contract.
- `src/lib/server/supabase.ts` — authenticated Supabase server client.
- `src/lib/server/listings.ts` — database-to-UI mapping.
- `src/app/api/` — authenticated server endpoints.
- `docs/supabase/migrations/` — schema, RLS, trusted functions, and compatibility migration.
- `docs/supabase/tests/phase4_security_audit.sql` — database security checks.
- `DECISIONS.md` — team and implementation decisions.
