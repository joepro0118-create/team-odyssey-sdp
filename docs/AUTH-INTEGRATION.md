# Emma login + Member 4 Supabase integration

Implemented on `frontend-supabase-integration` on 2026-10-14.
Emma source: `bbb88c98237c2906f5bb315d221492b70902ff20`.
Previous working integration checkpoint: `96e16e0`.

## What was combined

- Emma's responsive login design, Google PKCE callback, and cookie refresh proxy.
- Existing email/password login and fictional account signup.
- One shared cookie-backed Supabase browser client for login and authenticated API calls.
- Server-verified home access and account page; API routes still verify bearer tokens and use the resident's RLS context.
- Existing real listings, acceptance, QR confirmation, points and rewards code retained. Emma's per-tab demo backend and identity selector were not imported.

This is a selective integration, not a direct Git merge: the branches have unrelated histories.
Do not overwrite the integrated backend with Emma's older demo routes.
No new database migration is required for this authentication change.

## Local testing

Run `npm ci`, then `npm run dev` and open http://localhost:3000/login.
Sign in again after this update: older localStorage-only sessions are not copied into the new cookie session.
Existing Supabase accounts and passwords still apply.

1. Sign in with the fictional requester; reload and confirm the same resident remains active.
2. Open Account and verify the private account email; return to the neighbourhood.
3. Sign out and check that opening / returns to /login.
4. In a separate browser, repeat with the fictional helper.
5. Post → accept → generate QR → requester scans → points → reward redemption.

Automated checks:

```sh
npm test
npm run build
npm run typecheck
npm run test:e2e
```

The browser suite runs its own production server on port 3100; set E2E_PORT to override.
On Windows with Chrome installed, set PLAYWRIGHT_CHANNEL=chrome.
Without installed browsers, run `npx playwright install chromium`.
The live two-account tests remain skipped until E2E_RESIDENT_A_EMAIL/PASSWORD,
E2E_RESIDENT_B_EMAIL/PASSWORD and the two public Supabase variables are set in the test process.
Keep credentials local and out of Git. The invalid-login browser test mocks Auth and creates no real account.

## Google setup still required

The Tolong project's public Auth settings returned Google=false and email=true on 2026-10-14.
The app discovers this setting server-side and disables Google with an explanation until enabled.

The account owner must configure a Google OAuth Web application and put its client ID/secret
in Supabase Authentication → Sign In / Providers → Google. Do not put the Google secret in Next.js or Git.

- Google authorized redirect URI: https://zzcrlzmauovsjkpdmupm.supabase.co/auth/v1/callback
- Supabase allowed app redirect: http://localhost:3000/auth/callback
- Also allow the exact deployed app origin followed by /auth/callback.
- If using 127.0.0.1 locally, allow that exact origin too; do not switch hosts midway through login.
- Use a designated test Google account with fictional profile details. Authentication does not verify township membership.

See [Supabase SSR client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Deployment handoff

Emma's tutorial identifies Vercel project tolong-emma-preview under mantouops-projects.
The connected account available during this integration exposes team YH (yh-d5f7), with no projects;
Emma's project is not accessible there. Her preview has not been overwritten.
Deploy this combined branch only after gaining access to the intended team/project.
Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the deployment,
keep demo mode off, and register its callback above. Never deploy a service-role key.

## Still not verified

Successful real email login/session refresh/signout, Google consent/callback, and the full live two-phone
completion/points/rewards loop need interactive test accounts and a deployed URL.
Browser smoke checks or unit tests alone do not prove these flows.
The existing offer/lend points semantics still need team agreement; this auth integration does not change them.
