---
title: Webhooks
description: Receive signed HTTPS callbacks from Faable Auth when users are created, updated, deleted, or log in. Includes HMAC-SHA256 verification and replay protection.
---

# Webhooks

Webhooks let your backend react to events in your Faable Auth tenant — without polling. Each event is delivered as a signed HTTPS POST to a URL you choose. Faable signs the payload with HMAC-SHA256 and includes a timestamp so you can reject replays.

## Supported events

| Event          | When                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| `user.created` | A user record is added to the tenant.                                    |
| `user.updated` | A user record is updated (email change, profile edit, metadata change…). |
| `user.deleted` | A user record is removed.                                                |
| `auth.login`   | A user successfully authenticates.                                       |

> [!IMPORTANT]
> **Plan requirement**: Webhooks are available on **Hobby** and **Pro**. Free accounts cannot create webhook subscriptions. See [Auth pricing](../pricing.md).

## Managing subscriptions

Webhook subscriptions live on the `notification_subscriptions` resource. Filter by `?channel=webhook` to see only webhook subscriptions (the resource is shared with email subscriptions).

| Method   | Path                                                        | Purpose           |
| -------- | ----------------------------------------------------------- | ----------------- |
| `POST`   | `/notification_subscriptions`                               | Create a webhook. |
| `GET`    | `/notification_subscriptions?channel=webhook`               | List webhooks.    |
| `POST`   | `/notification_subscriptions/:notification_subscription_id` | Update.           |
| `DELETE` | `/notification_subscriptions/:notification_subscription_id` | Delete.           |

### Create example

```http
POST /notification_subscriptions
Content-Type: application/json

{
  "channel": "webhook",
  "url": "https://api.example.com/hooks/faable",
  "secret": "whsec_<long-random-string>",
  "events": ["user.created", "user.updated", "auth.login"]
}
```

Pick a strong, unguessable `secret` (e.g. 32+ random bytes, base64-encoded). Faable uses it to sign every delivery — anyone who knows it can forge a request.

## Delivery format

```http
POST /hooks/faable HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Faable-Event: user.created
X-Faable-Delivery: evt_2t7…
X-Faable-Timestamp: 1747353000123
X-Faable-Signature: sha256=4f3c8e…

{
  "id": "evt_2t7…",
  "type": "user.created",
  "produced_at": "2026-05-12T10:30:00.123Z",
  "payload": {
    "user": { "user_id": "usr_…", "email": "ada@example.com" }
  }
}
```

### Headers

| Header               | Meaning                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `X-Faable-Event`     | Event type (matches the `type` field in the body).                           |
| `X-Faable-Delivery`  | Unique event ID for idempotency on your side.                                |
| `X-Faable-Timestamp` | Unix milliseconds when Faable computed the signature.                        |
| `X-Faable-Signature` | `sha256=<hex>` HMAC-SHA256 of `${timestamp}.${rawBody}` using your `secret`. |

### Delivery semantics

- HTTP POST with a 5-second timeout.
- Non-2xx responses and timeouts are recorded as failed in [Logs](../logs.md). There is **no automatic retry** — design your handler to acknowledge quickly (return 2xx) and process out-of-band if needed.
- Bodies on both sides are truncated at 64 KB for logging.

## Verifying signatures

Verify every request. The signed string is `${timestamp}.${rawBody}` — make sure you use the **raw** body bytes (before any JSON parsing) and that you compare in constant time. Reject requests whose timestamp is more than a few minutes off your clock to prevent replay attacks.

### Node / TypeScript

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyFaableSignature(
  rawBody: string,
  headers: Record<string, string>,
  secret: string
): boolean {
  const timestamp = headers['x-faable-timestamp']
  const signatureHeader = headers['x-faable-signature'] ?? ''
  const [, hex] = signatureHeader.split('=')
  if (!timestamp || !hex) return false

  // Reject replays older than 5 minutes.
  const ageMs = Math.abs(Date.now() - Number(timestamp))
  if (ageMs > 5 * 60 * 1000) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest()
  const provided = Buffer.from(hex, 'hex')

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  )
}
```

### Using it in an Express route

```ts
import express from 'express'

const app = express()

// Capture the raw body — Faable signs the bytes, not a re-serialized JSON.
app.post(
  '/hooks/faable',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const raw = req.body.toString('utf8')
    const ok = verifyFaableSignature(
      raw,
      req.headers as any,
      process.env.FAABLE_WEBHOOK_SECRET!
    )
    if (!ok) return res.status(401).send('invalid signature')

    const event = JSON.parse(raw)
    // …process event.id idempotently…
    res.status(200).send('ok')
  }
)
```

> [!IMPORTANT]
> If your framework parses JSON before you compute the HMAC, the signature will not match (whitespace differences invalidate it). Always sign over the raw bytes.

## Next steps

- [Logs](../logs.md) — inspect successful and failed deliveries.
- [Actions](actions.md) — for cases where you need to influence the auth flow instead of reacting after the fact.
