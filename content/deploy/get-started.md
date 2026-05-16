---
title: Get Started
description: Deploy your first app on Faable Deploy in minutes — push to GitHub, run a workflow, and serve at <app>.faable.link with free SSL.
---

# Get Started with Faable Deploy

Faable Deploy is a zero-config CI/CD platform for frontends and backends. Your code runs in Linux containers, gets a public URL with free automatic SSL, and a built-in Web Application Firewall — no infrastructure to manage.

## How Faable Deploy is structured

Four concepts model the whole product:

- **Account** — your billing and team boundary on Faable.
- **Apps** — one app per repo (or one per environment, e.g. `staging` / `production`). Each app gets `<app>.faable.link` plus optional [custom domains](domains/custom-domain.md).
- **Instances** — the Linux containers your app runs on. Pick a size from the [catalog](pricing.md#compute-catalog) (`bi.xs` through `bi.2xlarge`).
- **CI** — GitHub Actions is the recommended way to deploy; the CLI is available for ad-hoc deploys.

## Prerequisites

1. Create an account on the **[Faable Dashboard](https://dashboard.faable.com)**.
2. Create a **Project** and an **App** inside it. Note the **App name**.
3. Have a Git repository ready (Node.js, Go, Python, static frontend — anything that runs in a container).

## Deploy your first app (recommended: GitHub Actions)

Faable Deploy integrates with **GitHub Actions** via OpenID Connect — no API tokens to rotate. Drop a workflow file in your repo and every push to your release branch deploys automatically.

Create `.github/workflows/deploy.yaml`:

```yaml
name: Deploy to Faable
on:
  push:
    branches: [main]
permissions:
  id-token: write          # required for OIDC auth against Faable
  contents: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
      - run: npm ci
      - run: npx @faable/faable@latest deploy
```

Commit and push to `main`. When the workflow finishes:

🌍 Your app is live at `https://<app_name>.faable.link`.

> [!TIP]
> If your `package.json` defines a `build` script, Faable runs it automatically before deployment. For multi-environment setups (staging/preview/production) and custom build commands, see [GitHub Actions](github-actions.md).

## Alternative — deploy from your laptop with the CLI

For ad-hoc deploys (local testing, debugging) install the CLI:

```bash
npm i -g @faable/faable
faable login
faable deploy <app_name>
```

Both paths produce the same result and can coexist on the same app.

## What's next

| Topic | What you'll learn |
|---|---|
| **[GitHub Actions](github-actions.md)** | Multi-environment deploys, custom build scripts, secrets. |
| **[Runtime](runtime.md)** | Supported Node versions, environment variables, the app restart policy. |
| **[Custom Domains](domains/custom-domain.md)** | Map `app.example.com` to your app with auto-renewed SSL. |
| **[Security & WAF](security-waf.md)** | The built-in Web Application Firewall that ships with every app. |
| **[Express guide](guides/guide-express.md)** | Deploy an Express backend end-to-end. |
| **[CLI reference](../cli.md)** | Every flag and command the CLI supports. |

## Pricing & limits

See **[Deploy pricing](pricing.md)** for the instance catalog and bandwidth allowances, and the [unified platform pricing](../platform/pricing.md) for plans and support tiers.
