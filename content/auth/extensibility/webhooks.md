---
title: Webhooks
description: Receive signed HTTPS callbacks from Faable Auth when users, logins, teams or organizations change. Verify them with @faable/auth-sdk, get typed events, and handle retries and secret rotation.
---

# Webhooks

Webhooks let your backend react to events in your Faable Auth tenant without polling. Each event is delivered as a signed HTTPS `POST` to a URL you choose. Faable signs every delivery with HMAC-SHA256 and a timestamp, retries the ones that fail, and keeps the same delivery id on every retry so you can process each event once.

## Create a webhook

With the [Faable CLI](../../cli.md):

```bash
faable auth webhooks create \
  --url https://api.example.com/hooks/faable \
  -e user.created -e team.member.added
```

It prints the **signing secret once**. Store it right away as an environment variable of the receiver (for example `FAABLEAUTH_WEBHOOK_SECRET`); it is never shown again. To pass it straight to a Faable app without it appearing anywhere:

```bash
faable auth webhooks create --url https://… -e user.created --json \
  | jq -r '"FAABLEAUTH_WEBHOOK_SECRET=" + .secret' \
  | faable deploy secrets set -a my-app -f -
```

Then check the endpoint end to end. Faable sends a signed `ping` and reports what your server answered:

```bash
faable auth webhooks test <webhook_id>
```

| Command                                         | What it does                                                    |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `faable auth webhooks list` / `get <id>`        | Your webhooks, with their status and last success or failure.   |
| `faable auth webhooks update <id> -e … --url …` | Change the events or the URL; `--no-enabled` pauses deliveries. |
| `faable auth webhooks rotate-secret <id>`       | Issue a new secret. The previous one stays valid for 24 hours.  |
| `faable auth webhooks rm <id>`                  | Delete it.                                                      |

The URL must be `https`. Unknown events are refused with the list of valid ones.

## Receive and verify

Verify **every** delivery before trusting it. [`@faable/auth-sdk`](https://www.npmjs.com/package/@faable/auth-sdk) (2.8 or later) does the whole check and returns the event typed:

```ts
import {
  WebhookVerificationError,
  constructWebhookEvent,
  readRawBody
} from '@faable/auth-sdk'

// Next.js pages router. The signature is over the RAW body, so the body
// parser must be off.
export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  let event
  try {
    event = await constructWebhookEvent(
      await readRawBody(req), // fetch-style handlers: await request.text()
      req.headers,
      process.env.FAABLEAUTH_WEBHOOK_SECRET!
    )
  } catch (e) {
    if (e instanceof WebhookVerificationError) return res.status(401).end()
    throw e
  }

  switch (event.type) {
    case 'user.created':
      await sendWelcome(event.payload.email) // payload is the User
      break
    case 'team.member.added':
      await grantAccess(event.payload.team_id, event.payload.user_id)
      break
  }
  res.status(200).end()
}
```

`constructWebhookEvent` checks the signature in constant time, refuses deliveries more than 5 minutes old (replays), parses the body and narrows `event.payload` by `event.type`. A failure throws `WebhookVerificationError` with a `reason`: `missing_secret`, `missing_headers`, `timestamp_out_of_tolerance`, `signature_mismatch` or `invalid_body`. It uses Web Crypto, so it runs on Node ≥ 19, Deno, Bun and edge runtimes. The types (`WebhookEvent`, `WebhookEventOf<'user.created'>`, `WebhookPayload<'team.member.added'>`) are generated from the Faable Auth OpenAPI.

> [!IMPORTANT]
> If your framework parses the JSON before you verify, the signature will not match: re-serialised JSON is not the bytes that were signed. In Express, use `express.raw({ type: 'application/json' })` on the webhook route; in Next.js route handlers, `await request.text()`.

## Retries and duplicates

- Your endpoint has **5 seconds** to answer.
- Timeouts, network errors, `5xx` and `429` are **retried** after 1 minute, 5 minutes, 30 minutes, 2 hours and 12 hours. Any other `4xx` is final.
- **Answer `2xx` only once the work is done.** Answer `5xx` if it failed and you want it delivered again.
- **The same event can arrive twice**: a retry after a delivery that was processed but whose response was lost. `X-Faable-Delivery` (`event.delivery_id` with the SDK) is the same on every retry. Deduplicate by it, or make the work idempotent.
- After several failures in a row the webhook shows as `failing` in `faable auth webhooks list`. It keeps receiving deliveries, and the next success sets it back to `healthy`. Every attempt, with its request and response, is in the tenant's [Logs](../logs.md) as `webhook.<event>`.

## Rotating the secret

`faable auth webhooks rotate-secret <id>` issues a new secret and keeps the previous one valid for 24 hours. During that overlap every delivery carries **two** signatures, the new one first:

```
X-Faable-Signature: sha256=<new>,sha256=<previous>
```

A delivery is valid when any of them matches. Switch your receiver to the new secret any time within the 24 hours. To switch with no gap at all, give the SDK both while you deploy: `constructWebhookEvent(body, headers, [previousSecret, newSecret])`.

## Events

| Event                                                                  | When                                                  | `payload`                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `user.created`                                                         | A user was created: signup, import or Management API. | The User, as stored when it happened.                                         |
| `user.updated`                                                         | A user was updated.                                   | The User.                                                                     |
| `user.deleted`                                                         | A user was deleted.                                   | The User, as it was.                                                          |
| `auth.login`                                                           | A user logged in.                                     | The User.                                                                     |
| `credentials.exported`                                                 | Someone exported the tenant's password hashes.        | `account`, `actor_user_id` or `actor_client_id`, `connection`, `exported_at`. |
| `team.created`, `team.updated`, `team.deleted`                         | A team changed.                                       | `{ team_id }`                                                                 |
| `team.member.added`, `team.member.updated`, `team.member.removed`      | A user joined a team, changed roles, or left.         | `team_id`, `user_id`, `roles`; `method` (added), `previous_roles` (updated).  |
| `team.invite.created`, `team.invite.revoked`, `team.invite.accepted`   | A team invitation changed.                            | `team_id`, `invite_id`, `email`, `inviter_user_id`; `reason` (revoked).       |
| `organization.created`, `organization.updated`, `organization.deleted` | An organization changed.                              | `{ organization_id }`                                                         |
| `ping`                                                                 | Only from `faable auth webhooks test`.                | `{}`                                                                          |

`team.*` and `organization.*` payloads are notices, not state: they carry ids, and your receiver reads whatever else it needs from the Management API. That way the order in which deliveries arrive and retries do not matter.

## Delivery format

```http
POST /hooks/faable HTTP/1.1
Content-Type: application/json
X-Faable-Event: user.created
X-Faable-Delivery: 2b55ca38-6a38-4356-9dbc-db158a9594aa
X-Faable-Timestamp: 1760472000123
X-Faable-Signature: sha256=4f3c8e…

{
  "id": "2b55ca38-6a38-4356-9dbc-db158a9594aa",
  "type": "user.created",
  "produced_at": 1760472000098,
  "payload": { "id": "user_…", "email": "ada@example.com", … }
}
```

| Header               | Meaning                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `X-Faable-Event`     | The event type, the same as `type` in the body.                                                 |
| `X-Faable-Delivery`  | The event id, the same on every retry: deduplicate by it.                                       |
| `X-Faable-Timestamp` | Unix milliseconds when the delivery was signed.                                                 |
| `X-Faable-Signature` | `sha256=<hex>`: HMAC-SHA256 of `${timestamp}.${rawBody}` with your secret. Two during rotation. |

`produced_at` is when the event happened, in Unix milliseconds.

## Verifying without the SDK

In another language, do what the SDK does:

1. Read the **raw** body.
2. Reject the delivery if `X-Faable-Timestamp` is more than 5 minutes from your clock.
3. Compute HMAC-SHA256 of `${timestamp}.${rawBody}` with your secret.
4. Split `X-Faable-Signature` on commas and accept the delivery if any `sha256=<hex>` equals your HMAC, compared in **constant time**.

```python
import hmac, hashlib, time

def verify(raw_body: bytes, headers, secret: str) -> bool:
    ts = headers.get("x-faable-timestamp", "")
    sigs = headers.get("x-faable-signature", "")
    if not ts or not sigs or abs(time.time() * 1000 - int(ts)) > 5 * 60 * 1000:
        return False
    expected = hmac.new(secret.encode(), f"{ts}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return any(
        hmac.compare_digest(part.strip().removeprefix("sha256="), expected)
        for part in sigs.split(",")
    )
```

## Next steps

- [Logs](../logs.md): every delivery attempt, with its request and response.
- [Actions](actions.md): to change the login while it happens instead of reacting afterwards.
