# Member 4 backend handoff

The new `/login` page is prepared for Supabase email/password and Google sign-in. See [AUTH-SETUP.md](AUTH-SETUP.md) for the public environment variables, provider settings, callback URL, and remaining verification. No credentials or live account configuration were added. Marketplace identity and listing adapters are still simulated and must be connected separately.

The marketplace calls same-origin JSON APIs. Keep the response contract and replace the server store/session resolution to connect Supabase. The current service is a **single-process, in-memory demo**, not a production database adapter or authentication solution.

On Vercel, `next.config.mjs` defaults to browser preview mode. `src/lib/client-api.ts` dispatches to `browser-preview.ts` in that mode, and the server memory endpoints return `503`. This is only a per-tab simulation with fictional data. After implementing durable authenticated APIs, set `NEXT_PUBLIC_DEMO_MODE=server` for the deployment and remove or update the preview notices. Do not enable the existing memory adapter on Vercel.

## HTTP contract

All JSON responses have `Cache-Control: no-store, private`. Public means visible to residents in the feed; currently every identity is simulated.

| Endpoint                        | Request                                                      | Response                                                |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `GET /api/listings`             | None                                                         | `{ listings: Listing[], resident, demo: true }`         |
| `POST /api/listings`            | `ListingInput`                                               | `201` with a `Listing`                                  |
| `GET /api/listings/:id`         | None                                                         | `ListingDetail`; contact only for accepted participants |
| `POST /api/listings/:id/accept` | `{}`                                                         | Accepted `ListingDetail`                                |
| `POST /api/demo-session`        | `{ resident: "resident-a" \| "resident-b" \| "resident-c" }` | Demo identity and HttpOnly cookie                       |

Errors are `{ error: string }`: `400` invalid content, `403` own listing/origin violation, `404` missing listing, `409` already accepted, `413` oversized payload, `415` non-JSON, `500` unexpected error. Session switching is an intentional demo feature and must be removed or gated before real authentication is enabled.

`ListingInput` includes `type` (`request`, `offer`, `lend`), `category`, `title`, `description`, `area`, and `timing`. See `src/lib/types.ts` for full types and current demo enums. Current fields are an API proposal; they do not prescribe the final database design.

The public response includes `id`, `createdAt`, `status`, `isOwner`, and `isParticipant`. It does not include raw owner IDs, accepter IDs, names, or private contacts. `ListingDetail.contact` currently contains only a fictional name and meeting note. Never attach private contacts to feed responses, even if the UI hides them.

## Replacement checklist

1. Resolve the signed-in, verified resident on the server using Supabase Auth. Never accept `ownerId`, `acceptedBy`, or arbitrary resident cookies as trusted identity. Derive and enforce the resident's township on every read and write.
2. Replace `src/lib/server/store.ts` and the `DemoMarketplace` methods with a durable adapter. If methods become asynchronous, await the result in every route handler before passing it to `json`.
3. Apply row-level security to every table. Enforce township membership, owner-only updates, and participant-only contacts in the database as well as the API. Do not expose private fields through a publicly readable table or unfiltered Supabase client query.
4. Make acceptance transactional: update only where status is `open` and owner differs from the authenticated resident. Require exactly one updated row. Return `409` if another resident accepted first.
5. Keep validation server-side. The demo's keyword checks are partial guardrails; agree on supported categories, moderation, and privacy controls before real use.
6. Remove the hardcoded demo contact map. Expose only the minimum agreed contact information after acceptance and only to the two participants.
7. Add the team's chosen confirmation method. Award points on verified completion, atomically and idempotently on the server; never on acceptance or from a client-supplied amount.
8. Decide helper attribution per listing type: for requests the accepter helps; for offers/lending the owner may be the helper. Do not assume the accepter always earns points.
9. Replace demo labels and the session selector only when those capabilities are actually real. Keep simulated rewards and integrations labelled.
10. Run the existing API/browser tests against the replacement, then test on two real phones using the deployed URL. The current local tests do not establish production readiness.

No service-role key is needed now. The example environment file has empty future public configuration names only. Keep privileged Supabase credentials server-side if your eventual adapter requires them.

## Open team decisions

QR versus short-code confirmation, point amounts/caps, rewards, cancellation/reopening, lending returns, listing expiry, final categories/areas, Bahasa Malaysia UI copy, and the shared inclusion module remain open. Member 3 does not implement these here.
