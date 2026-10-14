# Account sign-in handoff

Member 3 requested a login page with Google sign-in, ready for Member 4 to connect. The UI is at `/login`, linked from the marketplace header.

## What is implemented

- Google OAuth through Supabase Auth with PKCE.
- Email/password sign-in for existing, confirmed accounts.
- Loading/error states, password visibility, verified account display, and sign-out from the current browser.
- Browser and server Supabase clients; Next.js 16 Proxy refreshes session cookies on `/` and `/login`.
- `/auth/callback` exchanges the authorization code for a session and preserves the response cookies. Its success destination is fixed at `/`; cancellation/failure goes to `/login`. Arbitrary redirect destinations are ignored.
- Account responses use private/no-store caching. Server-rendered identity comes from `getUser()`, not unverified cookie contents.
- Missing settings or an invalid project URL disable all sign-in controls. **Explore the demo** remains available.

## Connect Supabase and Google

1. Use the team's existing Supabase project.
2. Add these settings to `.env.local` for local work and to the Vercel project's **Preview** environment:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
   ```

   A legacy public anon key also works in the second variable. Never use a service-role key, Supabase secret key, or Google client secret in a `NEXT_PUBLIC_` variable.

3. Configure a Google OAuth web application in Google Cloud. Add the authorized redirect URI shown by Supabase, normally `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. Enable Google under Supabase **Authentication → Sign In / Providers → Google**, then store the Google client ID and client secret there. Configure consent-screen test users while the Google application is in testing mode.
5. In Supabase **Authentication → URL Configuration**, set the app Site URL and allow:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_DEPLOYMENT_HOST/auth/callback`

   Use the actual Preview hostname or a stable branch alias. Each new immutable Preview hostname needs a matching allowed return URL. The app builds the callback from its current browser origin.

6. Rebuild/redeploy after changing public environment variables and test Google sign-in from the browser. Vercel deployment protection may require the tester to sign in to Vercel first.

Google's secret stays in Supabase; this repository does not need it. Email sign-in assumes an existing account. Email registration and password recovery screens are outside this change.

## Connect marketplace identity separately

Enabling these settings creates real account sessions, but the marketplace still uses fictional demo residents and demo data adapters. Account sign-in is not resident verification. The account email only appears on the signed-in user's own account page.

Member 4 must replace demo identity selection, verify the Supabase user in protected backend operations, and apply the agreed database policies. Do not map a Google session to a demo resident ID. Keep browser demo mode on Vercel until the durable backend is ready.

The `supabase-backend` branch's frontend/backend contract was consulted. No migrations were applied by this change.

## Verify after configuration

Test Google consent, callback success, cancellation, and expired/reused codes. Test an existing email account, incorrect password, sign-out, and reload after sign-out. Confirm account details do not appear in public listing responses.

Provider-dependent checks require the team's Supabase and Google configuration. The disabled setup state and safe callback failure can be tested without credentials.

References: [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google).
