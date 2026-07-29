# Deploy on release — design

## Purpose

On every published GitHub release, automatically build and deploy the app to the
dedicated production server, so releases don't require a manual SSH session.

## Trigger

`.github/workflows/deploy.yml`, triggered on `release: types: [published]`. Fires
for both full releases and pre-releases (not for draft releases, which GitHub
never fires `published` for).

## Job structure

Single job `deploy` on `ubuntu-latest`, two stages:

1. **Validation gate** (on the runner): `actions/checkout`, `pnpm install`,
   `pnpm lint`, `pnpm test`. If either fails, the job stops and the SSH deploy
   step never runs — a release with failing lint/tests never reaches the
   server. The runner does not build the app; `pnpm build` only happens on the
   server (step 2).
2. **SSH deploy** (via `appleboy/ssh-action`): connects to the server and runs
   the deploy script below.

## Secrets used

Pre-existing GitHub Actions secrets (already configured by the user, not
created by this change):

- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY` — private key, PEM content
- `SSH_DIR` — absolute path to the app's working copy on the server

## Deploy script (runs on the server over SSH)

```bash
set -e
cd "$SSH_DIR"
git fetch --tags --force
git checkout "$RELEASE_TAG"
git reset --hard "$RELEASE_TAG"
corepack enable
pnpm install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
pnpm build
pm2 describe qrframe > /dev/null 2>&1 && pm2 restart qrframe --update-env || pm2 start pnpm --name qrframe -- start
pm2 save
```

- `RELEASE_TAG` is passed through from `github.event.release.tag_name`, so the
  server always checks out the exact tag the release was published from
  rather than a moving branch.
- `.env` on the server is untracked (gitignored) and holds the real
  `DATABASE_URL` / Clerk keys per the project's existing setup; `git reset
  --hard` does not touch untracked files, so it survives every deploy.
- `npx prisma migrate deploy` applies any pending migrations as part of every
  deploy, per project decision.
- The PM2 process is named `qrframe` (matches `package.json#name`). The
  `pm2 describe ... || pm2 start ...` line means the first-ever deploy creates
  the process automatically; every subsequent deploy just reloads it. There is
  no existing PM2 setup on the server today — this workflow is what creates it.
- `pm2 save` persists the process list so it survives a server reboot (assumes
  PM2's startup hook, if desired, is configured separately by the user;
  out of scope here).

## Error handling

- Runner-side lint/test failures block the SSH step entirely (job fails before
  reaching deploy).
- The SSH script uses `set -e`, so any failing step on the server (git,
  install, prisma, build) aborts the script before `pm2 restart`/`pm2 start`
  runs — an old, still-running process is never torn down by a failed deploy.
- No automatic rollback is implemented (out of scope); a failed deploy leaves
  the previous release running under PM2 untouched, and the fix is to publish
  a corrected release.
- `npx prisma migrate deploy` runs before `pnpm build` in the script, so a
  build failure after a successful migration can leave the database already
  migrated to the new schema while the old code (still running under PM2) is
  what's actually serving traffic. Migrations in this project should stay
  additive/backward-compatible for this reason, so the previous release's
  code keeps working against a newer schema until the build is fixed and
  redeployed.

## Out of scope

- Creating or naming the GitHub secrets (already exist).
- Configuring PM2's OS-level startup/boot persistence.
- Rollback automation.
- Notifications (Slack/email) on deploy success/failure.
