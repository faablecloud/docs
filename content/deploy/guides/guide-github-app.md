---
schema: faq
title: Deploy a GitHub App
description: Host a GitHub App on Faable Deploy from GitHub, in Node.js or Python. Webhook signature verification with X-Hub-Signature-256, the JWT to installation-token dance, storing a multi-line PEM private key as a secret, delivery redelivery and idempotency, the $PORT contract. 100% European hosting.
---

# Deploy a GitHub App 🐙

**A GitHub App is a webhook receiver that can also call back into the GitHub API as itself — and both halves are an ordinary web server.** Push a repo and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and puts a [WAF](../security-waf.md) in front of it. GitHub requires a public HTTPS URL to deliver events; you have one from the first deploy.

This guide covers **Node.js** and **Python**.

## What makes a GitHub App different

Every other guide in this series verifies a signature and answers. A GitHub App does that too — `X-Hub-Signature-256`, HMAC-SHA256 over the raw body, exactly like the [WhatsApp](guide-whatsapp-bot.md) one. If that were all, this page would be short.

The difference is **authentication in the other direction**. When your app wants to comment on a pull request, it is not using a personal access token. It goes through three steps:

1. **Sign a JWT** with your App's private key (RS256, valid for at most 10 minutes). This proves you are the App.
2. **Exchange it for an installation access token** — `POST /app/installations/{installation_id}/access_tokens` — which is scoped to the one account that installed you.
3. **Call the API with that token.** It expires after **one hour**, so it is fetched when needed, not stored in config.

The installation id arrives inside every webhook payload (`installation.id`), so the loop closes naturally: an event tells you what happened and, in the same breath, which installation to authenticate as.

## Serve on `$PORT`, and answer quickly

Faable assigns your app a port and passes it as the `PORT` environment variable — bind `0.0.0.0` and read it.

GitHub gives a webhook delivery **10 seconds** before it counts as failed. Acknowledge first and do the work afterwards; the same shape as every other webhook in these guides.

## Storing the private key

The App's private key is a **multi-line PEM**, which is the one thing about this setup that usually needs a workaround elsewhere. It does not here — quoted values may span lines:

```bash
faable deploy secrets set GITHUB_APP_PRIVATE_KEY="$(cat your-app.private-key.pem)"
```

Or in a `.env` you pass with `faable deploy secrets set --env-file`, with the value quoted across lines:

```dotenv
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEow...
-----END RSA PRIVATE KEY-----"
```

Both work, and there is no need to base64-encode the key first. The other two secrets are ordinary:

```bash
faable deploy secrets set \
  GITHUB_APP_ID=123456 \
  GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

The **App ID** is on your App's settings page, the **private key** is generated there (you get one chance to download it), and the **webhook secret** is a random string you choose and paste into the same page. See [Environment & Releases](../environment.mdx) for the variables Faable injects for you.

## Node.js

`@octokit/app` handles the JWT and the installation-token exchange for you — it is doing the three steps above, just not in your code.

`package.json`:

```json
{
  "name": "github-app",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@octokit/app": "^15.1.0",
    "express": "^4.19.2"
  }
}
```

`server.js`:

```js
import { App } from '@octokit/app'
import { createNodeMiddleware } from '@octokit/webhooks'
import express from 'express'

const { PORT, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET } =
  process.env

const githubApp = new App({
  appId: GITHUB_APP_ID,
  privateKey: GITHUB_APP_PRIVATE_KEY, // the PEM, newlines and all
  webhooks: { secret: GITHUB_WEBHOOK_SECRET }
})

// `octokit` here is already authenticated as the installation that sent the
// event — the JWT and the one-hour token were fetched behind the scenes.
githubApp.webhooks.on('issues.opened', async ({ octokit, payload }) => {
  await octokit.rest.issues.createComment({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.issue.number,
    body: 'Thanks for opening this — someone will take a look.'
  })
})

githubApp.webhooks.onError(err => console.error('webhook error:', err))

const app = express()

// The middleware needs the raw body to check the signature, so mount it
// before any express.json().
app.use(createNodeMiddleware(githubApp.webhooks, { path: '/github/webhook' }))
app.use(express.json())

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))
```

## Python

Here the three steps are explicit, which is worth seeing once.

`requirements.txt`:

```txt
Flask>=3.0
PyJWT[crypto]>=2.9
requests>=2.32
gunicorn
```

`app.py` — the builder finds `app = Flask(...)` and starts it with `gunicorn app:app --bind 0.0.0.0:$PORT`:

```python
import hashlib
import hmac
import os
import time

import jwt
import requests
from flask import Flask, request

app = Flask(__name__)

APP_ID = os.environ["GITHUB_APP_ID"]
PRIVATE_KEY = os.environ["GITHUB_APP_PRIVATE_KEY"]
WEBHOOK_SECRET = os.environ["GITHUB_WEBHOOK_SECRET"]
API = "https://api.github.com"


def is_from_github() -> bool:
    # request.get_data() is the raw body — the signature covers those bytes.
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), request.get_data(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(
        expected, request.headers.get("X-Hub-Signature-256", "")
    )


def app_jwt() -> str:
    """Step 1: prove we are the App. Backdate `iat` to survive clock skew."""
    now = int(time.time())
    return jwt.encode(
        {"iat": now - 60, "exp": now + 540, "iss": APP_ID},
        PRIVATE_KEY,
        algorithm="RS256",
    )


def installation_token(installation_id: int) -> str:
    """Step 2: swap the JWT for a token scoped to one installation (1 hour)."""
    res = requests.post(
        f"{API}/app/installations/{installation_id}/access_tokens",
        headers={
            "Authorization": f"Bearer {app_jwt()}",
            "Accept": "application/vnd.github+json",
        },
        timeout=10,
    )
    res.raise_for_status()
    return res.json()["token"]


@app.post("/github/webhook")
def webhook():
    if not is_from_github():
        return "", 401

    event = request.headers.get("X-GitHub-Event")
    payload = request.get_json(silent=True) or {}

    # GitHub sends this once when you save the webhook URL.
    if event == "ping":
        return "", 200

    if event == "issues" and payload.get("action") == "opened":
        # Step 3: call the API as the installation that sent this event.
        token = installation_token(payload["installation"]["id"])
        repo = payload["repository"]
        requests.post(
            f"{API}/repos/{repo['full_name']}/issues/"
            f"{payload['issue']['number']}/comments",
            headers={"Authorization": f"Bearer {token}"},
            json={"body": "Thanks for opening this — someone will take a look."},
            timeout=10,
        )

    return "", 200


@app.get("/healthz")
def healthz():
    return {"ok": True}
```

Cache the installation token if you handle many events — it is good for an hour, and minting one per webhook is a wasted round trip on every delivery.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

## Register it with GitHub

In **Settings → Developer settings → GitHub Apps → New GitHub App**:

- **Webhook URL**: `https://<app>.faable.link/github/webhook`
- **Webhook secret**: the same value you set as `GITHUB_WEBHOOK_SECRET`
- **Permissions**: only what you use — for the example above, _Issues: Read & write_
- **Subscribe to events**: again only what you handle, e.g. _Issues_

Save, generate a private key, then **Install App** on an account or organisation. GitHub sends a `ping` immediately; a `200` on it means the wiring is right.

A [custom domain](../domains/custom-domain.md) works identically — use that URL instead.

### Redeliver instead of guessing

Under **Advanced → Recent Deliveries** GitHub shows every request it sent, the exact payload and your response — with a **Redeliver** button. That is the fastest debugging loop you will get for a webhook: fix, deploy, redeliver the same event. It also means you do not need to reproduce anything by hand to test.

Deliveries carry `X-GitHub-Delivery`, a UUID that stays the same across redeliveries — the right key if you need to make a handler idempotent (see [the Stripe guide](guide-stripe-webhooks.md), where that matters more).

## What sleeping does and doesn't break

After 30 minutes with no requests on the Free plan — 2 hours on Hobby and Pro — your app scales to zero. The next webhook wakes it. What that means in practice:

- **The first delivery after a sleep is slower** — the container starts up. It fits comfortably inside GitHub's 10-second window, but keep boot work light and don't mint tokens at import time.
- **A cached installation token is gone.** That is harmless — it is a cache, and a fresh one is two HTTP calls away. What matters is not treating it as configuration.
- **Timers don't fire while asleep.** A nightly stale-issue sweep needs an external trigger hitting an endpoint, not an in-process `setInterval`.

## Troubleshooting

- **Every delivery shows `401` in Recent Deliveries** — the webhook secret in GitHub and `GITHUB_WEBHOOK_SECRET` differ, or the body was parsed before verification. Mount the webhook route before any JSON parser.
- **`'Could not deserialize key data'` or `'Invalid key format'` at boot** — the PEM lost its newlines. Set it with `"$(cat key.pem)"`, or quote it across lines in the `.env`; don't paste it as a single line.
- **`401 A JWT could not be decoded`** — the JWT is expired or its `iat` is in the future. `exp` must be within 10 minutes and `iat` should be backdated ~60 seconds against clock skew.
- **`404` calling the API with a valid token** — the installation token is scoped to one account, and the App may not be installed on that repository, or lacks the permission. Permissions added after installation need to be accepted by the installer.
- **`ping` works, nothing else arrives** — the App is not subscribed to that event, or is not installed on the repository.
- **Requests time out** — the server binds a hardcoded port instead of `$PORT`, or listens on `127.0.0.1` instead of `0.0.0.0`.

## FAQ

### Can I host a GitHub App on Faable Deploy?

Yes. A GitHub App is a webhook receiver plus API calls, which is an ordinary web server. Push a Node.js or Python repo — no Dockerfile, no YAML — and it gets the public HTTPS URL with a valid certificate that GitHub requires for a webhook.

### How do I store a GitHub App private key as an environment variable?

Set it directly, newlines included — `faable deploy secrets set GITHUB_APP_PRIVATE_KEY="$(cat key.pem)"`. Faable's secrets accept multi-line values, and in a `.env` file a quoted value may span lines, so there is no need to base64-encode the PEM first.

### How does a GitHub App authenticate to the API?

In three steps: sign a JWT with the App's private key (RS256, at most 10 minutes), exchange it at `POST /app/installations/{installation_id}/access_tokens` for an installation access token, then call the API with that token. The token lasts one hour, and the installation id comes in the webhook payload.

### How do I verify a GitHub webhook signature?

HMAC-SHA256 the raw request body with your webhook secret and compare it in constant time to the `X-Hub-Signature-256` header, which is prefixed `sha256=`. Verify before parsing — the signature covers the exact bytes GitHub sent.

### How do I debug a GitHub App webhook that isn't working?

Use **Advanced → Recent Deliveries** in the App's settings: it shows each request, its payload and your response, and lets you redeliver the same event after a fix. It is faster than trying to reproduce the trigger.

### Which port should my GitHub App listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it and routes public HTTPS traffic to it.

## Related

- [Deploy a Stripe Webhook Endpoint](guide-stripe-webhooks.md) — the same shape, with idempotency as the main subject
- [Deploy a Slack App](guide-slack-bot.md) · [Deploy a Discord Bot](guide-discord-bot.md) · [Deploy a Telegram Bot](guide-telegram-bot.md) · [Deploy a WhatsApp Bot](guide-whatsapp-bot.md)
- [Deploy from GitHub](../../deploy/get-started.md) — how Faable itself deploys your repository
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules and the `$PORT` contract
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
