---
title: APIs
description: Register your backend APIs (resource servers) in Faable Auth so they can validate access tokens, enforce scopes, and define fine-grained permissions.
---

# APIs

In OAuth 2.0 terminology, a **resource server** is the backend that consumes access tokens. In Faable Auth this is modeled as an **API**: a registered object that gives your backend its own audience identifier, defines the permissions clients can request, and controls how tokens are issued.

You'll typically create one API per logical backend service. Each one is independently configurable: signing algorithm, token lifetime, whether consent is shown, and so on.

## Concept

When a client requests a token for a specific resource server, it passes `audience=<identifier>` to the `/oauth/token` endpoint. Faable issues an access token whose `aud` claim equals that identifier — your backend can then validate the token against its expected audience to reject tokens minted for other services.

```
client ──► /oauth/token { audience: "https://api.example.com", scope: "read:users" }
           │
           └─► access_token { aud: "https://api.example.com", scope: "read:users", … }
                              │
                              └─► your backend (verifies aud + signature, enforces scope)
```

## Endpoints

| Method   | Path             | Purpose                                                              |
| -------- | ---------------- | -------------------------------------------------------------------- |
| `POST`   | `/apis`          | Create an API.                                                       |
| `GET`    | `/apis`          | List APIs (paginated, FaableQL-filterable).                          |
| `GET`    | `/apis/:apis_id` | Read one.                                                            |
| `POST`   | `/apis/:apis_id` | Update. The `identifier` field is **immutable** and must be omitted. |
| `DELETE` | `/apis/:apis_id` | Delete.                                                              |

All endpoints are scoped to the calling account.

## Creating an API

```http
POST /apis
Content-Type: application/json

{
  "name": "Internal API",
  "identifier": "https://api.example.com",
  "signing_alg": "RS256",
  "token_lifetime": 86400,
  "token_dialect": "access_token_authz",
  "enforce_policies": true,
  "allow_offline_access": true,
  "skip_consent": false,
  "permissions": [
    { "value": "read:users",  "description": "Read user profiles" },
    { "value": "write:users", "description": "Create or update users" }
  ]
}
```

### Fields

| Field                  | Description                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                 | Human-readable label shown in the dashboard and on consent screens.                                                                                                                              |
| `slug`                 | URL-safe identifier, derived from `name` if omitted. Unique per account.                                                                                                                         |
| `identifier`           | The audience URL or URN used by clients (`audience=…`) and emitted as the `aud` claim. **Immutable** after creation. Must be unique per account.                                                 |
| `description`          | Optional free-text description.                                                                                                                                                                  |
| `permissions`          | Array of `{ value, description? }`. The `value` is the scope string clients request (convention: `verb:resource`, e.g. `read:users`). The `description` is shown to users on the consent screen. |
| `signing_alg`          | JWT signing algorithm. Only `RS256` is supported today.                                                                                                                                          |
| `token_dialect`        | `access_token` (standard) or `access_token_authz` (adds a `permissions` claim listing the granted scopes).                                                                                       |
| `token_lifetime`       | Access token TTL in seconds. Range: 60 (1 min) to 2_592_000 (30 days). Default: 86_400 (24 h).                                                                                                   |
| `enforce_policies`     | When `true`, requested scopes are intersected with the API's `permissions` list — anything outside is dropped. When `false`, requested scopes are echoed verbatim.                               |
| `allow_offline_access` | When `true`, clients can request `offline_access` and receive a `refresh_token` along with the access token.                                                                                     |
| `skip_consent`         | When `true`, first-party clients skip the consent prompt for this API.                                                                                                                           |

## Defining permissions

Permissions live inline on the API and use the same string clients pass in the `scope` parameter:

```json
"permissions": [
  { "value": "read:projects",   "description": "List and read projects" },
  { "value": "write:projects",  "description": "Create or modify projects" },
  { "value": "admin:projects",  "description": "Delete or transfer projects" }
]
```

When a client requests `scope=read:projects write:projects` against this API with `enforce_policies=true`, the issued token's `scope` claim contains exactly those two values. If `token_dialect=access_token_authz`, they're also reflected in a structured `permissions` claim:

```json
{
  "aud": "https://api.example.com",
  "scope": "read:projects write:projects",
  "permissions": ["read:projects", "write:projects"]
}
```

This is what your backend authorization middleware should check.

## Using your API from a client

Once registered, request tokens for it via any standard OAuth flow:

```ts
import { auth } from '@faable/auth-js'

const token = await auth.getAccessToken({
  audience: 'https://api.example.com',
  scope: 'read:projects'
})

await fetch('https://api.example.com/projects', {
  headers: { Authorization: `Bearer ${token}` }
})
```

For server-to-server calls (no end user), see [Client Credentials](oauth-flows/client-credentials.mdx).

## Next steps

- [Validate Access Tokens](validate-access-tokens.md) — verify these tokens in your backend (Express middleware included).
- [Clients](clients.md) — register the application that will request tokens.
- [Client Credentials flow](oauth-flows/client-credentials.mdx) — machine-to-machine token issuance for an API.
- [Authorization Code flow](oauth-flows/authorization-code.mdx) — user-driven token issuance.
