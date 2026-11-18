---
title: Faable Challenge with Faable Auth
description: How Faable Challenge and Faable Auth work together — Signup Protection runs on Challenge at no extra cost, and a form of your own that creates Faable Auth users can send challenge_receipt or challenge_token so the user shows as Verified by Faable Challenge.
rank: high
---

# With Faable Auth

Faable Challenge and [Faable Auth](/auth) meet in two places:

- **Auth's own sign-ups.** [Signup Protection](/auth/signup-protection) — the challenge on `POST /dbconnections/signup` and `POST /passwordless/start` — runs on Faable Challenge. It is included with Faable Auth on every plan and **does not count toward your Challenge quota**. You set it on each Auth client's **Security** tab; there is no Challenge site to create.
- **Your own forms that create users.** When your backend creates or updates Faable Auth users from a form of its own — a booking that opens an account, a quote request that registers the customer — it can send the proof that the form passed a Challenge check. The user then records it, and the dashboard shows **Verified by Faable Challenge** on them.

This page is about the second case.

## Sending the proof with the user

`POST /user` (create) and `POST /user/{user_id}` (update) of the [Management API](/auth/academy/05-server-and-management-api) accept one of two fields:

| Field               | What it is                                                                                                  | Who verifies it                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `challenge_receipt` | The `receipt` your backend got from a successful [`/v1/verify`](/challenge/verify#receipts). **Preferred.** | Faable Auth, offline, with the JWKS. |
| `challenge_token`   | The widget's token, **not yet verified**. Use it when your backend does not call `/v1/verify` itself.       | Faable Auth, with Faable Challenge.  |

Send one, never both. Either way the proof must come from a Challenge **site of the same Faable project** as the Auth tenant: a token or receipt of another project is refused.

### With a receipt (recommended)

Your backend verifies the token as usual, decides on `success`, and passes the receipt along with the user it writes. The check your form depends on stays in your code, and Faable Auth only reads a signature.

```ts
import { FaableAuthApi } from '@faable/auth-sdk'

const api = FaableAuthApi.create(/* your management client */)

const verify = await fetch('https://challenge.faable.com/v1/verify', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    secret: process.env.FAABLE_CHALLENGE_SECRET,
    response: form['faable-challenge-response'],
    action: 'booking'
  })
}).then(r => r.json())

if (!verify.success) throw new Error('challenge failed')

await api.createUser({
  email: form.email,
  name: form.name,
  challenge_receipt: verify.receipt
})
```

Over raw HTTP against your tenant:

```http
POST /user
Authorization: Bearer <management_access_token>
Content-Type: application/json

{
  "email": "ana@example.com",
  "challenge_receipt": "eyJhbGciOiJFUzI1NiIs…"
}
```

A receipt is valid for **10 minutes** and Faable Auth accepts each one **once**.

### With the token

If your backend would rather not call Challenge, forward the widget's token as `challenge_token`. Faable Auth verifies it with Faable Challenge before writing — and that consumes it, so do not also verify it yourself. It counts toward your [quota](/challenge/pricing) like any verify.

```http
POST /user/user_123
Authorization: Bearer <management_access_token>
Content-Type: application/json

{
  "phone": "+34600000000",
  "challenge_token": "fct_…"
}
```

The management token needs the scope of the write itself — `create:users` for `POST /user`, `update:users` for `POST /user/{user_id}`. Nothing more.

## Errors

| Status | `error_code`            | Meaning                                                                                                                                                                                                               |
| ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | `challenge_invalid`     | The proof was not accepted: the receipt's signature is wrong or it expired, it was already used, it is of another project, the token is unknown, expired or spent, or both fields were sent. **Nothing was written.** |
| 503    | `challenge_unavailable` | With `challenge_token` only: Faable Challenge did not answer. **Nothing was written**; retry the request.                                                                                                             |

The verified mark is an extra on top of the user, not the reason to create them. If the write fails with either code, write the user again **without** the proof rather than lose the submission:

```ts
async function writeUser(data, receipt) {
  try {
    return await api.createUser({ ...data, challenge_receipt: receipt })
  } catch (err) {
    if (
      err?.error_code === 'challenge_invalid' ||
      err?.error_code === 'challenge_unavailable'
    ) {
      return api.createUser(data) // same user, without the mark
    }
    throw err
  }
}
```

## What the user records

A write that carried a valid proof stores, read-only:

```json
{
  "challenge_passed_at": "2026-11-18T09:12:40.000Z",
  "challenge_passed": {
    "method": "pow",
    "difficulty": 18,
    "source": "site",
    "site_id": "…",
    "hostname": "www.example.com",
    "action": "booking"
  }
}
```

`source` is `site` for a proof from your form, and `auth` for one from Signup Protection (which records the `client_id` instead of the site). Your code cannot set these fields directly; only a valid proof writes them. In the dashboard, the user's detail page shows **Verified by Faable Challenge** with the time, the difficulty and a link to the site or the Auth client.

## Related

- [Signup Protection](/auth/signup-protection) — Faable Auth's own challenge, per client.
- [Verify API](/challenge/verify) — the verify call and the receipt.
- [Management API](/auth/academy/05-server-and-management-api) — tokens and scopes for `POST /user`.
