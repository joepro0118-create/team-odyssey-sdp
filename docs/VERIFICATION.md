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

1. Configure the public Supabase URL and publishable key locally and in Vercel.
2. Create two fictional demo accounts; rerun `docs/supabase/seed.sql` afterward if the two optional sample listings are wanted.
3. Run the E2E suite with `E2E_RESIDENT_A_EMAIL`, `E2E_RESIDENT_A_PASSWORD`, `E2E_RESIDENT_B_EMAIL`, and `E2E_RESIDENT_B_PASSWORD` set.
4. Test post → accept → QR completion → points → reward redemption on two physical phones and the deployed link.

The E2E suite skips when its live Supabase configuration is absent; it never contains or invents credentials.
