# Emma preview deployment

## Login update awaiting publication — 2026-10-14

The login implementation is committed locally on `Emma` at `91383a5bddc85ebc681f28c94f1e6e889a0e8ad8`. It has **not** been pushed or deployed. The existing preview below still contains the earlier marketplace version.

Publishing from the Codex Windows sandbox was blocked: Git's credential helper could not start (`NtCreateDirectoryObject` access denied), and Vercel CLI could not update its existing `auth.json` despite filesystem permission grants. The Vercel connector also returned HTTP 403 for the intended `mantouops-projects` scope. No replacement deployment was created.

From a normal PowerShell terminal in this repository, run `git push origin Emma`, then follow the redeployment commands below. The local `publish-emma.ps1` helper beside this repository performs both actions, verifies the branch and origin first, and stops if the push fails. Google and email sign-in remain disabled until Member 4 completes `AUTH-SETUP.md`.

## Existing marketplace preview

The `Emma` branch is pushed to `joepro0118-create/team-odyssey-sdp`. Member 3's marketplace preview is live at:

https://tolong-emma-preview-9f874dn48-mantouops-projects.vercel.app

- Project: `tolong-emma-preview` (`prj_F5BxqdDB8yZWYtMbP4nl2XUdrckQ`)
- Workspace: `mantouops-projects` (`team_K9oYRHWy1r8eIGZAZi3yauiY`)
- Deployment: `dpl_7tsfcz5LDHRH9qjTzQtQSLrQKjry`, target **Preview**, status **Ready**
- Source at deployment: local `Emma` commit `9ced9d0e3ec1486e4470419e199b030e3f1bcf19`

The preview is protected by Vercel Authentication. Team members with project access can sign in to view it. To share it with someone outside the Vercel team, open this Preview deployment in the Vercel dashboard, select **Share**, and choose **Anyone with the link**. This creates a shareable link for this deployment without changing the project's protection settings.

The app is an interactive **per-tab simulation with fictional data**. Switching demo residents exercises posting and acceptance within that tab. Refreshing resets its state. Supabase is needed for shared listings across phones; see `MEMBER-4-HANDOFF.md`.

## Redeploy from a normal PowerShell window

This project was deployed from a local checkout. A Git push alone does not currently create a Vercel deployment. With the Vercel CLI signed in to an account that can access `mantouops-projects`, run from this repository directory:

```powershell
vercel link --yes --team team_K9oYRHWy1r8eIGZAZi3yauiY --project prj_F5BxqdDB8yZWYtMbP4nl2XUdrckQ
vercel project inspect tolong-emma-preview --non-interactive --scope team_K9oYRHWy1r8eIGZAZi3yauiY --yes
vercel deploy --scope team_K9oYRHWy1r8eIGZAZi3yauiY --yes
```

Check that `.vercel/project.json` identifies the project and workspace above before deploying. Use plain `vercel deploy` for a **Preview** target. The `deploy-emma.ps1` script beside the local repository automates these checks.

## Hosted verification

- Vercel completed the Next.js build and TypeScript check and reports the deployment **Ready** with target **Preview**.
- An authenticated `vercel curl` request to `/` returned HTTP 200 and the HTML contained the persistent “Interactive preview · this tab only” notice.
- `/api/listings` returned HTTP 503 with the expected browser-preview explanation; the server memory API is deliberately unavailable on Vercel.
- Browser interaction and physical-phone checks remain outstanding. See `VERIFICATION.md`.
