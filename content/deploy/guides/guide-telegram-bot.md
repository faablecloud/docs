---
schema: faq
title: Deploy a Telegram Bot
description: Host a Telegram bot on Faable Deploy from GitHub, in Node.js or Python. Webhook setup with setWebhook, secret token verification, the $PORT contract, secrets, and why webhooks beat getUpdates polling on a scale-to-zero platform. 100% European hosting.
---

# Deploy a Telegram Bot 🤖

**Run your Telegram bot in webhook mode and Faable Deploy is all the infrastructure it needs.** Push a repo with a small web server in it and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and puts a [WAF](../security-waf.md) in front of it. Telegram requires HTTPS with a trusted certificate to deliver updates; you have one from the first deploy.

This guide covers **Node.js** and **Python**, both with the plain Bot API — no framework required — plus notes for `grammY`, `Telegraf` and `python-telegram-bot`.

## Webhooks, not `getUpdates`

Make this decision first, because it decides whether your bot works at all.

Faable Deploy scales an app to zero after **two hours without an inbound HTTP request**, and wakes it on the next one. A webhook bot fits that exactly: Telegram POSTs an update, the request wakes your app, your app answers. Idle time is free.

A bot built on `getUpdates` long-polling does the opposite — it makes _outbound_ calls in a loop and receives no inbound traffic at all. Nothing keeps it awake, so after two hours it sleeps and simply stops polling. It also can't be scaled or redeployed cleanly, because Telegram allows only one active `getUpdates` consumer per token.

|                        | `setWebhook`                     | `getUpdates` polling                   |
| :--------------------- | :------------------------------- | :------------------------------------- |
| How updates arrive     | Inbound HTTPS POST from Telegram | Outbound loop from your app            |
| Survives scale-to-zero | Yes — the update wakes the app   | No — polling stops when the app sleeps |
| Cost while idle        | Nothing                          | Constantly running                     |
| Multiple instances     | Fine                             | Conflicts — one consumer per token     |

Every major library supports webhook mode. Use it.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

- **Node.js** — a `package.json` with a `start` script. Supported versions: 20, 22 and 24.
- **Python** — a `requirements.txt`, `pyproject.toml` or `Pipfile`, plus a module defining your app object. Supported versions: 3.10, 3.11, 3.12 and 3.13.

## Serve on `$PORT`

Faable assigns your app a port and passes it as the `PORT` environment variable. Bind `0.0.0.0` and read it — a hardcoded port means Telegram's deliveries time out and it backs off.

## Node.js

`package.json`:

```json
{
  "name": "telegram-bot",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
```

`server.js`:

```js
import express from 'express'

const { PORT, TELEGRAM_TOKEN, TELEGRAM_WEBHOOK_SECRET } = process.env
const API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`

const app = express()
app.use(express.json())

app.post('/telegram/webhook', async (req, res) => {
  // Telegram echoes back the secret you registered with setWebhook. Anyone can
  // find your URL; only Telegram knows this header.
  if (req.get('x-telegram-bot-api-secret-token') !== TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401)
  }

  const message = req.body?.message
  if (!message?.text) return res.sendStatus(200)

  // Answering in the response body saves a round trip — Telegram accepts a
  // method call as the reply to the webhook itself.
  res.json({
    method: 'sendMessage',
    chat_id: message.chat.id,
    text: `You said: ${message.text}`
  })
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))

// For anything you can't answer inline — a slow API call, a second message —
// call the Bot API directly.
export async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}
```

Using **grammY** or **Telegraf** instead? Keep the same shape and mount their webhook callback rather than calling `bot.launch()` or `bot.start()`, which are the long-polling entry points:

```js
// grammY
import { webhookCallback } from 'grammy'

app.use('/telegram/webhook', webhookCallback(bot, 'express'))

// Telegraf
app.use(bot.webhookCallback('/telegram/webhook'))
```

## Python

`requirements.txt`:

```txt
Flask>=3.0
requests>=2.32
gunicorn
```

`app.py` — the builder finds `app = Flask(...)` and starts it with `gunicorn app:app --bind 0.0.0.0:$PORT`:

```python
import os

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

TOKEN = os.environ["TELEGRAM_TOKEN"]
WEBHOOK_SECRET = os.environ["TELEGRAM_WEBHOOK_SECRET"]
API = f"https://api.telegram.org/bot{TOKEN}"


@app.post("/telegram/webhook")
def webhook():
    # Telegram echoes back the secret registered with setWebhook.
    if request.headers.get("X-Telegram-Bot-Api-Secret-Token") != WEBHOOK_SECRET:
        return "", 401

    update = request.get_json(silent=True) or {}
    message = update.get("message")
    if not message or "text" not in message:
        return "", 200

    # Answering in the response body saves a round trip.
    return jsonify(
        method="sendMessage",
        chat_id=message["chat"]["id"],
        text=f"You said: {message['text']}",
    )


@app.get("/healthz")
def healthz():
    return {"ok": True}


def send_message(chat_id: int, text: str) -> None:
    requests.post(f"{API}/sendMessage", json={"chat_id": chat_id, "text": text}, timeout=10)
```

With **python-telegram-bot**, use `run_webhook` and bind the injected port — not `run_polling`:

```python
application.run_webhook(
    listen="0.0.0.0",
    port=int(os.environ["PORT"]),
    url_path="telegram/webhook",
    secret_token=os.environ["TELEGRAM_WEBHOOK_SECRET"],
)
```

Telegram expects an answer within a few seconds and retries with backoff otherwise. If handling an update is slow — an LLM call, an image to render — answer `200` immediately and do the work in a thread or a queue, then send the result with `sendMessage`.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your bot's repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

## Set your secrets

Never commit your bot token — anyone holding it controls your bot:

```bash
faable deploy secrets set \
  TELEGRAM_TOKEN=123456:ABC-… \
  TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

`TELEGRAM_TOKEN` comes from [@BotFather](https://t.me/BotFather). `TELEGRAM_WEBHOOK_SECRET` is a random string you generate — Telegram sends it back on every request so your app can tell real updates from anyone who guessed the URL. See [Environment & Releases](../environment.mdx) for the variables Faable injects for you.

## Register the webhook

Once the app is live, tell Telegram where to deliver updates. This is a one-off `curl`:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/setWebhook" \
  -H 'content-type: application/json' \
  -d '{
    "url": "https://<app>.faable.link/telegram/webhook",
    "secret_token": "<the same TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Check it took, and see whether Telegram is hitting errors:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_TOKEN/getWebhookInfo"
```

`last_error_message` in that response is the fastest way to debug delivery. A [custom domain](../domains/custom-domain.md) works identically — register that URL instead.

## What sleeping does and doesn't break

After two hours with no requests, your bot scales to zero. The next Telegram update wakes it. What that means in practice:

- **The first update after a sleep is slower** — the container starts up. Telegram's retries absorb it, but keep boot work light: open database connections lazily, not at import time.
- **In-memory state is gone.** A conversation step held in a module-level dictionary disappears on sleep and on every deploy. Persist it — see [Databases](databases.md).
- **Timers don't fire while asleep.** A bot that sends a daily digest needs an external trigger hitting an endpoint, not an in-process `setInterval` or `JobQueue`.

## Troubleshooting

- **`getWebhookInfo` shows `last_error_message: Wrong response from the webhook: 401`** — the secret token header doesn't match `TELEGRAM_WEBHOOK_SECRET`. You probably changed the secret without re-running `setWebhook`.
- **Nothing arrives at all** — `setWebhook` was never called, or points at the wrong path. The URL must be the full public HTTPS URL including the route.
- **`Conflict: terminated by other getUpdates request`** — something is still long-polling with the same token. Stop it; `setWebhook` and `getUpdates` are mutually exclusive.
- **Requests time out** — the server binds a hardcoded port instead of `$PORT`, or listens on `127.0.0.1` instead of `0.0.0.0`.
- **The bot answers twice** — you're both replying in the webhook body _and_ calling `sendMessage`. Pick one.
- **The app exits right at boot** — a missing secret. `os.environ["…"]` throws at import time; the logs name it.

## FAQ

### Can I host a Telegram bot on Faable Deploy?

Yes. Run the bot in webhook mode and it's an ordinary web server. Faable Deploy gives every app a public HTTPS URL with a valid certificate on the first deploy, which is exactly what Telegram's `setWebhook` requires. Push a Node.js or Python repo — no Dockerfile, no YAML.

### Should my Telegram bot use webhooks or getUpdates polling on Faable?

Webhooks. Faable scales apps to zero after two hours without an inbound request, and a polling bot receives no inbound traffic, so it sleeps and stops working. A webhook bot is woken by each update and costs nothing while idle.

### Do I need a Dockerfile to deploy a Telegram bot?

No. Faable detects Node.js from `package.json` and Python from `requirements.txt`, installs your dependencies and starts the app. A Dockerfile is the escape hatch for stacks the buildpacks don't detect natively, and it requires a paid plan.

### How do I keep my Telegram bot token out of my repo?

Set it as a secret with `faable deploy secrets set TELEGRAM_TOKEN=…`, or from the dashboard, and read it from the environment. Secrets are injected at runtime and never enter your git history or the build image.

### How do I verify that an update really came from Telegram?

Pass a `secret_token` when you call `setWebhook`. Telegram sends it back on every delivery in the `X-Telegram-Bot-Api-Secret-Token` header; reject any request whose header doesn't match.

### Which port should my Telegram bot listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it and routes public HTTPS traffic to it.

## Related

- [Deploy a WhatsApp Bot](guide-whatsapp-bot.md) — the same shape, with the WhatsApp Cloud API
- [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md) · [Deploy FastAPI](guide-fastapi.md)
- [Databases & SQLite](databases.md) — where to keep conversation state
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules and the `$PORT` contract
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
