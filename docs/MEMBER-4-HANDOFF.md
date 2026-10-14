# Member 4 backend integration

Member 3's marketplace UI is now connected to Member 4's Supabase backend on the `frontend-supabase-integration` branch.

## Contract implemented

The UI uses the camelCase contract in `src/lib/types.ts`; the server adapter maps it to the snake_case Supabase schema. Identity comes only from a verified Supabase access token. Client input cannot choose an owner, listing status, point value, helper, or redemption cost.

| UI field | Supabase field |
| --- | --- |
| `type` | `listings.listing_type` |
| `area` | `listings.area_label` |
| `timing` | `listings.timing` |
| `pointsReward` | `listings.points_reward` |
| `createdAt` | `listings.created_at` |
| `assignmentId` | `task_assignments.id` |

## Trusted state transitions

- `create_listing` fixes the owner to `auth.uid()`, the initial status to `open`, and the demo reward to 50 points.
- `accept_listing` prevents self-acceptance and races by locking the open listing.
- `create_confirmation` allows only the helper to create a short-lived QR token and stores only its hash.
- `confirm_completion` allows only the requester to use the token and awards points once.
- `redeem_reward` checks balance and stock and records the redemption and point charge together.

## Remaining setup

The compatibility migration was applied and verified on the live Tolong project on 2026-10-14. The remaining setup is:

1. Local public Supabase configuration and fictional requester/helper accounts already exist. Configure the same public variables in the intended Vercel deployment.
2. See [auth integration](AUTH-INTEGRATION.md): Emma's login is integrated; Google provider configuration and access to her Vercel project remain outstanding.
3. Test successful login, logout, and the complete loop on two phones or separate browsers. Do not create replacement accounts or rerun base migrations.

The obsolete `/api/demo-session` endpoint and visible resident switcher were removed. The old in-memory classes remain only for isolated unit tests and are not used by the production application.
