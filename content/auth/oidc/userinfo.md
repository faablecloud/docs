---
title: UserInfo Endpoint
description: Read end-user profile claims from Faable Auth using an OAuth access token. Claims are gated by the scopes the token was issued with, following OpenID Connect §5.4.
---

# UserInfo Endpoint

The **UserInfo** endpoint returns claims about the authenticated end user. It's the standard OpenID Connect mechanism to fetch profile data after login, using the access token you already have.

Faable Auth implements both `GET` and `POST /userinfo` per [OpenID Connect Core §5.3](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo). Authentication uses Bearer tokens per [RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750).

## Endpoint

```http
GET /userinfo
Authorization: Bearer <access_token>
```

`POST` is also accepted, with the token in the body (`access_token=<token>`) — useful when CORS or middleware constraints force POST.

## Response

A JSON object whose contents depend on the **scopes** the access token was granted. Per OIDC §5.4, only scopes present in the token unlock their associated claims.

```json
{
  "sub": "usr_abc",
  "name": "Ada Lovelace",
  "given_name": "Ada",
  "family_name": "Lovelace",
  "preferred_username": "ada",
  "picture": "https://…/avatar.png",
  "locale": "en",
  "updated_at": 1747353000,
  "email": "ada@example.com",
  "email_verified": true
}
```

### `sub` is always returned

The subject identifier is included regardless of the scopes granted — that's what makes the response actually identify a user.

### Scope-to-claim mapping

| Scope     | Claims unlocked                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profile` | `name`, `given_name`, `family_name`, `middle_name`, `nickname`, `preferred_username`, `profile`, `picture`, `website`, `gender`, `birthdate`, `zoneinfo`, `locale`, `updated_at` |
| `email`   | `email`, `email_verified`                                                                                                                                                        |
| `phone`   | `phone_number`, `phone_number_verified`                                                                                                                                          |
| `address` | `address` (composite, see [§5.1.1](https://openid.net/specs/openid-connect-core-1_0.html#AddressClaim))                                                                          |

Request the scopes you need at `/authorize` time (e.g. `scope=openid profile email`).

### Conventions worth knowing

- **`nickname` fallback**: explicit value → `username` → `given_name`. The email is intentionally **never** used here to avoid PII leakage in display contexts.
- **`preferred_username` fallback**: `username` → `email`.
- **`profile` URL**: when the `profile` scope is granted, `profile` returns `{account_domain}/user/{user_id}`. Omitted if the issuer domain can't be resolved.
- **`updated_at`**: emitted as a Unix timestamp in **seconds** (not an ISO string), per spec §5.1.
- **`address`**: omitted entirely when all its sub-fields would be empty, per spec ("If the Claim is not available, the Claim SHOULD NOT be returned").

### Composite address claim

```json
{
  "address": {
    "street_address": "1 Babbage Lane",
    "locality": "London",
    "region": "Greater London",
    "postal_code": "EC1A 1AA",
    "country": "United Kingdom",
    "formatted": "1 Babbage Lane, London, EC1A 1AA, United Kingdom"
  }
}
```

### Backwards compatibility

If the access token was issued without any scopes (legacy clients), Faable returns all standard scopes' claims. New clients should always request the scopes they need explicitly.

## Example

```ts
const res = await fetch('https://your-tenant.faable.app/userinfo', {
  headers: { Authorization: `Bearer ${accessToken}` }
})

if (!res.ok) {
  throw new Error(`UserInfo ${res.status}`)
}

const profile = await res.json()
console.log(profile.sub, profile.email)
```

## Next steps

- [Authorization Code Flow](../oauth-flows/authorization-code.mdx) — obtain the access token you'll use here.
- [Logout](logout.md) — terminate the session when you're done.
