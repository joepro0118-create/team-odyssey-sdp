# Verification record

## Login update — 2026-10-14

- `npm test`: all nine domain and browser-preview state tests passed.
- `npm run typecheck` and `npm run build`: passed, including the login page, OAuth callback, and session-refresh proxy.
- Playwright's HTTP checks passed for the unconfigured login page, disabled sign-in controls, and a callback that redirects safely to a local error page without creating a session. The existing marketplace API integration test also passed.
- The mobile/desktop login browser scenario could not run: Microsoft Edge closed during launch, with Windows temporary-profile/pipe errors. No login screenshots or interactive browser checks are claimed.
- Real Google consent, email authentication, session refresh, and sign-out require the Supabase configuration deferred to Member 4. These flows have not been verified against a live provider. See `AUTH-SETUP.md`.
- Signing in does not connect the marketplace data backend or verify residency. The fictional demo identities and listings remain separate from Supabase accounts.

## Emma preview update — 2026-10-13

- Nine automated domain/preview tests pass, including posting, switching fictional residents, acceptance, separate tab state, and reset behaviour.
- The production build in browser preview mode passes compilation, TypeScript checking, and route generation.
- Vercel preview mode is intentionally per-tab and disables the shared memory API; it is not a shared backend or an authentication system.
- GitHub's `Emma` branch exists remotely and matched the local deployment-source commit at the time of deployment.
- Vercel built the project and marked the Preview deployment Ready. An authenticated request returned HTTP 200 for `/`, including the preview notice, and HTTP 503 for the intentionally disabled server-memory listing API. See `DEPLOYMENT.md`.

Local checks performed on 2026-10-12/13 in Windows with Node.js 24.

## Passed

- Next.js production compilation and route generation with Webpack.
- TypeScript checking.
- Six domain tests: all listing types, server-owned identity/status, private participant details, self/duplicate acceptance, malformed input and demo content guardrails, missing listings and immutable responses.
- The production API integration test: creating a listing, refusing self-acceptance, two independent sessions competing to accept, one successful acceptance and one conflict, participant-only contact responses, public response privacy, invalid content, origin checks, malformed JSON, missing listing, and invalid demo identity.

## Not yet verified

- Three browser scenarios are implemented, but the local Microsoft Edge process closed during launch before the page could be exercised. The browser logs reported Windows sandbox access errors. The Chromium fallback download also hit an `EPERM` filesystem error. These are **not passing browser tests**.
- Visual screenshots and physical-phone testing have not been completed. The in-app browser could not reach the sandbox's local server.
- The live preview has not been exercised interactively in a browser or on a physical phone. It intentionally keeps state in one browser tab; a two-phone shared-data check requires Member 4's Supabase integration.
- GitHub Actions results have not been independently verified.

Run `npm test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`, and `npm run typecheck` from a normal development terminal. Browser tests start the production server and cover posting/accepting across residents, private contacts, mobile width and filters, keyboard dismissal, and feed error recovery.

This implementation is ready for team review with the above verification limits. It does not claim the project's complete live-demo definition of done.
