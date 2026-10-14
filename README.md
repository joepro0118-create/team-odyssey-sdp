# Tolong · Team Odyssey

A mobile-friendly neighbourhood-help prototype for the SDP University Hackathon 2026. This contribution implements **Member 3's marketplace feed, listing templates, request/offer/lending creation, and acceptance flow**.

All residents, places, and listings are fictional. The marketplace demo runs without keys or external accounts. Optional account sign-in is prepared for Supabase.

## Sign-in page

Open `/login` or choose **Sign in** in the marketplace header. The page includes Google OAuth, email/password sign-in for existing accounts, a password visibility toggle, and sign-out for authenticated accounts.

Per Member 3's request, authentication is **ready for Member 4 to connect**. Without Supabase configuration, the form and Google button are disabled and visitors can explore the demo. No fake login is performed. See [`docs/AUTH-SETUP.md`](docs/AUTH-SETUP.md). Signing in does not replace the demo resident selector or connect the listing backend.

## Run locally

Use Node.js 22 or 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Webpack is selected explicitly to support this Windows workspace. On a trusted local network, phones can use `http://<your-computer-LAN-IP>:3000` while the server runs. Your computer's firewall may need to allow Node.js.

## Try Member 3's flow

1. As **Resident A · demo**, choose **Post to your neighbourhood**.
2. Choose **Ask for help**, **Offer help**, or **Lend an item**. Optionally use a template.
3. Enter fictional details, review the public card, and post.
4. In another browser or phone, switch the demo selector to **Resident B · demo**. Find the new listing and accept it.
5. Both participants see fictional meeting details. A third resident sees that the listing is accepted, but receives no contact details.
6. Use **My activity** to revisit your listings and accepted connections. The feed refreshes every six seconds and on window focus.

Use separate browser contexts/devices for independent residents; tabs in one browser share the demo cookie. You can also switch residents sequentially in one tab.

## What's included

- Responsive anonymous feed with type/category filters, search, empty/loading/error states, and accepted-listing visibility.
- Six editable templates across requests, offers, and lending.
- Review-before-posting form with server validation.
- Confirmation before acceptance, self-acceptance prevention, and conflict handling.
- Server-selected identity from an HttpOnly **demo** cookie; request bodies cannot set owner or status.
- Private detail responses for accepted participants only; public responses omit owner IDs and contacts.
- My activity for listings you created or accepted.
- Native modal focus containment, Escape dismissal, labelled controls, reduced-motion support, and mobile navigation.
- Domain tests, browser/API tests, and GitHub Actions checks.

## Demo limitations — read before deploying

### Vercel preview (`Emma` branch)

The existing, Vercel-protected marketplace Preview deployment is at https://tolong-emma-preview-9f874dn48-mantouops-projects.vercel.app. The login update is committed locally and awaits push/deployment because of the current environment's credential-access failures. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for access and redeployment details.

On Vercel, the app automatically uses **browser preview mode**. Each tab has its own fictional marketplace; switch the resident selector within that tab to try posting and acceptance. Reloading resets all preview activity. It does not sync between phones or tabs. A persistent notice explains these limits. The server's memory API is disabled in this mode with a `503` response, so the preview does not pretend to have shared storage or real authentication.

This mode deliberately simulates state and contact visibility in the browser, with fake data only. Keep the server API as the integration target for Member 4. Browser preview mode is not a security boundary and must never handle real resident data.

To run the same preview locally in PowerShell:

```powershell
$env:NEXT_PUBLIC_DEMO_MODE = 'browser'
npm run dev
```

Leave `NEXT_PUBLIC_DEMO_MODE` unset for the original local server demo. After setting up durable storage and real authentication, Member 4 can explicitly set the deployment mode to `server` and replace the demo adapter. Do not use the in-memory adapter for a shared Vercel deployment.

### Local server demo

**This is a single-process demo backend, not Supabase or production authentication.** Data lives in server memory and resets on restart. The visible selector deliberately allows anyone to become a fictional resident. Do not enter real information. The input guardrails catch common prescription terms, contact details, and payment wording; they are not a complete moderation or privacy system.

Run one Node.js process for shared demo state. Do not rely on this store across Vercel/serverless functions, replicas, or multiple workers: they do not share memory. Member 4 must replace it with durable storage and genuine authentication before a live two-phone deployment can meet the project definition of done. The UI and API use only same-origin requests, so no frontend keys are needed now.

Accepting a listing does **not** confirm an exchange or award points. QR/short-code confirmation, points, rewards, resident verification, Supabase access policies, and the management dashboard belong to other team integrations. Chatbot, family proxy, and staff posting are deferred.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run typecheck
```

The browser suite starts the production server on port 3000 unless a server is already running. To use an installed Microsoft Edge browser in PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

CI uses Chromium. Test output and browser traces are ignored by Git. The important tested boundaries are browser → API → shared demo state → participant-only response.

## Team handoff

- `src/components/`: Member 3 UI components.
- `src/lib/types.ts`: shared listing contract, provisional categories/areas/templates.
- `src/lib/marketplace-service.ts`: validated domain operations and replaceable demo service.
- `src/lib/server/`: server-only store and HTTP/session helpers.
- `src/app/api/`: same-origin endpoints used by the UI.
- [Backend handoff](docs/MEMBER-4-HANDOFF.md): endpoint and integration contract.
- [Decisions](DECISIONS.md): confirmed choices and provisional demo defaults.

Tolong connects residents; it does not employ or insure them. The prototype has no payments, goods sales, or prescription medicine requests.
