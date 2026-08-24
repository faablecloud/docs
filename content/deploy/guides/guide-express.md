---
title: Deploy a Node.js Express App
description: Deploy a Node.js Express application to Faable Deploy from GitHub. Zero-config builds, the $PORT contract, environment variables, and 100% European hosting with a built-in WAF.
---

# Deploy a Node.js Express App

**Push your Express project to GitHub and Faable builds and runs it — no Dockerfile, no YAML.** The builder detects Node.js from your `package.json`, installs your dependencies, runs your build step if you have one, and serves the app behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe. Supported Node.js versions: **20, 22 and 24**.

## Give your app a `start` script

Make sure your app has a `start` script inside `package.json`

```json
{
  "name": "app_name",
  "scripts": {
    "start": "<your start script here>"
  }
}
```

## Serve your app at `$PORT`

Start a server that listens on `0.0.0.0` and serves `http` traffic using environment variable `PORT` to configure its port binding. This variable will be automatically configured in Faable Cloud when routing requests to your app.

```js
const express = require('express')

const app = express()

// NOTE: To work on Faable Cloud, use the $PORT environment variable
const port = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen('0.0.0.0', port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your Express repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop, for an ad-hoc deploy:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your app is ready at `https://<app>.faable.link`, with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## Environment variables

Read configuration from `process.env` and set it with the [CLI](../../cli.md#secrets) or the dashboard:

```bash
faable deploy secrets set DATABASE_URL=postgres://… NODE_ENV=production
```

Faable also injects `PORT`, `FAABLE_APP_ID`, `FAABLE_RELEASE` and `FAABLE_GIT_COMMIT`. See [Environment & Releases](../environment.mdx).

## Troubleshooting

- **Requests time out** — the server binds a hardcoded port instead of `process.env.PORT`, or it listens on `127.0.0.1` instead of `0.0.0.0`.
- **Build fails on `npm ci`** — `package-lock.json` is out of sync with `package.json`. Commit an updated lockfile.
- **The app exits right after boot** — a missing environment variable usually throws at startup; check the deployment logs in the dashboard.

## Related

- [What the Builder Expects](../build-requirements.mdx) — detection rules, Node.js versions, the `$PORT` contract
- [Deploy a WhatsApp Bot](guide-whatsapp-bot.md) · [Deploy a Telegram Bot](guide-telegram-bot.md) — webhook bots on this stack
- [Deploy Next.js](guide-next.md) · [Deploy Django](guide-django.md) · [Deploy FastAPI](guide-fastapi.md) · [Deploy Flask](guide-flask.md)
- [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
