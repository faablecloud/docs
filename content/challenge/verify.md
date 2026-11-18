---
title: Verify API
description: Reference for POST https://challenge.faable.com/v1/verify — parameters, JSON or form-encoded bodies, every response field, the error codes, token rules (5 minutes, single use, your domains) and the signed ES256 receipt you can check against the JWKS.
rank: normal
---

# Verify API

Your server checks every token the widget produced before acting on the submission. The token proves that a browser on one of your site's domains solved a challenge for your site key in the last 5 minutes, and nobody has used it yet.

## Request

```http
POST https://challenge.faable.com/v1/verify
Content-Type: application/json

{
  "secret": "fcs_sk_…",
  "response": "fct_…",
  "remoteip": "203.0.113.7",
  "action": "contact"
}
```

| Parameter  | Required | Description                                                                                                             |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `secret`   | yes      | The site's secret key, `fcs_sk_…`. It can go in the header `Authorization: Bearer fcs_sk_…` instead of the body.        |
| `response` | yes      | The token, as the form sent it in `faable-challenge-response`. Tokens start with `fct_`.                                |
| `remoteip` | no       | The IP address of the person who sent the form. It never fails the check; `remoteip_match` reports the comparison.      |
| `action`   | no       | The action you expect. When present and different from the one the widget used, the check fails with `action-mismatch`. |

The body can be **JSON** or **form-encoded** (`application/x-www-form-urlencoded`), so a backend that already posts to a `siteverify` endpoint can send the same fields:

```bash
curl -X POST https://challenge.faable.com/v1/verify \
  -H 'Authorization: Bearer fcs_sk_…' \
  --data-urlencode 'response=fct_…' \
  --data-urlencode 'remoteip=203.0.113.7'
```

```php
$res = file_get_contents('https://challenge.faable.com/v1/verify', false,
  stream_context_create(['http' => [
    'method'  => 'POST',
    'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
    'content' => http_build_query([
      'secret'   => getenv('FAABLE_CHALLENGE_SECRET'),
      'response' => $_POST['faable-challenge-response'] ?? '',
      'remoteip' => $_SERVER['REMOTE_ADDR'],
    ]),
  ]]));
$ok = json_decode($res, true)['success'] ?? false;
```

## Response

A known secret always gets `200`, whether the token passes or not. Read `success`.

```json
{
  "success": true,
  "site_id": "…",
  "project_id": "project_…",
  "hostname": "www.example.com",
  "action": "contact",
  "challenge_ts": "2026-11-18T08:24:16.049Z",
  "difficulty": 19,
  "signals": ["datacenter"],
  "remoteip_match": true,
  "error-codes": [],
  "receipt": "eyJhbGciOiJFUzI1NiIs…"
}
```

| Field            | Description                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `success`        | `true` only when the token is valid and nothing in `error-codes` applies. **The only field to decide on.**                                                |
| `site_id`        | The site the token belongs to.                                                                                                                            |
| `project_id`     | The Faable project of the site.                                                                                                                           |
| `hostname`       | The hostname of the page that solved the challenge — one of your site's domains or a subdomain of one.                                                    |
| `action`         | The action the widget declared, or `null`.                                                                                                                |
| `challenge_ts`   | When the challenge was solved (ISO 8601).                                                                                                                 |
| `difficulty`     | The difficulty it was solved at, in bits (18 to 21).                                                                                                      |
| `signals`        | The risk signals that raised the difficulty: `tor-exit`, `datacenter`, `malformed-user-agent`. Empty for an ordinary request.                             |
| `remoteip_match` | `true` or `false` when you sent `remoteip`: whether it is the IP that solved the challenge. `null` when you did not send it.                              |
| `error-codes`    | Why it failed. Empty on success.                                                                                                                          |
| `receipt`        | On success only: a [signed receipt](#receipts) that the check passed, to hand on to [Faable Auth](/challenge/faable-auth) or to another service of yours. |

On a failure, `site_id` and the other details come back when the token was found (an `action-mismatch`), and only `success` and `error-codes` otherwise.

### Why `remoteip` does not decide

A browser on a dual-stack network can reach `challenge.faable.com` over IPv4 and your site over IPv6, or the reverse, so the same person shows two different addresses. Failing on a mismatch would reject real people. Use `remoteip_match` as one more signal if it suits you — for example, to add a step on a payment form — not as a reason to refuse.

## Error codes

| Code                     | HTTP | Meaning                                                                                                                            |
| ------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `invalid-input-secret`   | 401  | The secret is missing, malformed, or not the current secret of any site (it was rotated, or the site deleted).                     |
| `missing-input-response` | 200  | No token was sent: the form did not carry `faable-challenge-response`, or it was empty.                                            |
| `invalid-input-response` | 200  | The value is not a Faable Challenge token.                                                                                         |
| `timeout-or-duplicate`   | 200  | The token is expired (older than 5 minutes), was already verified, or belongs to another site. The three look the same on purpose. |
| `action-mismatch`        | 200  | You sent an `action` and the widget used a different one. The token is spent anyway.                                               |

## Token rules

- **5 minutes.** A token expires 5 minutes after it was issued. The widget renews it while the form is open, so a person who takes their time still sends a fresh one.
- **Single use.** A verify consumes the token, even when it fails with `action-mismatch`, so a leaked token cannot be tried until it fits. Verify once per submission, and do not retry with the same token.
- **Your domains.** A challenge is only issued when the page's origin is one of the site's domains or a subdomain of one (`example.com` covers `www.example.com`). `hostname` tells you which.
- **Your site.** A token verifies only with the secret of the site it was issued for.

## Rotating the secret

**Rotate secret** on the site's page in the dashboard issues a new secret and shows it once. **The old one stops working at that moment**, so update your server right after. The site key and the widget do not change, and tokens already issued stay valid for the new secret.

**Delete site** stops both keys at once: forms using them fail the check from then on.

## Receipts

A successful verify returns a **receipt**: a JWT signed by Faable Challenge stating that the check passed. The token itself is spent by then; the receipt is what you can pass on, to [Faable Auth](/challenge/faable-auth) when the form creates a user, or to another service of yours that needs to know.

| Claim          | Value                                               |
| -------------- | --------------------------------------------------- |
| `iss`          | `https://challenge.faable.com`                      |
| `sub`          | The `site_id`.                                      |
| `project_id`   | The Faable project of the site.                     |
| `hostname`     | The hostname of the page that solved the challenge. |
| `action`       | The widget's action, or `null`.                     |
| `challenge_ts` | When it was solved.                                 |
| `difficulty`   | The difficulty, in bits.                            |
| `jti`          | A unique id per receipt.                            |
| `iat`, `exp`   | Issued at, and **10 minutes** later.                |

It is signed with **ES256**; the public keys are at [`https://challenge.faable.com/.well-known/jwks.json`](https://challenge.faable.com/.well-known/jwks.json). To check one in Node.js with [`jose`](https://www.npmjs.com/package/jose):

```js
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('https://challenge.faable.com/.well-known/jwks.json')
)

export async function checkReceipt(receipt, expectedProjectId) {
  const { payload } = await jwtVerify(receipt, JWKS, {
    issuer: 'https://challenge.faable.com',
    algorithms: ['ES256']
  })
  if (payload.project_id !== expectedProjectId) throw new Error('other project')
  return payload // { sub: site_id, hostname, action, difficulty, jti, … }
}
```

A receipt can be checked many times; making it single use is up to whoever accepts it. Faable Auth does: it remembers each `jti` until the receipt expires and refuses it the second time. If you accept receipts in a service of your own, do the same.

## Coming from another CAPTCHA

The request and the response follow the shape of the common `siteverify` APIs: `secret`, `response` and `remoteip` in, `success`, `hostname`, `challenge_ts`, `action` and `error-codes` out, with the same error code names. Moving a backend over is usually a change of URL, of secret and of the form field it reads (`faable-challenge-response`).

## Limits on the browser side

These are answered to the widget, not to your server, and reach your page through `error-callback`:

| Error                | HTTP | Meaning                                                                                                    |
| -------------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| `invalid_site_key`   | 400  | The site key does not exist.                                                                               |
| `origin_not_allowed` | 403  | The page is not on one of the site's domains. Add the domain to the site (or `localhost` for development). |
| `invalid_action`     | 400  | The action is longer than 64 characters.                                                                   |
| `rate_limited`       | 429  | More than 60 challenges in a minute from one IP. Retry after 2 minutes (`Retry-After: 120`).               |
