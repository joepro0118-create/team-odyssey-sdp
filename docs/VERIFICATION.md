# Verification record

## Emma preview update — 2026-10-13

- Nine automated domain/preview tests pass, including posting, switching fictional residents, acceptance, separate tab state, and reset behaviour.
- The production build in browser preview mode passes compilation, TypeScript checking, and route generation.
- Vercel preview mode is intentionally per-tab and disables the shared memory API; it is not a shared backend or an authentication system.
- GitHub write access was retried for the requested `Emma` branch and still returned `403 Resource not accessible by integration`. The branch exists locally.
- Hosted browser verification is pending deployment. Vercel project creation succeeded, but the deployment request returned a workspace-access 403 and the CLI fallback could not refresh its login under the Windows sandbox. See `DEPLOYMENT.md`. The earlier local browser limitations below still apply.

Local checks performed on 2026-10-12/13 in Windows with Node.js 24.

## Passed

- Next.js production compilation and route generation with Webpack.
- TypeScript checking.
- Six domain tests: all listing types, server-owned identity/status, private participant details, self/duplicate acceptance, malformed input and demo content guardrails, missing listings and immutable responses.
- The production API integration test: creating a listing, refusing self-acceptance, two independent sessions competing to accept, one successful acceptance and one conflict, participant-only contact responses, public response privacy, invalid content, origin checks, malformed JSON, missing listing, and invalid demo identity.

## Not yet verified

- Three browser scenarios are implemented, but the local Microsoft Edge process closed during launch before the page could be exercised. The browser logs reported Windows sandbox access errors. The Chromium fallback download also hit an `EPERM` filesystem error. These are **not passing browser tests**.
- Visual screenshots and physical-phone testing have not been completed. The in-app browser could not reach the sandbox's local server.
- No live deployment or two-phone live-link check has been performed. The current memory store is unsuitable for multiple serverless instances.
- GitHub Actions has not run because the GitHub connection rejected repository writes with `403 Resource not accessible by integration`.

Run `npm test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`, and `npm run typecheck` from a normal development terminal. Browser tests start the production server and cover posting/accepting across residents, private contacts, mobile width and filters, keyboard dismissal, and feed error recovery.

This implementation is ready for team review with the above verification limits. It does not claim the project's complete live-demo definition of done.
