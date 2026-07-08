---
title: Get Started
description: Deploy your first app on Faable Deploy in minutes — push to GitHub, run a workflow, and serve at <app>.faable.link with free SSL.
---

# Get Started with Faable Deploy

Faable Deploy is a zero-config CI/CD platform for frontends and backends. Your code runs in Linux containers, gets a public URL with free automatic SSL, and a built-in Web Application Firewall — no infrastructure to manage.

> New to the concept? Read [What is zero-config CI/CD?](what-is-zero-config-cicd.mdx). Comparing platforms? See [Faable Deploy vs Vercel, Render & Railway](compare.mdx).

## How Faable Deploy is structured

Three concepts model the whole product:

- **Account** — your billing and team boundary on Faable.
- **Apps** — one app per repo (or one per environment, e.g. `staging` / `production`). Each app gets `<app>.faable.link` plus optional [custom domains](domains/custom-domain.md).
- **Instances** — the Linux containers your app runs on. Pick a size from the [catalog](pricing.md#compute-catalog) (`bi.xs` through `bi.2xlarge`).

## Deploy your first app

1. In the **[Faable Dashboard](https://dashboard.faable.com)**, create a **Project** and an **App**.
2. Open the app and click **Link repository**. Pick your GitHub org and repo (install the **Faable GitHub App** if prompted). Faable commits the GitHub Actions workflow to your repo for you.
3. **Push to your release branch.** Your app builds and goes live at `https://<app>.faable.link`.

That's it — no `app_id`, API tokens, or YAML to write. Deploys authenticate via OIDC and resolve the app from the linked repository.

> [!TIP]
> If your `package.json` defines a `build` script, Faable runs it automatically before deployment. For multi-environment setups (staging/preview/production), custom build commands, or writing the workflow yourself, see [GitHub Actions](github-actions.md).

## Deploy from your laptop with the CLI

For ad-hoc deploys (local testing, debugging) install the CLI and log in. Your repository is already connected to the app — you did that in the first step of the app creation form — so the CLI resolves the app automatically:

```bash
npm i -g @faable/faable
faable login
faable deploy    # deploy current repository
```

> [!TIP]
> Got `Request failed with status code 404` on `faable deploy`? The repository isn't linked to any app yet. Link it from the dashboard (**Link repository**) and deploy again.

## What's next

| Topic                                          | What you'll learn                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| **[GitHub Actions](github-actions.md)**        | Multi-environment deploys, custom build scripts, secrets.               |
| **[Runtime](runtime.md)**                      | Supported Node versions, environment variables, the app restart policy. |
| **[Custom Domains](domains/custom-domain.md)** | Map `app.example.com` to your app with auto-renewed SSL.                |
| **[Security & WAF](security-waf.md)**          | The built-in Web Application Firewall that ships with every app.        |
| **[Express guide](guides/guide-express.md)**   | Deploy an Express backend end-to-end.                                   |
| **[CLI reference](../cli.md)**                 | Every flag and command the CLI supports.                                |

## Pricing & limits

See **[Deploy pricing](pricing.md)** for the instance catalog and bandwidth allowances, and the [unified platform pricing](../platform/pricing.md) for plans and support tiers.
