---
title: Faable CLI
description: Master the Faable CLI to manage and deploy your applications from the terminal. Learn about installation, authentication, and deployment workflows.
---

# Faable CLI

The Faable CLI (`@faable/faable`) is your command-line interface for managing and deploying applications on the Faable platform — Node.js (Next.js, Express, …), Python (Django, FastAPI, Flask), or your own Dockerfile. Deploy, manage secrets, and attach custom domains without leaving the terminal.

> [!NOTE]
> While the Faable CLI is designed to support both **Faable Auth** and **Faable Deploy**, current functionality is primarily focused on deployment features.

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
- **Locally**: from the app saved by `faable deploy link` (in `faable.json`), or — if the repo was connected in the dashboard — by matching your git origin remote against your apps' linked repositories.

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
faable deploy logs -d deployment_a1b2c3   # scope to one deployment
```

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

## Command Reference

| Command                       | Description                                       |
| :---------------------------- | :------------------------------------------------ |
| `faable login`                | Authenticate with Faable                          |
| `faable whoami`               | Show current user                                 |
| `faable logout`               | End the local session                             |
| `faable deploy`               | Deploy project to production                      |
| `faable deploy trigger`       | Build the repo HEAD server-side (no upload)       |
| `faable deploy redeploy`      | Retry a failed deployment from its source         |
| `faable deploy status`        | What is live: phase, URL, stack, latest deploy    |
| `faable deploy logs`          | Runtime logs (`--build` for build output)         |
| `faable deploy deployments`   | Recent deployments with phases and commits        |
| `faable deploy list`          | List your apps                                    |
| `faable deploy open`          | Open the live app (`--dashboard` for the console) |
| `faable deploy link`          | Link directory to a Faable app                    |
| `faable deploy secrets list`  | List app secrets (masked, `--show`)               |
| `faable deploy secrets set`   | Set secrets as `KEY=VALUE` pairs                  |
| `faable deploy secrets rm`    | Remove a secret by name                           |
| `faable deploy domains list`  | List custom domains and their DNS state           |
| `faable deploy domains add`   | Add a domain (prints the CNAME to set)            |
| `faable deploy domains check` | DNS verification diagnostic for a domain          |
| `faable deploy domains rm`    | Remove a domain (confirmation, `--yes`)           |
