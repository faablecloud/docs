---
schema: faq
title: Deploy a Slack App
description: Host a Slack app or bot on Faable Deploy from GitHub, in Node.js or Python. Request URL setup, v0 signing-secret verification on the raw body, url_verification, slash commands, response_url for slow work, retry de-duplication, the $PORT contract and secrets — and why Socket Mode does not fit a scale-to-zero platform. 100% European hosting.
---

# Deploy a Slack App 💼

**A Slack app that listens over HTTP is an ordinary web server — and that is exactly what Faable Deploy runs best.** Push a repo with a small server in it and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and puts a [WAF](../security-waf.md) in front of it. Slack requires a public HTTPS Request URL with a trusted certificate; you have one from the first deploy.

This guide covers **Node.js** and **Python** with the plain Slack HTTP API — no framework required.

## HTTP Request URL, not Socket Mode

Make this decision first, because it decides whether your app works at all.

Slack gives you two ways to receive events, and they are not interchangeable:

- **A Request URL.** Slack `POST`s every event, slash command and button click to a URL you own. Traffic is **inbound**, so the request itself wakes your app.
- **Socket Mode.** Your app opens a persistent WebSocket _out_ to Slack and holds it open. It exists so you can develop behind a firewall without a public URL.

Faable Deploy scales an app to zero once no HTTP request has arrived for a while — **30 minutes on the Free plan, 2 hours on Hobby and Pro** — and wakes it on the next one. A Request URL fits that exactly: somebody runs your command, the request wakes your app, your app answers. Idle time is free, and an app your team actually uses never sleeps at all.

Socket Mode does the opposite. The connection is outbound, so **no inbound request ever arrives** — nothing keeps the app awake, and it sleeps as soon as that window elapses **on any plan**, dropping the socket.

|                        | Request URL (HTTP)                    | Socket Mode (WebSocket)                 |
| :--------------------- | :------------------------------------ | :-------------------------------------- |
| How events arrive      | Inbound HTTPS POST from Slack         | Outbound socket your app holds open     |
| Survives scale-to-zero | Yes — the event wakes the app         | No — nothing keeps the app awake        |
| Cost while idle        | Nothing                               | Constantly running                      |
| Needs a public URL     | Yes — you get one on the first deploy | No — which is the only reason it exists |

If you use **Bolt**, this is the `socketMode: true` flag (JS) or `SocketModeHandler` (Python). Leave it off and let Bolt run its HTTP receiver.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

- **Node.js** — a `package.json` with a `start` script. Supported versions: 20, 22 and 24.
- **Python** — a `requirements.txt`, `pyproject.toml` or `Pipfile`, plus a module defining your app object. Supported versions: 3.10, 3.11, 3.12 and 3.13.

## Serve on `$PORT`

Faable assigns your app a port and passes it as the `PORT` environment variable. Bind `0.0.0.0` and read it — a hardcoded port means Slack's deliveries time out and it disables your Request URL.

## Verify the signature, on the raw body

Slack signs every request with your **Signing Secret**. The rules that matter:

- The signature base string is **`v0:{timestamp}:{raw body}`**, HMAC-SHA256 with the signing secret, compared against the `X-Slack-Signature` header (which is prefixed `v0=`).
- **You need the raw body.** Slash commands arrive `application/x-www-form-urlencoded` and events arrive as JSON; in both cases the signature is over the exact bytes. Re-serialising a parsed object breaks it.
- **Reject anything older than five minutes**, using `X-Slack-Request-Timestamp`. That is Slack's own guidance and it is what stops a captured request being replayed.
- Compare in constant time.

## Node.js

`package.json`:

```json
{
  "name": "slack-app",
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
import crypto from 'node:crypto'

const { PORT, SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN } = process.env

const app = express()

// Keep the raw bytes for both content types Slack uses — the signature is over
// exactly what arrived, not over the parsed object.
const keepRaw = (req, _res, buf) => {
  req.rawBody = buf
}
app.use(express.json({ verify: keepRaw }))
app.use(express.urlencoded({ extended: true, verify: keepRaw }))

function isFromSlack(req) {
  const signature = req.get('x-slack-signature')
  const timestamp = req.get('x-slack-request-timestamp')
  if (!signature || !timestamp) return false

  // Replay protection: anything older than five minutes is refused.
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const expected =
    'v0=' +
    crypto
      .createHmac('sha256', SLACK_SIGNING_SECRET)
      .update(`v0:${timestamp}:${req.rawBody}`)
      .digest('hex')

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Events API — messages, mentions, reactions.
app.post('/slack/events', async (req, res) => {
  if (!isFromSlack(req)) return res.sendStatus(401)

  // Slack proves you own the URL by asking you to echo a challenge back.
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge })
  }

  // Acknowledge first. Slack retries anything it doesn't get a 200 for within
  // three seconds, so slow work here turns one event into duplicates.
  res.sendStatus(200)

  if (req.get('x-slack-retry-num')) return // already handled, don't repeat it

  const event = req.body.event
  if (event?.type === 'app_mention') {
    await postMessage(event.channel, `You said: ${event.text}`)
  }
})

// Slash commands — form-encoded, and they expect a visible answer.
app.post('/slack/commands', (req, res) => {
  if (!isFromSlack(req)) return res.sendStatus(401)

  res.json({
    response_type: 'ephemeral', // 'in_channel' to show it to everybody
    text: `You ran ${req.body.command} ${req.body.text}`
  })
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))

async function postMessage(channel, text) {
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ channel, text })
  })
}
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
import hashlib
import hmac
import os
import time

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

SIGNING_SECRET = os.environ["SLACK_SIGNING_SECRET"]
BOT_TOKEN = os.environ["SLACK_BOT_TOKEN"]


def is_from_slack() -> bool:
    signature = request.headers.get("X-Slack-Signature", "")
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
    if not signature or not timestamp:
        return False

    # Replay protection: anything older than five minutes is refused.
    try:
        if abs(time.time() - int(timestamp)) > 300:
            return False
    except ValueError:
        return False

    # request.get_data() is the raw body — do not rebuild it from the parsed form.
    basestring = b"v0:" + timestamp.encode() + b":" + request.get_data()
    expected = "v0=" + hmac.new(
        SIGNING_SECRET.encode(), basestring, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@app.post("/slack/events")
def events():
    if not is_from_slack():
        return "", 401

    payload = request.get_json(silent=True) or {}

    # Slack proves you own the URL by asking you to echo a challenge back.
    if payload.get("type") == "url_verification":
        return jsonify(challenge=payload["challenge"])

    # Retries arrive with this header; ignoring them avoids double-posting.
    if request.headers.get("X-Slack-Retry-Num"):
        return "", 200

    event = payload.get("event") or {}
    if event.get("type") == "app_mention":
        post_message(event["channel"], f"You said: {event['text']}")

    return "", 200


@app.post("/slack/commands")
def commands():
    if not is_from_slack():
        return "", 401

    return jsonify(
        response_type="ephemeral",  # "in_channel" to show it to everybody
        text=f"You ran {request.form['command']} {request.form.get('text', '')}",
    )


@app.get("/healthz")
def healthz():
    return {"ok": True}


def post_message(channel: str, text: str) -> None:
    requests.post(
        "https://slack.com/api/chat.postMessage",
        headers={"Authorization": f"Bearer {BOT_TOKEN}"},
        json={"channel": channel, "text": text},
        timeout=10,
    )
```

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your app's repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

## Set your secrets

Never commit your tokens — the bot token can post as your app in every workspace that installed it:

```bash
faable deploy secrets set \
  SLACK_SIGNING_SECRET=<signing secret> \
  SLACK_BOT_TOKEN=xoxb-…
```

Both come from [api.slack.com/apps](https://api.slack.com/apps): the **signing secret** from _Basic Information → App Credentials_, the **bot token** from _OAuth & Permissions_ after you install the app to a workspace. See [Environment & Releases](../environment.mdx) for the variables Faable injects for you.

## Point Slack at your app

Once the app is live, in your Slack app configuration:

- **Event Subscriptions** → enable, and set the Request URL to `https://<app>.faable.link/slack/events`. Slack immediately POSTs a `url_verification` challenge; the handler above answers it and the URL turns verified. Then subscribe to the bot events you need — `app_mention`, `message.channels`, and so on.
- **Slash Commands** → create your command with the Request URL `https://<app>.faable.link/slack/commands`.
- **Interactivity & Shortcuts** → if you use buttons or modals, point it at a route of your own. Those arrive form-encoded with a single `payload` field holding JSON.

A [custom domain](../domains/custom-domain.md) works identically — use that URL instead. Changing your app's URL later means editing it in all three places.

## The 3-second rule, retries, and cold starts

**Slack expects a `200` within 3 seconds.** Miss it and two things happen: a slash command shows the user an operation-timeout error, and an event is **retried up to three times** — which is how one mention becomes three replies.

So the shape is always the same: **acknowledge immediately, work afterwards.**

- **Events:** answer `200` before doing anything slow, and skip requests carrying `X-Slack-Retry-Num` so a retry you already handled doesn't post twice.
- **Slash commands:** answer `200` straight away, then send the real reply to the `response_url` in the payload — it is valid for **30 minutes** and accepts up to five messages.

```js
// Acknowledge now, answer properly later.
res.json({ response_type: 'ephemeral', text: 'Working on it…' })

await fetch(req.body.response_url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    response_type: 'in_channel',
    text: await somethingSlow()
  })
})
```

That pattern also absorbs the first request after a sleep, when the container is still starting.

## What sleeping does and doesn't break

After 30 minutes with no requests on the Free plan — 2 hours on Hobby and Pro — your app scales to zero. The next Slack event wakes it. What that means in practice:

- **The first event after a sleep is slower** — the container starts up. Acknowledging immediately, as above, is what keeps that inside Slack's window; keep boot work light too, and open database connections lazily rather than at import time.
- **In-memory state is gone.** Anything held in a module-level dictionary disappears on sleep and on every deploy. Persist it — see [Databases](databases.md).
- **Timers don't fire while asleep.** A standup reminder needs an external trigger hitting an endpoint, not an in-process `setInterval`.

## Troubleshooting

- **"Your URL didn't respond with the value of the challenge parameter"** — the `url_verification` branch never ran. Usually the signature check rejected it first, or a body parser consumed the request before you captured the raw bytes.
- **Every signature fails and the code looks right** — you are hashing the parsed body. `express.json()` and `express.urlencoded()` both need the `verify` hook; in Flask use `request.get_data()`, not `request.form`.
- **The bot replies three times to one message** — you acknowledged after doing the work, so Slack retried. Answer `200` first and ignore `X-Slack-Retry-Num`.
- **`/command` shows an operation timeout** — the handler took longer than 3 seconds. Acknowledge, then post to `response_url`.
- **`not_in_channel` or `missing_scope` from `chat.postMessage`** — an installation problem, not a deploy one: invite the bot to the channel, or add the scope and reinstall.
- **Requests time out** — the server binds a hardcoded port instead of `$PORT`, or listens on `127.0.0.1` instead of `0.0.0.0`.
- **The app exits right at boot** — a missing secret. `os.environ["…"]` throws at import time; the logs name it.

## FAQ

### Can I host a Slack bot on Faable Deploy?

Yes. Run it on a Request URL rather than Socket Mode and it is an ordinary web server. Faable Deploy gives every app a public HTTPS URL with a valid certificate on the first deploy, which is exactly what Slack's Event Subscriptions require. Push a Node.js or Python repo — no Dockerfile, no YAML.

### Should my Slack app use a Request URL or Socket Mode on Faable?

A Request URL. Faable scales an app to zero after 30 minutes without an inbound request on the Free plan, or 2 hours on Hobby and Pro. Socket Mode holds an outbound WebSocket and receives no inbound traffic at all, so nothing keeps it awake and it sleeps on every plan. With a Request URL each event wakes the app, it costs nothing while idle, and it stays up continuously once it has real traffic.

### Can I use Bolt on Faable Deploy?

Yes, in its HTTP mode — which is the default. Leave `socketMode` off (JS) and use the standard app runner rather than `SocketModeHandler` (Python), then serve on the injected `PORT`. Bolt verifies the signing secret for you.

### How do I verify that a request really came from Slack?

HMAC-SHA256 the string `v0:{timestamp}:{raw body}` with your signing secret and compare it in constant time to the `X-Slack-Signature` header. Reject anything whose `X-Slack-Request-Timestamp` is more than five minutes old.

### Why does my Slack bot answer the same message several times?

You acknowledged too late. Slack retries an event up to three times when it doesn't get a `200` within 3 seconds. Return `200` before doing any slow work, and ignore requests that carry the `X-Slack-Retry-Num` header.

### Which port should my Slack app listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it and routes public HTTPS traffic to it.

## Related

- [Deploy a Discord Bot](guide-discord-bot.md) · [Deploy a Telegram Bot](guide-telegram-bot.md) · [Deploy a WhatsApp Bot](guide-whatsapp-bot.md) — the same shape, on other platforms
- [Deploy a Stripe Webhook Endpoint](guide-stripe-webhooks.md) — the same verify-and-acknowledge shape, plus idempotency
- [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md) · [Deploy FastAPI](guide-fastapi.md)
- [Databases & SQLite](databases.md) — where to keep state between events
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules and the `$PORT` contract
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
