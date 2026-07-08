---
title: Faable CLI
description: Master the Faable CLI to manage and deploy your applications from the terminal. Learn about installation, authentication, and deployment workflows.
---

# Faable CLI

The Faable CLI (`@faable/faable`) is your command-line interface for managing and deploying applications on the Faable platform. Whether you are building with Node.js or Docker, the CLI streamlines your development workflow from initialization to production.

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

Deploying your application is the core feature of the Faable CLI. It handles runtime detection (Node.js or Docker) and manages the build and upload process.

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

1. **Runtime Detection**: The CLI checks for a `package.json` (Node.js) or `Dockerfile`.
2. **Environment Check**: Ensures your environment is ready for the build process.
3. **Build**:
   - For **Node.js**: The CLI prepares the production build.
   - For **Docker**: The CLI builds the image using your local Docker engine.
4. **Upload**: The built artifact or image is pushed to the Faable registry.
5. **Release**: A new deployment is created and goes live at your application URL.

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

## Command Reference

| Command                       | Description                              |
| :---------------------------- | :--------------------------------------- |
| `faable login`                | Authenticate with Faable                 |
| `faable whoami`               | Show current user                        |
| `faable logout`               | End the local session                    |
| `faable deploy`               | Deploy project to production             |
| `faable deploy link`          | Link directory to a Faable app           |
| `faable deploy secrets list`  | List app secrets (masked, `--show`)      |
| `faable deploy secrets set`   | Set secrets as `KEY=VALUE` pairs         |
| `faable deploy secrets rm`    | Remove a secret by name                  |
