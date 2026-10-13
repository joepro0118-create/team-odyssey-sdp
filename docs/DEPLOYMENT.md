# Emma preview deployment

The local branch is `Emma`. The preview build and nine automated domain/preview tests pass.

Vercel project creation succeeded:

- Project: `tolong-emma-preview`
- Project ID: `prj_F5BxqdDB8yZWYtMbP4nl2XUdrckQ`
- Workspace: `mantouops-projects`
- Workspace ID: `team_K9oYRHWy1r8eIGZAZi3yauiY`
- Intended environment: **preview**

**No deployment has succeeded yet.** The Vercel connector returned 403 for this workspace. The CLI fallback was unable to refresh its local `auth.json` under the Windows agent sandbox, including after filesystem permission grants. Do not treat the created project as a live website.

## Deploy from a normal PowerShell window

Run `vercel login` if you need to authenticate. Use an account with access to `mantouops-projects`.

From this repository directory:

```powershell
vercel link --yes --team team_K9oYRHWy1r8eIGZAZi3yauiY --project prj_F5BxqdDB8yZWYtMbP4nl2XUdrckQ
vercel project inspect --non-interactive --scope team_K9oYRHWy1r8eIGZAZi3yauiY
vercel deploy --scope team_K9oYRHWy1r8eIGZAZi3yauiY --target preview --yes
```

Check that each command succeeds before running the next. The companion `deploy-emma.ps1` in the parent outputs folder automates these steps and checks the linked project/workspace before uploading.

On Vercel the interface uses a clearly labelled per-tab simulation; refreshing resets the demo. Shared data across phones remains Member 4's Supabase integration. Vercel's default deployment protection has been preserved.

## Push the requested GitHub branch

The GitHub connector still returns `403 Resource not accessible by integration` for `joepro0118-create/team-odyssey-sdp`. No remote branch was created.

After authenticating Git with an account allowed to push to the team repository, run from this repository directory:

```powershell
git push --set-upstream origin Emma
```

This pushes the `Emma` branch without force-pushing or merging into another branch. The repository remote remains `https://github.com/joepro0118-create/team-odyssey-sdp.git`.
