# Deploy on Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that, on every published GitHub release, validates the code and then deploys it to the dedicated production server over SSH.

**Architecture:** A single workflow file (`.github/workflows/deploy.yml`) with one job (`deploy`) triggered by `release: types: [published]`. The job runs two stages in sequence: a runner-side validation gate (checkout, install, lint, test) and then an SSH step (`appleboy/ssh-action`) that logs into the server, checks out the released tag, rebuilds, runs migrations, and reloads the PM2 process.

**Tech Stack:** GitHub Actions, `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `appleboy/ssh-action@v1`, pnpm, Prisma 6, PM2 (on the server).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-30-deploy-on-release-design.md`
- Trigger: `release: types: [published]` only (fires for releases and pre-releases, not drafts) — no `workflow_dispatch`, no branch/push triggers.
- Runner-side gate (`pnpm install`, `pnpm lint`, `pnpm test`) must fail the job before the SSH step runs if lint or tests fail. The runner never runs `pnpm build`.
- Secrets already exist in the repo and must be referenced exactly as: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_DIR`. Do not create or rename secrets.
- The server-side script must be exactly the one in the spec (see Task 2), using `RELEASE_TAG` sourced from `github.event.release.tag_name`.
- PM2 process name is `qrframe`.
- Out of scope: rollback automation, deploy notifications, PM2 boot/startup persistence beyond `pm2 save`, creating the secrets themselves.
- Node version: 22, pnpm version: 11.17.0 (matches `claude.yml`'s toolchain — pnpm 11.17.0 requires Node >= 22.13 at runtime, since it uses the built-in `node:sqlite` module; running it under Node 20 crashes with `ERR_UNKNOWN_BUILTIN_MODULE`). Task 1's original code block below and its original "Node 20 / pnpm 9" values were superseded first by the final-review fix wave (pnpm bumped to 11.17.0 to match the rest of the project) and then by a post-merge production incident (Node bumped to 22 — the two must move together, since that's exactly the version pnpm 11.17.0 requires).

---

## File Structure

- Create: `.github/workflows/deploy.yml` — the only file this plan touches. One job, built up across the two tasks below: Task 1 adds the trigger and the validation gate steps; Task 2 appends the SSH deploy step.

---

### Task 1: Validation gate

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a `deploy` job in `.github/workflows/deploy.yml` with steps `Checkout`, `Setup pnpm`, `Setup Node`, `Install dependencies`, `Lint`, `Test`, running on `ubuntu-latest`, triggered by `release: types: [published]`. Task 2 appends one more step to this same job after `Test`.

- [ ] **Step 1: Write the workflow file with the trigger and validation gate**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy on release

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test
```

- [ ] **Step 2: Validate the YAML parses correctly**

Run: `npx -y js-yaml .github/workflows/deploy.yml`

Expected: prints the parsed structure (a JS object dump starting with `{ name: 'Deploy on release', ... }`) and exits 0 — no YAML syntax error.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add validation gate for deploy-on-release workflow"
```

---

### Task 2: SSH deploy step

**Files:**
- Modify: `.github/workflows/deploy.yml` (append one step after `Test`)

**Interfaces:**
- Consumes: the `deploy` job produced in Task 1 — appends its step directly after the `Test` step, inside the same job, same file.
- Produces: the completed workflow — no further tasks depend on this one.

- [ ] **Step 1: Append the SSH deploy step**

Add this step at the end of the `steps:` list in `.github/workflows/deploy.yml` (after `Test`, keeping the same indentation level as the other steps):

```yaml
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          envs: RELEASE_TAG,SSH_DIR
          script: |
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
        env:
          RELEASE_TAG: ${{ github.event.release.tag_name }}
          SSH_DIR: ${{ secrets.SSH_DIR }}
```

Note: `envs:` is the only mechanism `appleboy/ssh-action` uses to forward variables into the remote shell — a step-level `env:` entry by itself stays local to the wrapper action and never reaches the remote script. That's why both `RELEASE_TAG` and `SSH_DIR` are named in the comma-separated `envs:` list above, in addition to being set under `env:`. Both must end up set in the remote shell for `cd "$SSH_DIR"` and `git checkout "$RELEASE_TAG"` to work.

- [ ] **Step 2: Syntax-check the embedded shell script in isolation**

The script itself can't run yet (no live server in this environment), but its bash syntax can be checked without executing it. Extract the script block into a temp file and run `bash -n` (parse-only, no execution):

```bash
cat > /tmp/deploy-script-check.sh <<'EOF'
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
EOF
bash -n /tmp/deploy-script-check.sh
```

Expected: no output, exit code 0 (confirms no bash syntax errors — unbalanced quotes, bad redirects, etc.).

- [ ] **Step 3: Validate the full YAML still parses**

Run: `npx -y js-yaml .github/workflows/deploy.yml`

Expected: prints the parsed structure including the new `Deploy to server` step, exits 0.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add SSH deploy step to deploy-on-release workflow"
```

---

### Task 3: Pin actions to commit SHAs

Added after the initial two tasks: an automated security review flagged that
`.github/workflows/deploy.yml` references third-party actions by mutable
version tag (`@v4`, `@v1`) rather than an immutable commit SHA. This matters
most for `appleboy/ssh-action`, which receives the `SSH_KEY` secret — if the
`v1` tag were ever repointed upstream (compromised maintainer account, e.g.),
the workflow would silently pull the new code on the next run. The user
explicitly asked to pin all four actions in this file to SHAs, overriding the
original design's choice to match the repo's existing tag-based convention
(see the design spec's "Out of scope" section, which this supersedes for
this file only — `claude.yml`/`claude-code-review.yml` are unaffected).

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the completed workflow from Tasks 1-2 (six gate steps + one SSH
  deploy step, all present and passing review).
- Produces: the same workflow with `uses:` lines pinned to SHAs. No task
  depends on this one.

Exact SHAs to use, resolved from each action's current major-version tag
(fetched via `gh api repos/<owner>/<repo>/commits/<tag>`, checked against
each SHA's own tags to confirm the version comment):

| Action | Tag | Resolved SHA | Version comment |
|---|---|---|---|
| `actions/checkout` | `v4` | `11d5960a326750d5838078e36cf38b85af677262` | `v4.4.0` |
| `pnpm/action-setup` | `v4` | `b906affcce14559ad1aafd4ab0e942779e9f58b1` | `v4.3.0` |
| `actions/setup-node` | `v4` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | `v4.4.0` |
| `appleboy/ssh-action` | `v1` | `0ff4204d59e8e51228ff73bce53f80d53301dee2` | `v1.2.5` |

- [ ] **Step 1: Replace each `uses:` tag reference with its pinned SHA plus a version comment**

In `.github/workflows/deploy.yml`, change each of these four lines (keep everything else on the line/step identical — same `with:`/`env:` blocks, same indentation):

```yaml
        uses: actions/checkout@v4
```
becomes
```yaml
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
```

```yaml
        uses: pnpm/action-setup@v4
```
becomes
```yaml
        uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1 # v4.3.0
```

```yaml
        uses: actions/setup-node@v4
```
becomes
```yaml
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
```

```yaml
        uses: appleboy/ssh-action@v1
```
becomes
```yaml
        uses: appleboy/ssh-action@0ff4204d59e8e51228ff73bce53f80d53301dee2 # v1.2.5
```

- [ ] **Step 2: Validate the full YAML still parses**

Run: `npx -y js-yaml .github/workflows/deploy.yml`

Expected: prints the parsed structure with all four `uses:` values now showing the pinned SHAs, exits 0.

- [ ] **Step 3: Confirm no tag references remain**

Run: `grep -n "uses:.*@v[0-9]" .github/workflows/deploy.yml`

Expected: no output (empty match) — every `uses:` line now references a 40-character SHA, not a short version tag.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Pin GitHub Actions to commit SHAs in deploy workflow"
```

---

### Task 4: Post-incident fixes (Node/pnpm mismatch, missing bootstrap clone)

Added after this plan's original three tasks were merged and a real release
was published against production. Two separate failures surfaced, in order:

**4a. Node/pnpm version mismatch.** The final-review fix wave (see Task 3's
surrounding history) bumped `pnpm/action-setup`'s `version:` from `9` to
`11.17.0` to match the rest of the project's toolchain, but didn't bump
`actions/setup-node`'s `node-version:` to match. pnpm 11.17.0 uses the
built-in `node:sqlite` module at runtime, which requires Node >= 22.13;
under Node 20 the gate crashed with `Error [ERR_UNKNOWN_BUILTIN_MODULE]:
No such built-in module: node:sqlite`. Fixed by changing `node-version:
"20"` to `node-version: "22"` in `.github/workflows/deploy.yml`'s `Setup
Node` step, matching `claude.yml`'s already-working Node 22 / pnpm 11.17.0
pairing. (This plan's Global Constraints section above has been updated in
place to reflect the corrected values, rather than adding a redundant
statement here.)

**4b. Missing bootstrap (first attempt: `git clone`, then corrected to `git init`).**
Once the Node/pnpm fix let the gate and the SSH step actually run, the very
first real deploy failed with `fatal: not a git repository (or any of the
parent directories): .git`. The deploy script assumed `$SSH_DIR` was already
an existing git working copy (per the spec's description of that secret:
"path to the app's working copy on the server") — nobody had cloned the repo
there yet, since this was the first deploy ever.

The first fix attempt added a `git clone` bootstrap, which itself failed on
the very next retry: `fatal: destination path '.../public_html' already
exists and is not an empty directory.` — `$SSH_DIR` here is a shared-hosting
`public_html`-style path that the hosting panel provisions with its own
default content before any deploy ever runs, so it's never actually an
empty directory to clone into. Corrected to `git init` + `git remote add`
instead, which adopts an existing (non-empty, non-git) directory in place
rather than requiring it to be empty:

```yaml
          envs: RELEASE_TAG,SSH_DIR,REPO_URL
          command_timeout: 30m
          script: |
            set -e
            if [ ! -d "$SSH_DIR/.git" ]; then
              mkdir -p "$SSH_DIR"
              git init "$SSH_DIR"
              git -C "$SSH_DIR" remote add origin "$REPO_URL"
            fi
            cd "$SSH_DIR"
            git fetch --tags --force
            git checkout -f "$RELEASE_TAG"
            git reset --hard "$RELEASE_TAG"
            corepack enable
            pnpm install --frozen-lockfile
            npx prisma generate
            npx prisma migrate deploy
            pnpm build
            pm2 describe qrframe > /dev/null 2>&1 && pm2 restart qrframe --update-env || pm2 start pnpm --name qrframe -- start
            pm2 save
        env:
          RELEASE_TAG: ${{ github.event.release.tag_name }}
          SSH_DIR: ${{ secrets.SSH_DIR }}
          REPO_URL: https://github.com/${{ github.repository }}.git
```

`REPO_URL` is derived from `github.repository` (owner/repo) rather than
hardcoded, so it stays correct if the repo is ever renamed or transferred.
This relies on the repo being public (an anonymous HTTPS fetch) — if it were
ever made private, the server would need its own GitHub credentials (a
deploy key or PAT), which is out of scope here since the repo is public
today. `git init`/`remote add` only run once, guarded by the same `$SSH_DIR/
.git` check as before; every later deploy skips straight to `git fetch`.
Known limitation, accepted rather than fixed: any pre-existing untracked
files in `$SSH_DIR` (the hosting panel's default `public_html` contents,
stray files from a previous manual setup) are left alone forever — `checkout
-f`/`reset --hard` only touch tracked files, and this script deliberately
never runs a destructive `git clean`, since that would also delete the
untracked `.env` this project's design depends on surviving every deploy.

**4c. `corepack: command not found` on the server.** The very next deploy
attempt (after 4b's fix) got past the git bootstrap and failed on the next
line: `bash: line 14: corepack: command not found`. The server's own Node
installation doesn't ship `corepack` (common on shared-hosting "Node.js
selector" setups, and Corepack has also been made opt-in / unbundled in
newer Node releases) — the script had assumed it, same as the standard
`corepack enable` idiom used in Task 2's original spec. Fixed by making that
line resilient to either case: use `corepack` if it's on `PATH`, otherwise
fall back to installing the exact pinned pnpm version via `npm` directly
(which ships with every Node install, unlike `corepack`):

```yaml
            command -v corepack >/dev/null 2>&1 && corepack enable || npm install -g pnpm@11.17.0
            pnpm install --frozen-lockfile
```

The version (`11.17.0`) is hardcoded here to match the gate's
`pnpm/action-setup` version (see 4a) — if that version is ever bumped again,
this line needs a matching update, since there's no `packageManager` field
in `package.json` for either path to read from automatically.

**4d. `npm install -g` failed with `EACCES` on the server.** 4c's fallback
line ran (`corepack` was indeed absent — confirmed via `ssh <user>@<host>
'node -v; corepack --version; pnpm -v; pm2 -v'`, which also showed Node
v25.8.2 and `pm2` 6.0.14 already present), but `npm install -g
pnpm@11.17.0` itself failed:
```
npm error code EACCES
npm error path /usr/lib/node_modules/pnpm
```
The server's Node is a system-wide install (package-manager-provisioned,
Node under `/usr/lib/node_modules`), not a user-owned one (e.g. nvm), so the
deploy's SSH user has no write access to npm's default global-install
location. Fixed by installing pnpm to a directory inside the deploy user's
own home directory instead, via npm's `--prefix` flag, and adding that
directory to `PATH` for the rest of the script (which also covers the later
`pm2 start pnpm ...` line, since it runs in the same shell):

```yaml
            if command -v corepack >/dev/null 2>&1; then
              corepack enable
            elif ! command -v pnpm >/dev/null 2>&1; then
              npm install -g pnpm@11.17.0 --prefix "$HOME/.local"
            fi
            export PATH="$HOME/.local/bin:$PATH"
            pnpm install --frozen-lockfile
```

`export PATH=...` runs unconditionally (not only inside the `elif` branch)
so that a pnpm installed by a *previous* deploy run is still found even on
runs where the `elif` doesn't re-install it (`command -v pnpm` already
succeeds by then). This assumes `pm2 start pnpm ...` resolves and stores an
absolute path for `pnpm` at that point (which PM2 does, since the process
list is dumped via `pm2 save` for `pm2 resurrect`/reboot) — later PM2
restarts don't need `$HOME/.local/bin` back on `PATH` on their own.

**4e. Superseded before ever being deployed: dropped `npm install`
entirely, in favor of `npx`.** 4d's user-prefixed install was committed but
never actually re-tested against the server — reviewing it, the user
rejected the whole direction ("you're again trying to install pnpm
globally"): even a user-prefixed `npm install -g` is still fundamentally
"provision a standing pnpm install somewhere and hope the location is
writable and stays on `PATH`," which is exactly the class of problem that
produced 4c's and 4d's failures in the first place. Replaced entirely with
invoking pnpm through `npx`, which ships with every Node/npm install
(unlike `pnpm` itself) and caches downloaded packages under the invoking
user's own home directory (`~/.npm/_npx`) regardless of whether Node itself
is a system-wide or user-owned install — there is no install step, no
prefix to choose, and no `PATH` export needed:

```yaml
            npx --yes pnpm@11.17.0 install --frozen-lockfile
            npx prisma generate
            npx prisma migrate deploy
            npx --yes pnpm@11.17.0 build
            pm2 describe qrframe > /dev/null 2>&1 && pm2 restart qrframe --update-env || pm2 start npx --name qrframe -- --yes pnpm@11.17.0 start
            pm2 save
```

The PM2-managed process itself now runs `npx --yes pnpm@11.17.0 start`
rather than a bare `pnpm start`, so it never depends on `pnpm` being
resolvable as a standalone command at all — on the server, at PM2's next
resurrect/reboot, or anywhere else. The pinned version (`11.17.0`) still has
to be kept in sync by hand with the gate's `pnpm/action-setup` version (same
caveat as 4c/4d), now in three places instead of one — the tradeoff accepted
for never touching a system/global install location again. 4c's and 4d's
`corepack`/`npm install -g` blocks are fully removed, not layered underneath
this.

- [ ] **Step 1: Apply the final `.github/workflows/deploy.yml`** as shown above (4a's `node-version: "22"`, 4b's `git init`/`remote add` bootstrap block with `REPO_URL` in both `envs:` and `env:`, 4e's all-`npx` invocation replacing 4c/4d entirely).
- [ ] **Step 2: Validate**: `pnpm dlx js-yaml .github/workflows/deploy.yml` parses cleanly; `bash -n` on the script (extracted the same way as prior tasks) passes.
- [ ] **Step 3: Commit and open a PR against `main`** (the original three tasks are already merged, so this lands as a follow-up branch/PR rather than a continuation of the original `ci/deploy-on-release` branch).

**4f. Port collision with another app on the same server.** After deploy
succeeded end-to-end for the first time (git bootstrap, build, `pm2`
reload all worked), the site at the production domain showed a *different*
site hosted on the same server. `pm2 list` on the server showed two
processes: a pre-existing `npm` process (the other site) and `qrframe`
with 93 restarts — `pm2 logs qrframe` showed why:
```
Error: listen EADDRINUSE: address already in use :::3000
```
Both apps default to Next.js's port 3000 (`next start`'s default when
no `-p`/`PORT` is given), and the pre-existing site's process had already
claimed it — `qrframe` was crash-looping on every PM2 restart attempt, and
the reverse proxy (configured separately at the web-server/control-panel
level, out of scope for this repo — see the "Manual verification" section
below) was forwarding the domain's traffic to whichever process actually
held port 3000, i.e. the other site. Fixed by giving `qrframe` its own
port via the `PORT` environment variable, which `next start` honors as a
fallback when no `-p` flag is passed:

```yaml
          envs: RELEASE_TAG,SSH_DIR,REPO_URL,PORT
          command_timeout: 30m
          script: |
            ...
        env:
          RELEASE_TAG: ${{ github.event.release.tag_name }}
          SSH_DIR: ${{ secrets.SSH_DIR }}
          REPO_URL: https://github.com/${{ github.repository }}.git
          PORT: 3001
```

No change to the script body itself was needed: `pm2 restart qrframe
--update-env` (already in the script, used on every deploy after the
first) re-reads the environment `appleboy/ssh-action` set up for the
script's shell — including `PORT` — and applies it to the already-existing
PM2 process definition. The reverse proxy on the server (whatever web
server/control panel fronts the domain) must point at the *same* port
(`3001`) for this to actually resolve the domain to the right app — that
side of the config is entirely outside this repo/workflow and was updated
by hand on the server, not by this change.

---

## Manual verification (not automatable in this environment)

This plan has no live server or GitHub release event to test against locally, so the final confidence check happens after merging: publish a real GitHub release once this branch is merged, watch the Actions run, and confirm:

1. Before the first real deploy, confirm the toolchain is actually reachable from a non-interactive shell — `appleboy/ssh-action` runs a non-login, non-interactive remote shell, where `~/.bashrc` often early-returns before setting up nvm-managed tools, so `node`/`corepack`/`pnpm`/`pm2` can be missing from `PATH` there even though they work fine over an interactive SSH session: `ssh <user>@<host> 'node -v; corepack --version; pnpm -v; pm2 -v'`.
2. The gate steps (install/lint/test) run and pass.
3. The SSH step connects and the server ends up on the new tag (`git log -1` on the server matches the release tag).
4. `pm2 list` on the server shows `qrframe` as `online` with a recent restart time (and a low/stable restart count — a climbing count on every check means it's crash-looping, as it did in 4f's port collision).
5. The site serves the new release's changes.
6. The web server / control panel fronting the domain (Apache, Nginx, or whatever the host provides — entirely outside this repo, configured by hand on the server) reverse-proxies to `127.0.0.1:$PORT` (`3001`, per 4f) rather than trying to serve `$SSH_DIR` as static files, and that port isn't already claimed by another app on the same server (check `pm2 list` for other processes before picking a port for a new deploy target).

Note: the `release: types: [published]` trigger fires for pre-releases too, so publishing a pre-release to "test" this is not a dry run — it triggers the same real deploy against production as a full release.

This isn't a plan task because it requires infrastructure (a real server, a real release) outside this repo checkout — call it out to the user after all tasks are merged.
