---
title: Faable CLI
description: The Faable CLI (@faable/faable) covers the full deploy cycle from the terminal — deploy, trigger, redeploy, cancel, status, logs, deployments, inspect, secrets, custom domains, and edge rules that stop scanner traffic from waking a sleeping app — plus Faable Auth management (users, suspensions, actions, OAuth clients, audit logs) for Node.js, Python, and Dockerfile apps.
rank: entry
---

# Faable CLI

The Faable CLI (`@faable/faable`) is your command-line interface for managing and deploying applications on the Faable platform — Node.js (Next.js, Express, …), Python (Django, FastAPI, Flask), or your own Dockerfile. Deploy, manage secrets, and attach custom domains without leaving the terminal.

The CLI covers both **Faable Deploy** (everything below up to Edge rules) and **Faable Auth** ([`faable auth`](#faable-auth): users, actions, OAuth clients, and the audit log).

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

## Projects

Apps, domains and Faable Auth tenants live in a **project**. Commands that act on a whole project — listing apps, `apps create`, `usage`, `quota`, `faable auth` — use the active one:

```bash
faable project list                  # your projects (--mine: only the ones you own)
faable project use                   # pick one from a list (type to filter)
faable project use "My project"      # by name, slug or id
faable project use -                 # back to the previous one
faable project                       # which one is active, and why
faable project clear
```

For a single command, pass `--project` (`-p`) or set `FAABLE_PROJECT` — both take an id, name or slug and win over the stored one. Commands about one app always use that app's own project.

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

Pass an app explicitly — always with `--app`, never as a bare argument — for **monorepos** with several apps linked to the same repository, or for an app with no repository connected:

```bash
faable deploy --app <app_id>
```

A bare `faable deploy` is an alias of `faable deploy launch` — deploying is a subcommand like `status` or `secrets`, and the shortcut runs exactly the same code. Run `launch` explicitly whenever it reads better, especially from outside the project directory:

```bash
faable deploy launch --app <app_id> --workdir ./apps/web
faable deploy launch --create my-site --workdir ./dist --yes --json   # a new app, deployed from this folder
```

`--create <name>` makes a new app in the active project first and deploys the directory to it. `--json` prints the outcome — app, deployment, `outcome` (`live`, `failed`, `superseded`, `timeout`) and the URL; a failed deploy still exits with status 1.

Run it where no app can be resolved — a directory with no linked repository — and `deploy` lists its subcommands instead, the way `faable auth` does.

> [!NOTE]
> `deploy` takes only subcommands, so an app id written where a subcommand belongs is rejected instead of deploying.
> `faable deploy <app_id> secrets list` fails with `Unknown command`; the correct form is `faable deploy secrets list --app <app_id>`.
> The `--app` (`-a`) flag works the same on `launch` and on every subcommand.

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
faable deploy trigger --wait               # wait until live, print the URL — or why it failed
```

With `--wait` (default `--timeout 900` seconds) the command returns once the deploy is live, with the app's URL, or failed, with the reason and whether it is on your side (your code, config or repository) or on Faable's. A timeout is not a failure: the build goes on.

### Redeploy — retry a failed deployment

Rebuild a failed deployment from the source it recorded (your uploaded files, or the git commit for push deploys). Without arguments it picks the latest failed one:

```bash
faable deploy redeploy
faable deploy redeploy deployment_a1b2c3   # a specific one
```

The platform refuses to rebuild code older than what production is serving — push a new deploy in that case.

### Cancel — stop a build you no longer want

Deployed from the wrong directory, or pushed a commit you meant to amend? Stop the build instead of waiting for it to finish and then deploying over it. Without arguments it cancels the deployment currently in flight:

```bash
faable deploy cancel
faable deploy cancel deployment_a1b2c3   # a specific one
```

Only a deployment that is still **queued or building** can be canceled. Once the platform has taken it over to roll it out, it runs to completion — production keeps serving the last promoted deployment either way, so a cancel never takes your site down. Cancelling twice is not an error.

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

Runtime logs of the app (last 24 hours), or the **build output** of a deployment — the first thing to check after a failed deploy. `-d` scopes either kind to one deployment id:

```bash
faable deploy logs             # runtime logs of whatever is serving now
faable deploy logs --build     # build output of the latest deployment
faable deploy logs --build --follow          # tail the build that is running right now
faable deploy logs --build -n 100            # only the last 100 lines — where a failure says why

faable deploy logs -d deployment_a1b2c3          # runtime logs of THAT deployment
faable deploy logs --build -d deployment_a1b2c3  # its build output
```

`--follow` (or `-f`) tails a build that is still running — the same live output the dashboard's build logs modal shows — and exits red if the build fails. On a finished deployment it prints the recorded output instead.

The two sources behave differently, and it matters when you are debugging an old deployment:

- **Build output** is stored on the deployment itself, so it stays readable for as long as the deployment exists — including failed builds.
- **Runtime logs** are a rolling **24-hour window** (last 200 lines, your `app` container only). A deployment that stopped serving more than a day ago has nothing left to show; its build output still does.

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

### Inspect — one deployment, by id

Everything the platform recorded about a single deployment: phase, commit and author, release, detected stack, the packaged runnable (profile, runtime, size), the runtime image it was pinned to, and the **full failure reason** when it went red. Without an id it inspects the latest deployment of the app.

```bash
faable deploy inspect deployment_a1b2c3
faable deploy inspect                      # the latest one
faable deploy inspect deployment_a1b2c3 --json   # raw record, for scripting
```

```
🔴 ERROR  deployment_a1b2c3
  App:        shop-api (app_a1b2c3)
  Created:    35m ago (2026-08-24T09:12:03.747Z)
  Trigger:    push (webhook)
  Serving:    no (not live)
  Commit:     4ae34bf "fix: bump deps" (main by acme-bot)
  Release:    1.2.0
  Stack:      node 22.1.0 (next)
  Artifact:   next-standalone · node 22 · 41.2 MB (sealed 34m ago)
  Start:      npm run start
  Runtime:    faable-runtime-node:22
  Reason:
    Container "app" crashed on startup (exit 1, 3 restarts).
    Error: connect ECONNREFUSED 127.0.0.1:5432
  Logs:       faable deploy logs -d deployment_a1b2c3 -a app_a1b2c3
  Build:      faable deploy logs --build -d deployment_a1b2c3 -a app_a1b2c3
  Retry:      faable deploy redeploy deployment_a1b2c3 -a app_a1b2c3
```

The deployment id comes from `faable deploy deployments`, from a deploy that just failed, or from the dashboard URL. `--json` prints the raw record (with the artifact descriptor embedded) so scripts and agents can read it.

The suggested commands always name the app with `-a`, so you can copy any of them into any terminal — they do not depend on being run inside the app's repository.

### Traffic

What the edge served for the app: status codes, the busiest paths and the failing ones. Edge data trails reality by up to 15 minutes.

```bash
faable deploy traffic                 # last 24 hours
faable deploy traffic --since 7d      # 30m, 24h, 7d…
faable deploy traffic -d deployment_a1b2c3   # only what one deployment served
```

### Usage and quota

```bash
faable deploy usage     # this billing period: plan, apps, domains, deployments, egress
faable deploy quota     # today's deploy allowance, and builds held waiting for it
```

A build held by the daily quota is waiting, not failing: it rolls out when the allowance resets.

### Open

Jump to the live app (or its dashboard page) in the browser:

```bash
faable deploy open
faable deploy open --dashboard
```

## Apps

```bash
faable deploy apps list                    # the apps of the active project
faable deploy apps get --app shop-api      # one app: what is live, latest deployment, stack
```

`--app` takes an app **id, name or slug**. A name or slug is looked up among the apps of the active project and must match exactly one.

### Create an app from a repository

```bash
faable deploy apps create --repo acme/shop-api
faable deploy apps create --repo acme/monorepo --name api --branch release
```

This is the dashboard's **Create & connect**: it creates the app in the active project, links the GitHub repository and starts the first deploy. `--repo` takes `owner/repo` or the repository URL; the name defaults to the repository's. Pass `--no-deploy` to only link, or `--wait` to stay until the first deploy is live and get its URL.

Linking needs the **Faable GitHub App** installed on the repository. If the link fails, the app the command just created is removed again, and the error says why — install the app, then run the same command again. To see which repositories Faable can deploy:

```bash
faable deploy github repos              # where the Faable GitHub App is installed
faable deploy github repos -q shop      # filter by name
```

### Change how an app deploys

```bash
faable deploy apps set --branch release           # deploy from another branch
faable deploy apps set --root-dir apps/web        # a monorepo app
faable deploy apps set --root-dir ""              # back to faable.json's rootDir
faable deploy apps set --mode push                # push | ci | workflow
```

`push` deploys every push, `ci` deploys once your CI tags a release, `workflow` leaves deploying to your own GitHub workflow. The new settings apply to the next deploy — start one with `faable deploy trigger`.

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

### Set from stdin

`-f -` reads the variables from standard input, so the values never appear on the command line (where `ps` and shell history can see them):

```bash
op read op://vault/shop-api/env | faable deploy secrets set -f -
```

Use the short `-f`: on Node.js 22 and later, `--env-file` followed by a path that does not exist is intercepted by Node itself before the CLI runs.

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

## Edge rules (WAF)

Scanners and crawlers ask every app on the internet for paths it never serves —
`/.env`, `/wp-login.php`, `/robots.txt`, probes under `/.well-known/`. Faable already
blocks the well-known scanner families for you. What is left is the traffic that is
specific to your app: on a scale-to-zero app, every one of those requests **starts your
container** just to answer a 404.

`faable deploy waf` lets you handle those paths at the edge, so they never reach your
app. Two rules, depending on what the caller should get back:

| Command | Answer | Use it when                                                                                        |
| ------- | ------ | -------------------------------------------------------------------------------------------------- |
| `block` | `403`  | You want the request refused — a scanner probe, an admin path that should not be public            |
| `sink`  | `404`  | Your app does not serve that path anyway. Faable replies with the same 404, without the cold start |

A rule selects requests by **path**, by **user-agent**, or by both at once:

| You write                            | It matches                                       |
| ------------------------------------ | ------------------------------------------------ |
| `waf block '^/wp-admin'`             | that path, from anyone                           |
| `waf block --user-agent YisouSpider` | that crawler, on **every** path                  |
| `waf block '^/api/' -u YisouSpider`  | that path **and** that crawler — both must match |

Patterns are regular expressions. Path patterns are matched against the request path and
user-agent patterns against the `User-Agent` header, unanchored (agents append versions
and URLs, so `YisouSpider` matches `YisouSpider/5.0`). **Quote them in your shell** —
`$`, `\` and `?` are shell metacharacters.

### Block a path

```bash
faable deploy waf block '^/\.well-known/'
```

```
🛡️  ^/\.well-known/ → 403 at the edge for shop-api (app_a1b2c3).

Matching requests are blocked before they reach your app, so they no longer wake it.

It takes about 20s to reach the edge. Then check it with:
  curl -s -o /dev/null -w '%{http_code}\n' https://shop-api.faable.link<path>

Undo: faable deploy waf rm '^/\.well-known/' -a app_a1b2c3
```

### Answer a path without waking the app

```bash
faable deploy waf sink '^/robots\.txt$'
```

Use `sink` for paths your app 404s anyway. A 404 on `robots.txt` means "no crawling
restrictions", which is exactly what your app was already replying — the only difference
is that Faable answers it and your container stays asleep.

### Block a crawler

```bash
faable deploy waf block --user-agent YisouSpider
```

A user-agent rule has **no path restriction**: it applies to every path on the app. That
is usually what you want for a scraper that is only there to read your pages, and it is
why the rule is refused if the pattern would also match a real browser — `Safari`, for
instance, matches Chrome, whose user-agent ends in `Safari/537.36`.

Search engines, AI crawlers and uptime monitors are refused too, but only until you say
you mean it:

```
❌ Pattern also matches Googlebot. Blocking search or AI crawlers removes you from
   their results, and blocking uptime monitors changes what they see.
   Re-run with --force if that is what you want.
```

To restrict a rule to certain paths, give both halves — then **both** have to match:

```bash
faable deploy waf block '^/api/' --user-agent YisouSpider
```

### List

```bash
faable deploy waf list
```

Shows the platform rulesets protecting your app plus every rule you added, with what
each one answers.

### Remove

```bash
faable deploy waf rm '^/robots\.txt$'
faable deploy waf rm --user-agent YisouSpider
faable deploy waf rm '^/api/' --user-agent YisouSpider
```

Remove a rule the same way you created it: `'^/login'` and `'^/login' -u YisouSpider` are
two different rules that happen to share a path, so removing one leaves the other in
place. Those requests reach your app again within ~20s.

<Callout type="info">
  Certificate renewal is never affected: Faable keeps `/.well-known/acme-challenge/`
  reachable even when one of your rules would cover it, so a broad `^/\.well-known/`
  rule is safe on custom domains.
</Callout>

Some patterns cannot be ruled on, and the CLI tells you why instead of accepting them:

- a path pattern matching your site root `/`, or a user-agent pattern matching a real
  browser — both would take the whole app offline;
- a user-agent pattern matching Faable's own platform traffic, which would break
  certificate renewal for the app;
- lookahead and backreference syntax, which the edge's regex engine does not support.

## Faable Auth

Manage a Faable Auth tenant from the terminal: `faable auth <users|sessions|connections|actions|clients|logs>`. Commands reuse your `faable login` session and act on the tenant of the [active project](#projects); with several, `faable auth accounts list` shows them and `faable auth use <account>` picks one. To target a tenant directly, pass `--account <id>` or `--auth-url https://<account>.auth.faable.link` (env `FAABLE_AUTH_ACCOUNT` / `FAABLE_AUTH_URL`). Every command accepts `--json`.

### Users

```bash
faable auth users list                             # list users
faable auth users list --suspended                 # only suspended users
faable auth users list --query email_verified:false --limit 50
faable auth users list -q alice                    # full-text over name/email/phone
faable auth users list --email alice@example.com   # exact email
faable auth users list --sort=-last_login -n 20    # the 20 most recent logins
faable auth users get user_abc123
faable auth users get alice@example.com            # by email
```

#### Count users and filter by date

```bash
faable auth users list --last-login-since 24h --count    # how many logged in today
faable auth users list --created-since 7d --count        # sign-ups this week
faable auth users list --suspended --count
```

`--count` prints only the number (`{"total": N}` with `--json`), counted on the server across every page. Date flags — `--last-login-since/--last-login-until`, `--created-since/--created-until` — take a relative age (`30m`, `24h`, `7d`), unix-millis or `YYYY-MM-DD`. `--sort` orders by `last_login`, `logins_count` or `createdAt` (prefix `-` for descending, written `--sort=-last_login`); sorting by `last_login` leaves out users who never logged in.

`users get` prints the full user card — email and verification, creation date, last login with its IP, suspension state, and the user's **federated identities**: for each linked provider (e.g. GitHub) the provider login, profile URL, and when the provider account was created. Provider tokens are never shown. With `--json` the identities are included (sanitized) under `identities`.

`--query` takes a FaableQL filter — space-separated `field:value` terms over `email`, `name`, `phone`, `suspended`, `email_verified`, `country_iso`, `locale`, and `last_ip`. Listings fetch one page (`--limit`, up to 200); add `--all` to walk every page.

#### Suspend users

Suspending blocks every login, token refresh, and session for the user. Users can be named by id or by email — an email must match exactly one user, or nothing is changed:

```bash
faable auth users suspend alice@example.com --reason "chargeback"
faable auth users suspend user_abc123 --reason "abuse: crypto miner"
faable auth users suspend user_a user_b user_c -y -r "abuse wave"

# Bulk: pipe ids from a filtered listing
faable auth users list --query email_verified:false --json \
  | jq -r '.data[].id' \
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
  | jq -r '.data[].id' \
  | faable auth users reinstate -y
```

Asks for confirmation (skip with `--yes`).

#### Password setup email

Send a user the email (or a code by SMS/WhatsApp) to set or reset their password — to invite a user you created by hand, or to unblock one who forgot it:

```bash
faable auth users password-setup alice@example.com
faable auth users password-setup user_abc123 --channel sms
```

### Sessions

Each login is a session: a device the user is signed in on.

```bash
faable auth sessions list --user alice@example.com --active   # their devices: IP, device, last seen
faable auth sessions revoke --user alice@example.com          # sign them out everywhere
faable auth sessions revoke session_abc123                    # one device
```

Revoking ends the session cookie and every refresh token issued through it; access tokens already issued live until they expire. Asks for confirmation (skip with `--yes`).

### Login methods

```bash
faable auth connections list            # social, passwordless and username/password, and which are enabled
```

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
faable auth logs list --type user.login --since 24h --expand-user   # who logged in today, with their email
faable auth logs list --email alice@example.com --status failed     # why can't Alice log in?
faable auth logs get log_xyz                       # full entry, including its data payload
```

`--since`/`--until` take a relative age (`30m`, `24h`, `7d`), unix-millis or `YYYY-MM-DD` dates. `--expand-user` embeds each entry's user (email, name) instead of only its id. `--origin` matches a subsystem prefix (`oauth` matches every `oauth.*` event), `-q` searches the log message text.

## MCP server

`faable mcp` runs the CLI as an [MCP](https://modelcontextprotocol.io) server over stdio, so an AI agent in your editor — Claude Code, Cursor, VS Code or any MCP client — can see your apps, read why a deploy failed, deploy a repository and hand you the URL — and see who logs in to your apps, count your users and suspend one — without you pasting logs into the chat. It acts with your `faable login` session.

```bash
claude mcp add faable -- npx -y @faable/faable mcp
```

For other clients, add a stdio server that runs `npx -y @faable/faable mcp`.

### Hosted endpoint

No install needed: connect any MCP client that speaks Streamable HTTP — including ones that cannot run local processes — to **`https://mcp.faable.com/mcp`**, authenticating with a Faable API key (create one in the dashboard: project settings → **API Keys**).

```bash
claude mcp add --transport http faable https://mcp.faable.com/mcp \
  --header "Authorization: Bearer <your API key>"
```

- `?mode=write` adds the reversible writes; `?readonly=1` leaves only the reads.
- The tool catalog is published at [`mcp.faable.com/tools.json`](https://mcp.faable.com/tools.json) and [`mcp.faable.com/llms.txt`](https://mcp.faable.com/llms.txt).

> [!NOTE]
> An API key belongs to the project it was created in and only works there — it never reaches your other projects. Treat it like a password all the same: anyone holding it can act on that project. Revoke it in the dashboard and it stops working within 30 seconds.

By default the server exposes **reads plus one deploy**:

| Tool                                                                       | What the agent can do                                                                                                        |
| :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| `whoami`, `list_projects`, `list_apps`, `get_app`                          | Find the app you mean, see what is live                                                                                      |
| `list_deployments`, `get_deployment`, `get_build_logs`, `get_runtime_logs` | Find out why a deploy failed or an app crashes                                                                               |
| `get_app_traffic`, `get_usage`, `get_quota`                                | Traffic, this period's usage, today's deploy allowance                                                                       |
| `list_domains`, `check_domain`                                             | Custom domains and why one is not verified yet                                                                               |
| `list_secrets`                                                             | Which environment variables are set — names only                                                                             |
| `list_github_repos`                                                        | The GitHub repositories Faable can deploy, and the install link when one is missing                                          |
| `deploy_app`                                                               | Build and deploy the latest commit of the deploy branch, server-side; with `wait`, until it is live (with the URL) or failed |
| `list_auth_logins`                                                         | Who logged in to your app recently, with their email, IP and login method                                                    |
| `count_auth_users`                                                         | How many users logged in or signed up since a time, or are suspended                                                         |
| `list_auth_users`, `get_auth_user`                                         | Find a user by email or text; sort by last login or activity                                                                 |
| `list_auth_logs`, `list_auth_sessions`                                     | Why someone can't log in; the devices a user is signed in on                                                                 |
| `list_auth_tenants`, `list_auth_connections`, `list_auth_clients`          | Your Auth tenants, login methods and applications                                                                            |

When a deploy failed, `get_deployment` also says whose side it is on: `user` (your code, configuration or repository) or `platform` (Faable's).

`faable mcp --writes` adds the reversible writes: `create_app` (from a GitHub repository, first deploy included; with `wait`, until it is live), `set_secrets`, `add_domain`, `redeploy`, `cancel_deployment` and `configure_repo`; for Faable Auth, `suspend_auth_user`, `reinstate_auth_user`, `revoke_auth_sessions` and `send_password_setup`. Only the local server has `deploy_directory`, which uploads a folder of your machine you name by its absolute path. Nothing destructive is exposed — deleting apps, domains, secrets or users stays in the CLI and the dashboard.

With an API key, the hosted server reaches the Faable Auth tenants of the key's own project, with a narrower set of permissions: it can read users, logins, sessions and settings, suspend and reinstate users, end sessions and send password emails — never delete anything or change the tenant itself.

What the server guarantees:

- **Secret values never reach the agent.** `list_secrets` returns names; `set_secrets` sends values to Faable on stdin and returns only which names changed.
- **Logs are data, not instructions.** Build output, runtime logs, commit messages and failure reasons are written by whoever deployed the code, so they come back explicitly marked as untrusted content.
- **Nothing is guessed from your working directory.** Every tool names its app and project; the server never deploys "whatever is in this folder" — `deploy_directory` takes the folder as an explicit absolute path.
- **What your users typed is data too.** Names, log messages and device strings from Faable Auth come back marked as untrusted content, like build logs.
- **Suspending is by one exact user.** An email that matches no user — or more than one — changes nothing.
- **Errors say what to do next** — for example, to run `faable login` when the session has expired.

## Scripting and agents

The CLI is built to be driven by scripts, CI and AI agents. Data goes to **stdout** and messages to **stderr**, and every command accepts `--json`:

- **Listings** return `{"object": "list", "data": [...], "has_more": bool, "next_cursor": string | null}`. Page with `--limit` (1-200) and `--starting-after <next_cursor>`, or fetch everything with `--all`.
- **Writes** return what they changed — the new deployment, the domain with the CNAME to create, the secret names that were added or updated (never their values). A write with nothing to do returns `{"result": "noop", "reason": "..."}`.
- **Failures** exit with status 1 and print `{"error": {"message", "code", "status", "action"}}` on stderr.

| `code`                    | Meaning                                                               |
| :------------------------ | :-------------------------------------------------------------------- |
| `not_logged_in`           | No credentials — run `faable login` (or set `FAABLE_TOKEN`)           |
| `session_expired`         | The session is no longer valid — run `faable login`                   |
| `account_suspended`       | The account cannot sign in                                            |
| `apikey_session`          | The command needs a browser session, not an API key                   |
| `forbidden` / `not_found` | No access to that resource, or it does not exist                      |
| `confirmation_required`   | A destructive command ran without `--yes` and nobody could confirm it |
| `app_required`            | The command needs `--app`                                             |
| `usage`                   | The command line itself is wrong                                      |

Any other `code` comes from the Faable API (for example `repository_already_linked`) and is stable too.

### Non-interactive mode

Set `FAABLE_NONINTERACTIVE=1` (or pass `--non-interactive`) whenever a program runs the CLI:

- nothing prompts: a command that would ask for confirmation fails with `confirmation_required` unless it has `--yes`;
- the app is never guessed from the working directory — pass `--app`;
- `faable deploy launch` needs `--app`, `--workdir` and `--yes`, so an agent cannot upload the wrong directory to the wrong app;
- errors are JSON, as with `--json`.

CI keeps working without it: in GitHub Actions `faable deploy` authenticates with OIDC and deploys unattended as before.

## Command Reference

| Command                            | Description                                                                               |
| :--------------------------------- | :---------------------------------------------------------------------------------------- |
| `faable login`                     | Authenticate with Faable                                                                  |
| `faable whoami`                    | Show current user                                                                         |
| `faable logout`                    | End the local session                                                                     |
| `faable mcp`                       | Run the Faable MCP server over stdio (`--writes` for the reversible writes)               |
| `faable project`                   | Show, list, pick (`use`) or clear the active project                                      |
| `faable deploy`                    | Deploy project to production (alias of `faable deploy launch`)                            |
| `faable deploy launch`             | The deploy itself — `--app` to target another app, `--workdir` to deploy elsewhere        |
| `faable deploy trigger`            | Build the repo HEAD server-side (no upload); `--wait` for the URL                         |
| `faable deploy github repos`       | The GitHub repositories Faable can deploy                                                 |
| `faable deploy redeploy`           | Retry a failed deployment from its source                                                 |
| `faable deploy cancel`             | Stop a deployment that is still queued or building                                        |
| `faable deploy status`             | What is live: phase, URL, stack, latest deploy                                            |
| `faable deploy traffic`            | Status codes, top and failing paths (`--since 7d`)                                        |
| `faable deploy usage`              | This billing period's usage of the project                                                |
| `faable deploy quota`              | Today's deploy allowance and held builds                                                  |
| `faable deploy logs`               | Runtime logs (`--build` for build output, `--build --follow` to tail a running build)     |
| `faable deploy deployments`        | Recent deployments with phases and commits                                                |
| `faable deploy inspect`            | Full record of one deployment by id (`--json` for the raw one)                            |
| `faable deploy apps list`          | List the apps of the active project                                                       |
| `faable deploy apps get`           | One app: what is live, latest deployment, stack                                           |
| `faable deploy apps create`        | Create an app from a GitHub repository and start its first deploy                         |
| `faable deploy apps set`           | Change the deploy branch, root directory or deploy mode                                   |
| `faable deploy open`               | Open the live app (`--dashboard` for the console)                                         |
| `faable deploy link`               | Link directory to a Faable app                                                            |
| `faable deploy secrets list`       | List app secrets (masked, `--show`)                                                       |
| `faable deploy secrets set`        | Set secrets as `KEY=VALUE` pairs, a whole file with `--env-file`, or stdin (`-f -`)       |
| `faable deploy secrets rm`         | Remove a secret by name                                                                   |
| `faable deploy domains list`       | List custom domains and their DNS state                                                   |
| `faable deploy domains add`        | Add a domain (prints the CNAME to set)                                                    |
| `faable deploy domains check`      | DNS verification diagnostic for a domain                                                  |
| `faable deploy domains rm`         | Remove a domain (confirmation, `--yes`)                                                   |
| `faable deploy waf list`           | Show the edge rules in effect for the app                                                 |
| `faable deploy waf block`          | Refuse requests at the edge with a 403 (by path, user-agent, or both)                     |
| `faable deploy waf sink`           | Answer requests with a 404 without waking the app                                         |
| `faable deploy waf rm`             | Remove one of your edge rules                                                             |
| `faable auth users list`           | List, filter, sort and count users (`--email`, `--sort`, `--last-login-since`, `--count`) |
| `faable auth users get`            | Show a user: suspension state, last IP and federated identities (GitHub login, etc.)      |
| `faable auth users suspend`        | Suspend users by id or email — bulk via args or stdin                                     |
| `faable auth users reinstate`      | Reinstate suspended users by id or email — bulk via args or stdin                         |
| `faable auth users password-setup` | Send a user the email (or code) to set or reset their password                            |
| `faable auth sessions list`        | A user's sessions: devices, IP, last seen                                                 |
| `faable auth sessions revoke`      | End sessions — one, or every active one of a user (`--user`)                              |
| `faable auth connections list`     | The tenant's login methods                                                                |
| `faable auth actions list`         | List login-flow actions                                                                   |
| `faable auth actions get`          | Show an action (`--code` prints the source)                                               |
| `faable auth actions create`       | Create an action from a JS file                                                           |
| `faable auth actions update`       | Update an action in place (`-f` code, `--name`, `--order`, `--enabled`)                   |
| `faable auth actions rm`           | Delete an action (confirmation, `--yes`)                                                  |
| `faable auth clients list`         | List OAuth clients                                                                        |
| `faable auth clients get`          | Show a client (`--secret` reveals the secret)                                             |
| `faable auth clients create`       | Create a client (prints id + secret once)                                                 |
| `faable auth clients rm`           | Delete a client (confirmation, `--yes`)                                                   |
| `faable auth logs list`            | Filter the audit log (type, status, origin, user or email, dates; `--expand-user`)        |
| `faable auth logs get`             | Show one audit entry with its data payload                                                |
