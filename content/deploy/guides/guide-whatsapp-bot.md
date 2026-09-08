---
schema: faq
title: Deploy a WhatsApp Bot
description: Host a WhatsApp bot on Faable Deploy from GitHub, in Node.js or Python. Webhook setup for the WhatsApp Cloud API, signature verification on the raw body, retries and de-duplication, permanent access tokens, the $PORT contract, secrets, and why webhooks beat long-polling on a scale-to-zero platform. 100% European hosting.
---

# Deploy a WhatsApp Bot 💬

**A WhatsApp bot is an HTTPS webhook — and that is exactly what Faable Deploy runs best.** Push a repo with a small web server in it, and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and keeps it behind a [WAF](../security-waf.md). Meta requires a public HTTPS endpoint with a trusted certificate to deliver messages; you get one on the first deploy, with nothing to configure.

This guide covers the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) — Meta's official webhook product — in **Node.js** and **Python**.

## Webhooks, not long-polling

This is the one architectural decision that matters, so make it first.

Faable Deploy scales an app to zero once no HTTP request has arrived for a while — **30 minutes on the Free plan, 2 hours on Hobby and Pro** — and wakes it on the next one. That model fits a webhook bot perfectly: WhatsApp delivers a message, the request wakes your app, your app replies. Between conversations it costs you nothing, and on Hobby and Pro a bot with steady traffic never stops at all.

It does **not** fit a bot that holds a socket open and polls — the pattern used by unofficial libraries like Baileys or `whatsapp-web.js`, which pair with a phone and keep a WebSocket alive:

|                              | Cloud API webhook                     | Socket / pairing libraries               |
| :--------------------------- | :------------------------------------ | :--------------------------------------- |
| How messages arrive          | Inbound HTTPS POST                    | Long-lived outbound WebSocket            |
| Survives scale-to-zero       | Yes — the request wakes the app       | No — the socket dies when the app sleeps |
| Session state                | Stateless, a token in the environment | An auth folder on disk that must persist |
| Officially supported by Meta | Yes                                   | No                                       |

Faable's filesystem is **ephemeral**: every deploy starts from a fresh container, and a sleeping app loses whatever it wrote locally. A pairing library stores its session in a folder, so it re-pairs on every deploy and drops off whenever the app sleeps — and because it receives no inbound requests, nothing keeps it awake on any plan. If you already have a bot built this way, move it to the Cloud API before you deploy it here — otherwise you are fighting the platform.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

- **Node.js** — a `package.json` with a `start` script. Supported versions: 20, 22 and 24 — pin one with `engines.node`.
- **Python** — a `requirements.txt`, `pyproject.toml` or `Pipfile`, plus a module defining your app object (`app.py` with `app = Flask(...)` is found automatically). Supported versions: 3.10, 3.11, 3.12 and 3.13.

Both are zero-config. No Dockerfile, no YAML.

## Serve on `$PORT`

Faable assigns your app a port and passes it as the `PORT` environment variable. Bind `0.0.0.0` and read it — a hardcoded port means requests time out and Meta marks your webhook as failing.

## Verify the signature, on the raw body

Meta signs every webhook delivery with your app's **App secret**: the header `X-Hub-Signature-256` carries `sha256=<HMAC-SHA256 of the request body>`. Verify it, or anyone who finds your URL can inject fake messages.

The one thing that breaks this for most people: **the signature is over the exact bytes Meta sent**. If your framework parses the JSON and you hash the re-serialised object, key order and whitespace differ and the check fails forever. Both examples below keep the raw body and hash that.

Compare in constant time (`crypto.timingSafeEqual`, `hmac.compare_digest`) — a plain `===` leaks timing.

## Node.js

Two files. `package.json`:

```json
{
  "name": "whatsapp-bot",
  "type": "module",
  "engines": { "node": "22.x" },
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
```

And `server.js`:

```js
import express from 'express'
import crypto from 'node:crypto'

// Fail loudly at boot if a secret is missing — a bot that starts without its
// token only fails later, on the first message, with a confusing 401 from Meta.
for (const name of [
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID'
]) {
  if (!process.env[name]) throw new Error(`Missing env var ${name}`)
}

const {
  PORT,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_APP_SECRET,
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID
} = process.env

const app = express()

// Keep the raw body around — the signature is computed over the exact bytes
// Meta sent, not over the re-serialized JSON.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf
    }
  })
)

// Meta calls this once, when you save the webhook URL in the app dashboard.
// It expects hub.challenge echoed back as a plain-text 200.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge'])
  }
  res.sendStatus(403)
})

// Every inbound message — and every delivery/read status — arrives here.
app.post('/webhook', async (req, res) => {
  if (!isFromMeta(req)) return res.sendStatus(401)

  // Acknowledge first. Meta retries anything that doesn't get a 200, with
  // decreasing frequency for up to 7 days, so a slow reply turns one message
  // into several.
  res.sendStatus(200)

  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (message?.type === 'text') {
    await reply(message.from, `You said: ${message.text.body}`)
  }
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

function isFromMeta(req) {
  const received = Buffer.from(req.get('x-hub-signature-256') ?? '')
  const expected = Buffer.from(
    'sha256=' +
      crypto
        .createHmac('sha256', WHATSAPP_APP_SECRET)
        .update(req.rawBody)
        .digest('hex')
  )
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  )
}

async function reply(to, body) {
  const res = await fetch(
    `https://graph.facebook.com/v26.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
      })
    }
  )
  if (!res.ok) console.error('send failed', res.status, await res.text())
}

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))
```

## Python

`requirements.txt`:

```txt
Flask>=3.0
requests>=2.32
```

And `app.py` — the builder finds `app = Flask(...)`, installs `gunicorn` if it's not in your dependencies, and starts it with `gunicorn app:app --bind 0.0.0.0:$PORT`:

```python
import hashlib
import hmac
import os

import requests
from flask import Flask, request

app = Flask(__name__)

# os.environ[...] raises KeyError at import time if a secret is missing, so a
# misconfigured deploy fails at boot with the variable name in the logs.
VERIFY_TOKEN = os.environ["WHATSAPP_VERIFY_TOKEN"]
APP_SECRET = os.environ["WHATSAPP_APP_SECRET"]
TOKEN = os.environ["WHATSAPP_TOKEN"]
PHONE_NUMBER_ID = os.environ["WHATSAPP_PHONE_NUMBER_ID"]

GRAPH_URL = f"https://graph.facebook.com/v26.0/{PHONE_NUMBER_ID}/messages"


@app.get("/webhook")
def verify():
    """Meta calls this once, when you save the webhook URL."""
    if (
        request.args.get("hub.mode") == "subscribe"
        and request.args.get("hub.verify_token") == VERIFY_TOKEN
    ):
        return request.args.get("hub.challenge", ""), 200
    return "", 403


@app.post("/webhook")
def receive():
    if not is_from_meta(request):
        return "", 401

    payload = request.get_json(silent=True) or {}
    try:
        message = payload["entry"][0]["changes"][0]["value"]["messages"][0]
    except (KeyError, IndexError):
        # Status callbacks (sent, delivered, read) land here too — nothing to answer.
        return "", 200

    if message.get("type") == "text":
        send_text(message["from"], f"You said: {message['text']['body']}")

    return "", 200


@app.get("/healthz")
def healthz():
    return {"ok": True}


def is_from_meta(req) -> bool:
    # request.get_data() is the raw body — do not rebuild it from request.json.
    expected = "sha256=" + hmac.new(
        APP_SECRET.encode(), req.get_data(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, req.headers.get("X-Hub-Signature-256", ""))


def send_text(to: str, body: str) -> None:
    r = requests.post(
        GRAPH_URL,
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        },
        timeout=10,
    )
    if not r.ok:
        app.logger.error("send failed %s %s", r.status_code, r.text)
```

Meta retries any delivery that doesn't get a `200`, and the retries produce **duplicate notifications**. If answering takes longer than a couple of seconds — an LLM call, an external API — hand the work to a thread or a queue and return `200` immediately. If a duplicate would do harm (charging twice, sending the same reply twice), remember the `message.id` you've already handled in a database; an in-memory set is lost on sleep and on every deploy.

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

Never commit tokens. Set them once, and they are available as environment variables on the next deploy:

```bash
faable deploy secrets set \
  WHATSAPP_VERIFY_TOKEN=a-string-you-invent \
  WHATSAPP_APP_SECRET=… \
  WHATSAPP_TOKEN=… \
  WHATSAPP_PHONE_NUMBER_ID=…
```

Where each one comes from:

- **`WHATSAPP_VERIFY_TOKEN`** — any string you make up; you type the same one into Meta's dashboard.
- **`WHATSAPP_APP_SECRET`** — your Meta app's **App secret**, under App settings → Basic. It signs the webhooks.
- **`WHATSAPP_PHONE_NUMBER_ID`** — under WhatsApp → API setup.
- **`WHATSAPP_TOKEN`** — the access token the bot sends _with_. The token shown under WhatsApp → API setup is **temporary and expires after 24 hours**; it's fine for the first test and wrong for production. Create a **System User** in Meta Business settings, assign it the WhatsApp app with the `whatsapp_business_messaging` permission, and generate a token with no expiry. Set that one.

See [Environment & Releases](../environment.mdx) for the variables Faable injects for you, and the [CLI reference](../../cli.md#secrets) for loading them from a `.env` file.

## Point Meta at your app

In your Meta app, under **WhatsApp → Configuration → Webhook**:

- **Callback URL**: `https://<app>.faable.link/webhook`
- **Verify token**: the value you set as `WHATSAPP_VERIFY_TOKEN`

Save. Meta immediately sends the `GET /webhook` verification request; the handler above answers it. Then subscribe to the **messages** field, and your bot is live — send it a message from the test number and watch the reply come back.

A [custom domain](../domains/custom-domain.md) works the same way, with its certificate issued automatically — just use it in the callback URL instead.

## What sleeping does and doesn't break

After 30 minutes with no requests on the Free plan — 2 hours on Hobby and Pro — your bot scales to zero. The next WhatsApp message wakes it. What you should know:

- **The first message after a sleep is slower** — the container has to start, a cold start of a few seconds. Meta's retries absorb this, but keep boot work light: connect to databases lazily, not at import time.
- **In-memory state is gone.** Conversation context held in a module-level dictionary disappears on sleep and on every deploy. Put it in a database — see [Databases](databases.md).
- **Scheduled work does not run while asleep.** A bot that also needs to send reminders on a timer needs an external trigger hitting an endpoint, not an in-process `setInterval`.

## Troubleshooting

- **Meta says "The callback URL or verify token couldn't be validated"** — the `GET /webhook` route isn't returning `hub.challenge` as a plain body with a `200`, or `WHATSAPP_VERIFY_TOKEN` doesn't match what you typed into Meta. Check the deployment logs (`faable deploy logs`); the verification request shows up there.
- **Every message arrives two or three times** — you're doing the work before answering. Send the `200` first, then process, and de-duplicate on `message.id` if it matters.
- **Signature check always fails** — the body was parsed and re-serialized before hashing, or you're hashing with the access token instead of the **App secret**. Hash the raw bytes with the App secret, as both examples do.
- **The bot worked for a day and then every reply fails with `401`** — you're still on the temporary token from API setup. Generate a permanent System User token (see [Set your secrets](#set-your-secrets)).
- **Requests time out** — the server binds a hardcoded port instead of `$PORT`, or listens on `127.0.0.1` instead of `0.0.0.0`.
- **The bot stops responding after a few hours** — you're using a pairing library that keeps a socket open. See [Webhooks, not long-polling](#webhooks-not-long-polling).
- **The app exits right at boot** — a missing secret. The Python example raises `KeyError` at import, and the Node example checks every variable before starting; the logs show which one is missing.

## FAQ

### Can I host a WhatsApp bot on Faable Deploy?

Yes. A WhatsApp Cloud API bot is an HTTPS webhook, and Faable Deploy gives every app a public HTTPS URL with a valid certificate on the first deploy. Push a Node.js or Python repo with a web server in it — no Dockerfile, no YAML, no reverse proxy to configure.

### Do I need a Dockerfile to deploy a WhatsApp bot?

No. Faable detects Node.js from `package.json` and Python from `requirements.txt`, installs your dependencies, and starts the app. A Dockerfile is the escape hatch for stacks the buildpacks don't detect natively, and it requires a paid plan.

### Does a WhatsApp bot keep running when nobody is messaging it?

It scales to zero after 30 minutes of no traffic on the Free plan — 2 hours on Hobby and Pro — and wakes on the next inbound message, so a webhook bot behaves exactly as you'd expect while costing nothing while idle. On Hobby and Pro, a bot people message regularly never stops. A bot that keeps a WebSocket open instead — Baileys, `whatsapp-web.js` — receives no inbound requests at all, so nothing keeps it awake on any plan, which is why the Cloud API is the right fit here.

### Can I use Baileys or whatsapp-web.js on Faable Deploy?

They are a poor fit. Both keep a long-lived socket open and store their pairing session on disk, and Faable's filesystem is ephemeral — the session is lost on every deploy and the socket dies when the app sleeps. Use the official WhatsApp Cloud API webhook instead.

### How do I verify that a webhook really comes from WhatsApp?

Compute HMAC-SHA256 of the **raw request body** with your Meta App secret, prefix it with `sha256=`, and compare it in constant time to the `X-Hub-Signature-256` header. Hashing a re-serialised JSON object, or using the access token as the key, fails every time.

### Why does my WhatsApp bot stop replying after 24 hours?

The access token shown in Meta's API setup page is temporary and expires after 24 hours. Create a System User in Business settings and generate a permanent token for production.

### How do I avoid answering the same WhatsApp message twice?

Return `200` before doing any work — Meta retries deliveries it doesn't get a `200` for, and the retries are duplicates. If duplicates would still hurt, store the `message.id` of each notification you've processed in a database and skip repeats.

### How do I keep my WhatsApp access token out of my repo?

Set it as a secret with `faable deploy secrets set WHATSAPP_TOKEN=…`, or from the dashboard, and read it from the environment. Secrets are injected at runtime and never live in your git history or the build image.

### Which port should my WhatsApp bot listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it for you and routes public HTTPS traffic to it.

## Related

- [Deploy a Telegram Bot](guide-telegram-bot.md) — the same shape, with Telegram's webhook API
- [Deploy a Discord Bot](guide-discord-bot.md) — the same shape, over Discord's HTTP interactions
- [Deploy a Slack App](guide-slack-bot.md) — the same shape, over Slack's Request URL
- [Deploy a Stripe Webhook Endpoint](guide-stripe-webhooks.md) — webhooks with idempotency
- [Deploy an LLM streaming app](guide-llm-streaming.md) — if the bot's replies come from a model
- [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md) · [Deploy FastAPI](guide-fastapi.md)
- [Databases & SQLite](databases.md) — where to keep conversation state and processed message ids
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules and the `$PORT` contract
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
