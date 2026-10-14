# Verification record

## Supabase integration — 2026-10-14

Passed locally:

- TypeScript checking with `npm run typecheck`.
- Nine isolated validation, privacy, listing, acceptance, and preview-adapter tests with `npm test`.
- Complete Next.js production build: Webpack compilation, TypeScript, page-data collection, static generation, and route output.
- React review for component structure, hook cleanup, accessibility labels, conditional third-party camera loading, and mobile navigation sizing.
- The frontend compatibility migration was applied to the live Tolong Supabase project. A follow-up aggregate check returned `true` for both columns, both trusted functions, authenticated execute access, blocked direct listing writes, and complete profile backfill.
- The idempotent fictional seed was applied. A follow-up query returned three active demo rewards; sample listings remain conditional on the named fictional accounts existing.

The local in-app browser could not reach the Windows dev-server port because the browser runs in an isolated environment. Browser automation therefore stopped at that boundary; live browser and two-phone verification still need the configured demo accounts and a reachable/deployed URL.

Still required before calling the live demo complete:

1. Configure the public Supabase URL and publishable key in Vercel. Local configuration is already present.
2. Use the existing fictional requester/helper accounts. They do not need to be recreated.
3. Run the E2E suite with `E2E_RESIDENT_A_EMAIL`, `E2E_RESIDENT_A_PASSWORD`, `E2E_RESIDENT_B_EMAIL`, and `E2E_RESIDENT_B_PASSWORD` set.
4. Test post → accept → QR completion → points → reward redemption on two physical phones and the deployed link.

The E2E suite skips when its live Supabase configuration is absent; it never contains or invents credentials.

## Emma authentication integration — 2026-10-14

- Final production build and TypeScript check passed. Nine unit tests passed.
- Chrome browser suite: five passed, two live-account tests skipped. Verified home-to-login redirect without browser errors, mobile layout/password/signup controls, invalid-credentials feedback using a mocked Auth response, safe failed-callback redirect, and 401 responses for unauthenticated feed/rewards access.
- Reviewed the mobile screenshot at 390px: no horizontal overflow, readable controls, and a clear unavailable-Google message.
- Windows sandbox restrictions initially blocked generated build files and browser-process cleanup; the final build and browser suite completed successfully with approved execution outside that restriction. No source files were deleted; a generated-build backup remains in the parent workspace.
- Remote Emma HEAD confirmed as bbb88c98237c2906f5bb315d221492b70902ff20.
- Imported only login UI and cookie/PKCE authentication code; retained Member 4's API/RLS integration.
- React review: form labels, disabled/loading states, effect subscription cleanup, signup preservation, and parallel server reads.
- Public Supabase Auth settings returned HTTP 200, email enabled and Google disabled. Google sign-in is therefore not end-to-end verified and its button explains the unavailable provider.
- Connected Vercel account lists only team YH and no projects. Emma's mantouops-projects preview was not changed.
- See AUTH-INTEGRATION.md for remaining setup and the distinction between browser smoke tests and a successful live two-account flow.
