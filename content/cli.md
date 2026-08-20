---
title: Faable CLI
description: The Faable CLI (@faable/faable) covers the full deploy cycle from the terminal — deploy, trigger, redeploy, status, logs, deployments, secrets, and custom domains — plus Faable Auth management (users, suspensions, actions, OAuth clients, audit logs) for Node.js, Python, and Dockerfile apps.
---

# Faable CLI

The Faable CLI (`@faable/faable`) is your command-line interface for managing and deploying applications on the Faable platform — Node.js (Next.js, Express, …), Python (Django, FastAPI, Flask), or your own Dockerfile. Deploy, manage secrets, and attach custom domains without leaving the terminal.

The CLI covers both **Faable Deploy** (everything below up to Domains) and **Faable Auth** ([`faable auth`](#faable-auth): users, actions, OAuth clients, and the audit log).

## Installation

Install the Faable CLI globally using npm:

```bash
npm install -g @faable/faable@latest
```

Once installed, you can verify it by running:

```bash
faable --version
```

## Authentication

Before interacting with your projects, you need to authenticate your CLI session.

### Login

The `login` command opens your default browser to complete the authentication process. It uses a secure device flow.

```bash
faable login
```

> [!NOTE]
> For CI/CD, you don't need to log in at all — GitHub Actions authenticates via **OIDC** automatically.

### Whoami

Check which account is currently logged in:

```bash
faable whoami
```

### Logout

Clear your local credentials and end the session:

```bash
faable logout
```

## Project Setup

### Link

Link your current repository to one of your Faable apps. The CLI **auto-detects your Git remote origin** and prompts you to select the app from a list — you never need to look up an `app_id`.

```bash
faable deploy link
```

This mirrors the dashboard's **Link repository** action. Linking requires the **Faable GitHub App** to be installed on the repository; if it isn't, the CLI tells you how to install it. Once linked, `faable deploy` and GitHub Actions resolve the app automatically.

> [!NOTE]
> The old top-level `faable link` still works as a deprecated alias and will be removed in a future release.

## Deployment

Deploying your application is the core feature of the Faable CLI. It uploads your source and the platform builds it in the cloud — framework detection included.

### Deploy

Deploy the current project to Faable.

```bash
faable deploy
```

The app is resolved automatically — no `app_id` required:

- **In GitHub Actions**: from the repository linked to your app, via OIDC.
- **Locally**: by matching your git origin remote against your apps' linked repositories (connected in the dashboard or via `faable deploy link`).

Pass an app explicitly only for **monorepos** with several apps linked to the same repository:

```bash
faable deploy <app_id>
```

**What happens during deploy:**

1. **Upload**: The CLI snapshots your working directory and uploads only the files the platform hasn't seen before (content-addressed — repeat deploys upload just the diff).
2. **Remote build**: Faable's builders detect your framework server-side — Node.js (Next.js, Express, Astro, Vite, …), Python (Django, FastAPI, Flask), or your Dockerfile — and build in the cloud. Nothing builds on your machine: no local Docker, no local toolchain requirements.
3. **Release**: The deployment is promoted and goes live at your application URL. The CLI streams the build output and waits for promotion, failing red with the actual error if the build or startup fails.

> [!NOTE]
> `faable deploy` records a **release version** on the deployment and injects it
> as `FAABLE_RELEASE`. It's resolved from `--release`, else the `FAABLE_RELEASE`
> env var, else your latest git tag — run `git fetch --tags` locally so the tag
> is visible. Pass it explicitly with `faable deploy --release 1.4.2`. See
> [Environment & Releases](deploy/environment.mdx).

### Trigger — deploy the repo HEAD server-side

For an app with push-to-deploy, build the current head of the deploy branch **without uploading anything from your machine** — the exact same path a `git push` takes, same-commit dedupe included:

```bash
faable deploy trigger
```

### Redeploy — retry a failed deployment

Rebuild a failed deployment from the source it recorded (your uploaded files, or the git commit for push deploys). Without arguments it picks the latest failed one:

```bash
faable deploy redeploy
faable deploy redeploy deployment_a1b2c3   # a specific one
```

The platform refuses to rebuild code older than what production is serving — push a new deploy in that case.

## Inspecting

### Status

What is live right now — phase, URL, detected stack, and the latest deployment (with the failure reason when it went red):

```bash
faable deploy status
```

```
🟢 READY  shop-api (app_a1b2c3)
  URL:        https://shop-api-x1y2z.faable.link
  Stack:      python 3.12.1 (django)
  Repository: acme/shop-api (main, push-to-deploy)
  Live:       deployment_d4e5f6
```

### Logs

Runtime logs of the app (last 24 hours), or the **build output** of the latest deployment — the first thing to check after a failed deploy:

```bash
faable deploy logs             # runtime logs
faable deploy logs --build     # build output of the latest deployment
faable deploy logs --build --follow       # tail the build that is running right now
faable deploy logs -d deployment_a1b2c3   # scope to one deployment
```

`--follow` (or `-f`) tails a build that is still running — the same live output the dashboard's build logs modal shows — and exits red if the build fails. On a finished deployment it prints the recorded output instead.

### Deployments

Recent deployments with phase, commit, and which one is serving traffic:

```bash
faable deploy deployments
```

```
🚀 Last 3 deployment(s) of shop-api:
  🟢 READY  deployment_d4e5f6  4ae34bf  (push, 16m ago)  ← live
  🔴 BUILD_ERROR  deployment_c3d4e5  dbd9afa  (push, 41m ago)
  ⚪ SUPERSEDED  deployment_b2c3d4  e31edcd  (push, 2h ago)
```

### List

All your apps at a glance:

```bash
faable deploy list
```

### Open

Jump to the live app (or its dashboard page) in the browser:

```bash
faable deploy open
faable deploy open --dashboard
```

## Secrets

Manage your app's secrets (environment variables) without leaving the terminal. Inside a linked repository the app is detected automatically — the same resolution `faable deploy` uses. Outside of one (or to target another app) pass `--app <app_id>`.

`set` and `list` warn when a name is one the platform manages — `PORT`, the `FAABLE_*` variables and `START_COMMAND` are [reserved](deploy/environment.mdx#reserved-names) and your value is ignored at deploy time.

### Set

Set one or more secrets as `KEY=VALUE` pairs. Values may contain `=` (only the first one splits the pair); quote values containing spaces.

```bash
faable deploy secrets set DATABASE_URL=postgres://user:pass@host/db STRIPE_KEY=sk_live_abc
```

```
🔑 Added secret DATABASE_URL to app_a1b2c3
🔑 Added secret STRIPE_KEY to app_a1b2c3
✅ 2 secret(s) saved to app_a1b2c3.
ℹ️ The app is restarting to apply the changes.
```

### Set from a .env file

`--env-file` (`-f`) uploads a whole `.env` in one go — the fastest way to move a working local environment to your app. With no path it reads `./.env`:

```bash
faable deploy secrets set --env-file
faable deploy secrets set -f .env.production
```

```
📄 Read 24 variable(s) from .env
🔑 18 added, 6 updated
✅ 24 secret(s) saved to app_a1b2c3.
ℹ️ The app is restarting to apply the changes.
```

The file format is the usual one:

```bash
# Comments and blank lines are ignored
DATABASE_URL=postgres://user:pass@host/db
export NODE_ENV=production          # a leading "export" is fine
GREETING="hello world"              # quotes are stripped
LITERAL='no \n escapes here'        # single quotes are literal
PRIVATE_KEY="-----BEGIN KEY-----
multi-line values work when quoted
-----END KEY-----"
```

Double-quoted values expand `\n`, `\r`, `\t`, `\\` and `\"`; single-quoted values are taken literally. In an unquoted value, a `#` preceded by a space starts a comment — quote the value if you need one inside it.

Nothing is written until the whole file parses, and errors point at the line: `.env:12: expected KEY=VALUE, got "OOPS".`

The file **adds and overwrites**; it never deletes. Names already on the app but missing from the file are left alone — remove those with [`secrets rm`](#remove). You can combine both forms, and an explicit pair wins over the file:

```bash
faable deploy secrets set -f .env NODE_ENV=production
```

> [!NOTE]
> A `.env` usually holds your **local** values. Check it before uploading — or keep a separate `.env.production` for the app.

### List

List the app's secrets. Values are **masked by default**; pass `--show` to reveal them. Secrets inherited from your team profile are marked as such.

```bash
faable deploy secrets list
faable deploy secrets list --show
```

### Remove

Remove a secret by name. The CLI asks for confirmation; pass `--yes` to skip it (for scripts and CI).

```bash
faable deploy secrets rm STRIPE_KEY
```

Changes apply immediately: the app restarts with the new environment.

## Domains

Attach custom domains to your app from the terminal. Like secrets, the app is detected automatically inside a linked repository; pass `--app <app_id>` otherwise.

### Add

Add a domain and get the exact DNS record to configure:

```bash
faable deploy domains add www.example.com
```

```
🌐 Domain www.example.com added to shop-api (app_a1b2c3).

Now create a CNAME record at your DNS provider:
  www.example.com → domain_d4e5f6.faable.link

Faable verifies the record automatically once DNS propagates and then provisions the TLS certificate.
Track it with: faable deploy domains check www.example.com
```

TLS is provisioned automatically once the domain verifies (pass `--no-tls` to opt out).

### List

```bash
faable deploy domains list
```

Shows every domain of the app with its verification state, and repeats the pending CNAME records so you never have to hunt for them.

### Check

Diagnose a domain that hasn't verified yet — expected CNAME vs. what DNS actually resolves, plus the verifier's message:

```bash
faable deploy domains check www.example.com
```

Verification re-runs automatically; there is nothing to trigger manually.

### Remove

```bash
faable deploy domains rm www.example.com
```

Asks for confirmation (skip with `--yes`). The app stays live on its `faable.link` URL.

## Faable Auth

Manage a Faable Auth tenant from the terminal: `faable auth <users|actions|clients|logs>`. Commands reuse your `faable login` session. Every subcommand accepts `--auth-url https://<account>.auth.faable.link` (env `FAABLE_AUTH_URL`) to target your tenant, and read commands accept `--json` for a machine-clean output you can pipe to `jq`.

### Users

```bash
faable auth users list                             # list users
faable auth users list --suspended                 # only suspended users
faable auth users list --query email_verified:false --limit 50
faable auth users list -q alice                    # full-text over name/email/phone
faable auth users get user_abc123
```

`--query` takes a FaableQL filter — space-separated `field:value` terms over `email`, `name`, `phone`, `suspended`, `email_verified`, `country_iso`, `locale`, and `last_ip`. Listings fetch one page (`--limit`, up to 200); add `--all` to walk every page.

#### Suspend users

Suspending blocks every login, token refresh, and session for the user:

```bash
faable auth users suspend user_abc123 --reason "abuse: crypto miner"
faable auth users suspend user_a user_b user_c -y -r "abuse wave"

# Bulk: pipe ids from a filtered listing
faable auth users list --query email_verified:false --json \
  | jq -r '.[].id' \
  | faable auth users suspend -y -r "unverified batch"
```

Asks for confirmation (skip with `--yes`). Access tokens already issued to external APIs stay valid until they expire (up to 24h).

#### Reinstate users

Reinstating re-enables logins and token issuance and clears the suspension reason:

```bash
faable auth users reinstate user_abc123
faable auth users reinstate user_a user_b -y

# Bulk: pipe ids from a filtered listing
faable auth users list --suspended --json \
  | jq -r '.[].id' \
  | faable auth users reinstate -y
```

Asks for confirmation (skip with `--yes`).

### Actions

Actions are JavaScript hooks that run inside the login flow (`post-login` or `continue` trigger):

```bash
faable auth actions list
faable auth actions get action_xyz --code          # print the source
faable auth actions create -n add-claims -t post-login -f ./claims.js
faable auth actions create -n gate -t post-login -f ./gate.js --disabled
faable auth actions update action_xyz -f ./gate.js  # replace the code in place
faable auth actions update action_xyz --no-enabled  # disable without a deploy
faable auth actions rm action_xyz
```

### OAuth clients

```bash
faable auth clients list
faable auth clients get <client_id> --secret       # accepts the OAuth client_id or the resource id
faable auth clients create -n my-app --callback https://app.example.com/callback
faable auth clients rm <client_id>
```

`create` prints the generated client id and secret — store the secret right away and treat it like a password.

### Audit logs

Read-only trail of everything that happens in the tenant (logins, token grants, admin changes):

```bash
faable auth logs list --limit 20
faable auth logs list --user user_abc123 --since 2026-08-01
faable auth logs list --origin oauth --status failed
faable auth logs list --type admin.user.updated
faable auth logs get log_xyz                       # full entry, including its data payload
```

`--since`/`--until` take unix-millis or `YYYY-MM-DD` dates. `--origin` matches a subsystem prefix (`oauth` matches every `oauth.*` event), `-q` searches the log message text.

## Command Reference

| Command                       | Description                                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------ |
| `faable login`                | Authenticate with Faable                                                              |
| `faable whoami`               | Show current user                                                                     |
| `faable logout`               | End the local session                                                                 |
| `faable deploy`               | Deploy project to production                                                          |
| `faable deploy trigger`       | Build the repo HEAD server-side (no upload)                                           |
| `faable deploy redeploy`      | Retry a failed deployment from its source                                             |
| `faable deploy status`        | What is live: phase, URL, stack, latest deploy                                        |
| `faable deploy logs`          | Runtime logs (`--build` for build output, `--build --follow` to tail a running build) |
| `faable deploy deployments`   | Recent deployments with phases and commits                                            |
| `faable deploy list`          | List your apps                                                                        |
| `faable deploy open`          | Open the live app (`--dashboard` for the console)                                     |
| `faable deploy link`          | Link directory to a Faable app                                                        |
| `faable deploy secrets list`  | List app secrets (masked, `--show`)                                                   |
| `faable deploy secrets set`   | Set secrets as `KEY=VALUE` pairs, or a whole file with `--env-file`                   |
| `faable deploy secrets rm`    | Remove a secret by name                                                               |
| `faable deploy domains list`  | List custom domains and their DNS state                                               |
| `faable deploy domains add`   | Add a domain (prints the CNAME to set)                                                |
| `faable deploy domains check` | DNS verification diagnostic for a domain                                              |
| `faable deploy domains rm`    | Remove a domain (confirmation, `--yes`)                                               |
| `faable auth users list`      | List and filter users (`--query`, `-q`, `--suspended`)                                |
| `faable auth users get`       | Show a user, including suspension state                                               |
| `faable auth users suspend`   | Suspend users by id — bulk via args or stdin                                          |
| `faable auth users reinstate` | Reinstate suspended users by id — bulk via args or stdin                              |
| `faable auth actions list`    | List login-flow actions                                                               |
| `faable auth actions get`     | Show an action (`--code` prints the source)                                           |
| `faable auth actions create`  | Create an action from a JS file                                                       |
| `faable auth actions update`  | Update an action in place (`-f` code, `--name`, `--order`, `--enabled`)               |
| `faable auth actions rm`      | Delete an action (confirmation, `--yes`)                                              |
| `faable auth clients list`    | List OAuth clients                                                                    |
| `faable auth clients get`     | Show a client (`--secret` reveals the secret)                                         |
| `faable auth clients create`  | Create a client (prints id + secret once)                                             |
| `faable auth clients rm`      | Delete a client (confirmation, `--yes`)                                               |
| `faable auth logs list`       | Filter the audit log (type, status, origin, user, dates)                              |
| `faable auth logs get`        | Show one audit entry with its data payload                                            |
