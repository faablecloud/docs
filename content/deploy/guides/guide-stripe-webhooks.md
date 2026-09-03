---
schema: faq
title: Deploy a Stripe Webhook Endpoint
description: Host a Stripe webhook endpoint on Faable Deploy from GitHub, in Node.js or Python. Signature verification on the raw body, idempotency against at-least-once delivery, out-of-order events, testing with the Stripe CLI, the $PORT contract and secrets — and why a platform that scales to zero is a good fit for webhooks. 100% European hosting.
---

# Deploy a Stripe Webhook Endpoint 💳

**A webhook endpoint is a small web server with one job, and that is exactly what Faable Deploy runs best.** Push a repo with it and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and puts a [WAF](../security-waf.md) in front of it. Stripe requires a public HTTPS endpoint with a trusted certificate; you have one from the first deploy.

This guide covers **Node.js** and **Python**. Stripe is the worked example, but the shape is the same for GitHub, Shopify, Twilio and Meta — the differences are in the header name and the hashing recipe.

## Scale-to-zero is an advantage here

Most guides about hosting warn you that an app which sleeps is a liability. For a webhook endpoint the opposite is true, and it is worth understanding before you worry about it.

Faable Deploy scales an app to zero once no HTTP request has arrived for a while — **30 minutes on the Free plan, 2 hours on Hobby and Pro** — and wakes it on the next one. **Stripe retries a failed delivery with exponential backoff for up to three days.** So the worst a cold start can do is delay an event, not lose it. And an endpoint with steady volume never sleeps at all: each event is inbound traffic that keeps it awake.

What that costs you is a design constraint you needed anyway:

> **Your handler must be idempotent.** Stripe's delivery is _at-least-once_, so duplicates are guaranteed rather than exceptional — and on a platform that sleeps, the first request after a nap is exactly the one most likely to time out and be retried.

That is the real subject of this guide.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

- **Node.js** — a `package.json` with a `start` script. Supported versions: 20, 22 and 24.
- **Python** — a `requirements.txt`, `pyproject.toml` or `Pipfile`, plus a module defining your app object. Supported versions: 3.10, 3.11, 3.12 and 3.13.

## Serve on `$PORT`

Faable assigns your app a port and passes it as the `PORT` environment variable. Bind `0.0.0.0` and read it — a hardcoded port means Stripe's deliveries time out and count as failures.

## Verify the signature, on the raw body

Stripe signs every delivery with the **endpoint's** signing secret — the `whsec_…` shown when you create the endpoint, which is not your API key.

- The header is `Stripe-Signature`, carrying a timestamp `t=` and one or more `v1=` signatures.
- The signed payload is **`{t}.{raw body}`**, HMAC-SHA256 with the signing secret.
- Stripe's own tolerance is **5 minutes** on that timestamp, which is what stops a captured request being replayed.

**You need the raw bytes.** This is the single most common way a webhook endpoint breaks: a JSON body parser runs first, and the re-serialised object no longer matches what was signed. In Express that means mounting `express.raw()` on the webhook route — and mounting it _before_ any global `express.json()`.

Both official libraries do the verification for you; let them.

## Node.js

`package.json`:

```json
{
  "name": "stripe-webhooks",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "stripe": "^17.0.0"
  }
}
```

`server.js`:

```js
import express from 'express'
import Stripe from 'stripe'

const { PORT, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = process.env
const stripe = new Stripe(STRIPE_SECRET_KEY)

const app = express()

// The webhook route needs the raw bytes, so it gets its own parser and it goes
// BEFORE any global express.json(). Every other route can parse normally.
app.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.body, // the Buffer, untouched
        req.get('stripe-signature'),
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      // Bad signature or a timestamp outside Stripe's five-minute tolerance.
      console.warn('webhook signature failed:', err.message)
      return res.sendStatus(400)
    }

    // Acknowledge before doing any work: a slow answer is a failed delivery,
    // and a failed delivery comes back as a duplicate.
    res.sendStatus(200)

    if (await alreadyHandled(event.id)) return

    try {
      await handle(event)
      await markHandled(event.id)
    } catch (err) {
      // Don't record it: let Stripe's retry bring it back.
      console.error('handler failed for', event.id, err)
    }
  }
)

app.use(express.json())

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))

async function handle(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      // Don't trust the payload as current state — read the object back.
      const session = await stripe.checkout.sessions.retrieve(
        event.data.object.id
      )
      await fulfil(session)
      break
    }
    default:
      // Unhandled types are fine. Return 200 and move on.
      break
  }
}
```

`alreadyHandled` / `markHandled` are a single row keyed by `event.id` in whatever database you already have — see [Databases](databases.md). It is the whole of your idempotency.

## Python

`requirements.txt`:

```txt
Flask>=3.0
stripe>=11.0
gunicorn
```

`app.py` — the builder finds `app = Flask(...)` and starts it with `gunicorn app:app --bind 0.0.0.0:$PORT`:

```python
import os

import stripe
from flask import Flask, request

app = Flask(__name__)

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
WEBHOOK_SECRET = os.environ["STRIPE_WEBHOOK_SECRET"]


@app.post("/stripe/webhook")
def webhook():
    try:
        # request.get_data() is the raw body — never request.get_json() here.
        event = stripe.Webhook.construct_event(
            request.get_data(),
            request.headers.get("Stripe-Signature", ""),
            WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError) as err:
        app.logger.warning("webhook signature failed: %s", err)
        return "", 400

    if already_handled(event["id"]):
        return "", 200

    handle(event)
    mark_handled(event["id"])
    return "", 200


@app.get("/healthz")
def healthz():
    return {"ok": True}


def handle(event) -> None:
    if event["type"] == "checkout.session.completed":
        # Don't trust the payload as current state — read the object back.
        session = stripe.checkout.Session.retrieve(event["data"]["object"]["id"])
        fulfil(session)
```

If your handler does something slow — sending mail, calling another API — move it off the request: acknowledge, then do the work in a background thread or a queue. Anything that keeps Stripe waiting is a delivery that will be retried.

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

## Set your secrets

Never commit either of these — your secret key can move money:

```bash
faable deploy secrets set \
  STRIPE_SECRET_KEY=sk_live_… \
  STRIPE_WEBHOOK_SECRET=whsec_…
```

The **secret key** comes from the Stripe Dashboard under _Developers → API keys_. The **webhook secret** is shown when you create the endpoint, in _Developers → Webhooks_, and it is **per endpoint** — your local `stripe listen` secret and your deployed one are different values. See [Environment & Releases](../environment.mdx) for the variables Faable injects for you.

## Register the endpoint

In the Stripe Dashboard, _Developers → Webhooks → Add endpoint_:

- **Endpoint URL**: `https://<app>.faable.link/stripe/webhook`
- **Events**: select only the ones you handle. Subscribing to everything means paying a cold start and a database round trip for events you ignore.

A [custom domain](../domains/custom-domain.md) works identically — register that URL instead.

### Test it before you trust it

The [Stripe CLI](https://docs.stripe.com/stripe-cli) replays real events at a local server, so you can get the whole thing right before deploying:

```bash
stripe listen --forward-to localhost:3000/stripe/webhook
# prints a whsec_… for this session — use it as STRIPE_WEBHOOK_SECRET locally

stripe trigger checkout.session.completed
```

Send the same event twice and confirm your handler only acts once. That is the test that matters here.

## The two things that actually bite

**Events arrive out of order.** Stripe does not guarantee ordering, so a `customer.subscription.updated` can land before the `created` it followed. Do not rebuild state by replaying events in the order you receive them: when an event tells you something changed, **retrieve the object from the API** and act on what it says now. The examples above do this deliberately.

**Sustained failures get your endpoint disabled.** Stripe retries for days, but an endpoint that keeps failing is eventually turned off and you are emailed about it. A `500` because a secret is missing is not a quiet problem — check your app's logs (`faable deploy logs`, or the dashboard) after the first deploy rather than waiting to notice.

## What sleeping does and doesn't break

After 30 minutes with no requests on the Free plan — 2 hours on Hobby and Pro — your endpoint scales to zero. The next event wakes it. What that means in practice:

- **The first event after a sleep is slower** — the container starts up. Stripe's retries absorb it; keep boot work light and open database connections lazily rather than at import time.
- **In-memory state is gone.** An idempotency set held in a module-level variable disappears on sleep and on every deploy, which quietly turns idempotency off. It belongs in a database — see [Databases](databases.md).
- **Timers don't fire while asleep.** Reconciling with Stripe on a schedule needs an external trigger hitting an endpoint, not an in-process `setInterval`.

## Troubleshooting

- **`No signatures found matching the expected signature for payload`** — you verified against a parsed body. The webhook route needs `express.raw()` (Node) or `request.get_data()` (Python), and in Express it must be mounted before any global `express.json()`.
- **Signature fails only in production** — you deployed the `whsec_` from `stripe listen`. Each endpoint has its own secret.
- **`Timestamp outside the tolerance zone`** — the request is older than five minutes. Usually a replayed capture, occasionally a badly skewed clock.
- **The same order is fulfilled twice** — no idempotency, or idempotency kept in memory. Persist `event.id`.
- **The Stripe dashboard shows failed deliveries with no logs on your side** — the request never reached your app: wrong path, or the server binds a hardcoded port instead of `$PORT`.
- **The app exits right at boot** — a missing secret. `os.environ["…"]` throws at import time; the logs name it.

## FAQ

### Can I host a Stripe webhook endpoint on Faable Deploy?

Yes. It is an ordinary web server with one route. Faable Deploy gives every app a public HTTPS URL with a valid certificate on the first deploy, which is what Stripe requires. Push a Node.js or Python repo — no Dockerfile, no YAML.

### Does an app that scales to zero lose Stripe webhooks?

No. Stripe retries failed deliveries with exponential backoff for up to three days, so a cold start delays an event rather than losing it. An endpoint with steady traffic never sleeps in the first place. What it does require is that your handler be idempotent, because delivery is at-least-once and a retried event will arrive twice.

### How do I verify a Stripe webhook signature?

HMAC-SHA256 the string `{timestamp}.{raw body}` with the endpoint's `whsec_` signing secret and compare it to the `v1=` value in the `Stripe-Signature` header, rejecting timestamps older than five minutes. In practice, call `stripe.webhooks.constructEvent` (Node) or `stripe.Webhook.construct_event` (Python) and give it the raw bytes.

### Why does my Stripe webhook fail with "No signatures found matching the expected signature"?

Almost always because the body was parsed before it was verified. The signature covers the exact bytes Stripe sent, so a re-serialised JSON object will never match. Use `express.raw({ type: 'application/json' })` on that route, mounted before any global JSON parser.

### How do I make a Stripe webhook handler idempotent?

Record each `event.id` you have finished processing in your database, and return early when one arrives that you have already recorded. Keep it in the database rather than in memory — an in-process set is lost every time the app redeploys or sleeps.

### Which port should my webhook endpoint listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it and routes public HTTPS traffic to it.

## Related

- [Deploy a Slack App](guide-slack-bot.md) · [Deploy a Discord Bot](guide-discord-bot.md) · [Deploy a Telegram Bot](guide-telegram-bot.md) · [Deploy a WhatsApp Bot](guide-whatsapp-bot.md) — the same verify-and-acknowledge shape
- [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md) · [Deploy FastAPI](guide-fastapi.md)
- [Databases & SQLite](databases.md) — where the idempotency record belongs
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules and the `$PORT` contract
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
