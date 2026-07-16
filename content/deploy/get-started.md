---
title: Get Started
description: Deploy your first app on Faable Deploy in minutes — push to GitHub, run a workflow, and serve at <app>.faable.link with free SSL.
---

# Get Started with Faable Deploy

**Deploy your app straight from Git. No infrastructure to manage. Live in minutes.** Connect your repository, push your code, and Faable detects your framework, builds it, and ships it to a public URL with free automatic SSL.

> Curious what happens after you push? See [How deployment works](how-it-works.mdx). Comparing platforms? See [Faable Deploy vs Vercel, Render & Railway](compare.mdx).

## How Faable Deploy is structured

Three concepts model the whole product:

- **Account** — your billing and team boundary on Faable.
- **Apps** — one app per repo (or one per environment, e.g. `staging` / `production`). Each app gets `<app>.faable.link` plus optional [custom domains](domains/custom-domain.md).
- **Instances** — how much compute your app runs on. Pick a size from the [catalog](pricing.md#compute-catalog) (`bi.xs` through `bi.2xlarge`) — start small and scale up whenever you need to.

## Deploy your first app

1. In the **[Faable Dashboard](https://dashboard.faable.com)**, create a **Project** and an **App**.
2. Open the app and click **Link repository**. Pick your GitHub org and repo (install the **Faable GitHub App** if prompted). Faable connects your repo and sets up automatic deploys for you.
3. **Push to your release branch.** Faable detects your framework, builds your app, and takes it live at `https://<app>.faable.link`.

That's it — nothing to configure, no tokens or YAML to write.

> [!TIP]
> Faable detects your framework automatically and, if your project has a build step, runs it for you before every deploy. Need multi-environment setups (staging/preview/production) or custom build commands? See the [advanced deploy options](github-actions.md).

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
