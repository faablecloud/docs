---
title: Clients
description: Register and configure OAuth Clients in Faable Auth for SPAs, mobile, server-side web apps and machine-to-machine services — callbacks, web origins, refresh token lifetimes, client authentication and Dynamic Client Registration.
---

# Clients

In Faable Auth, a **Client** represents an application that authenticates users or requests authorization to access APIs: a Single Page Application (React, Vue, Angular), a native mobile app, a server-side web application, or a backend machine-to-machine service.

Clients are what initiate the OAuth 2.0 and OpenID Connect flows. You manage them from the [Faable Dashboard](https://dashboard.faable.com), or create them programmatically with [Dynamic Client Registration](#dynamic-client-registration).

## Creating a Client

Registering a client generates two credentials:

- **Client ID** — a public, unique identifier. Safe to ship in client-side code (React, Expo); it tells Faable Auth which application is asking.
- **Client Secret** — a confidential string that proves the application's identity. _Never expose it in a SPA, a mobile binary, or anything a user can read._ It belongs to backends only.

## Types of Clients

Your architecture dictates the configuration and the flow:

| Client type            | Where the code runs                              | Secret? | Flow                                                           |
| ---------------------- | ------------------------------------------------ | ------- | -------------------------------------------------------------- |
| **Single Page App**    | The browser (React, Vue, Angular)                | ❌      | [Authorization Code + PKCE](oauth-flows/authorization-code.md) |
| **Native / Mobile**    | The user's device (iOS, Android, React Native)   | ❌      | [Authorization Code + PKCE](oauth-flows/authorization-code.md) |
| **Regular Web App**    | Your server (Express, Next.js server components) | ✅      | [Authorization Code](oauth-flows/authorization-code.md)        |
| **Machine to Machine** | A backend service or worker, no human involved   | ✅      | [Client Credentials](oauth-flows/client-credentials.md)        |
| **Device / TV / CLI**  | An input-constrained device                      | ❌      | [Device Code](oauth-flows/device-code.md)                      |

Faable Auth enforces **PKCE with `S256`** — it advertises no other code challenge method — so public clients are covered whether or not a secret is present.

## Client Configuration

### Security boundaries

- **Allowed Callback URLs (`callbacks`)** — the whitelist of URLs Faable Auth may redirect to after login (e.g. `https://myapp.com/callback`). Prevents open-redirect abuse.
- **Allowed Logout URLs (`logout_urls`)** — where users may be sent after [RP-Initiated Logout](oidc/logout.md).
- **Allowed Web Origins (`web_origins`)** — origins (`scheme://host[:port]`, **no path** — e.g. `http://localhost:5173`) permitted to make cross-origin calls to the token and passwordless endpoints. **When the list is empty, any origin is allowed**; fill it in to lock browser calls down to your own app. Your account's auth domain is always allowed implicitly, so you only list your application origins.
- **Connections** — which authentication methods (Google, passwordless, database…) this specific client may use. Set on each [connection](connections.md) via its _Enabled clients_ list.

### Token lifetimes

| Setting                        | Effect                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `refresh_token.token_lifetime` | Lifetime of issued refresh tokens, in seconds. **Default 2592000** (30 days).                                               |
| Access token lifetime          | Not a client setting — it comes from the [API](apis.md) the token is issued for (`token_lifetime`), defaulting to 24 hours. |

> `refresh_token.expiration_mode` and `refresh_token.infinite_token_lifetime` exist on the client object for Auth0 compatibility, but are **not enforced today** — only `token_lifetime` governs how long a refresh token lives. Don't rely on them to build a never-expiring session.

### Client authentication at the token endpoint

`POST /oauth/token` accepts three methods, as published in your tenant's [discovery document](oidc):

| `token_endpoint_auth_method` | How the client authenticates                                   | For                           |
| ---------------------------- | -------------------------------------------------------------- | ----------------------------- |
| `client_secret_basic`        | HTTP Basic header with `client_id:client_secret` (the default) | Confidential clients          |
| `client_secret_post`         | `client_id` + `client_secret` in the form body                 | Confidential clients          |
| `none`                       | No secret — the PKCE `code_verifier` is the proof              | Public SPA and native clients |

### Application metadata

Optional fields, mostly consumed by consent screens and by tooling: `client_uri`, `logo_uri`, `tos_uri`, `policy_uri`, `contacts`, `application_type` (`web` | `native`), `software_id`, `software_version`.

### Front-Channel Logout

A client may register a `frontchannel_logout_uri`: Faable loads it in a hidden iframe when the user logs out of the OP, so your application can clear its own session. Set `frontchannel_logout_session_required` to `true` and Faable includes `iss` and `sid` on that call, letting you scope the cleanup to the exact session. See [Logout](oidc/logout.md).

## Dynamic Client Registration

Clients can be created over HTTP instead of through the dashboard, per [OIDC Dynamic Client Registration 1.0 / RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591). This is what lets a third-party tool onboard itself against your tenant — MCP clients, IDE integrations and OAuth debuggers commonly expect it.

The endpoint is published in your discovery document as `registration_endpoint`:

```bash
curl -X POST 'https://your-domain.auth.faable.link/oidc/register' \
  -H 'content-type: application/json' \
  -d '{
    "client_name": "My Tool",
    "redirect_uris": ["https://tool.example.com/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

Response (`201`), per RFC 7591 §3.2.1 — this is the only time the secret is returned:

```json
{
  "client_id": "…",
  "client_secret": "…",
  "client_id_issued_at": 1751641200,
  "client_secret_expires_at": 0,
  "redirect_uris": ["https://tool.example.com/callback"],
  "client_name": "My Tool",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "application_type": "web"
}
```

Notes on behaviour:

- **`redirect_uris` is the only required field.** Everything else defaults per spec: `grant_types` to `["authorization_code"]`, `response_types` to `["code"]`, `token_endpoint_auth_method` to `client_secret_basic`, `application_type` to `web`.
- **Unsupported metadata is rejected**, not silently accepted. Requesting a grant type Faable doesn't implement returns `400`. Supported grants are `authorization_code`, `refresh_token`, `client_credentials`, `urn:ietf:params:oauth:grant-type:device_code`, `urn:ietf:params:oauth:grant-type:token-exchange` and Auth0's passwordless OTP grant.
- **`client_secret_expires_at` is `0`** — issued secrets don't expire.
- **The client is bound to the tenant resolved from the request host**, so register against the domain you actually want it to live in.
- **`web_origins`** is accepted as a non-standard extra, with the same rules as in the dashboard.
- **Registration is not itself authenticated.** Anyone who can reach your auth domain can create a client in your tenant — a new client grants no access on its own, but if that's not a trade-off you want, keep an eye on `oauth.client.register` entries in your [logs](logs.md).

## Next Steps

- **[Connections](connections.md)** — the identity providers you attach to a client.
- **[Authorization Code Flow](oauth-flows/authorization-code.md)** — the mechanics of the standard login flow.
- **[APIs](apis.md)** — register the resource servers your clients request tokens for.
- **[Quickstarts](quickstart/nextjs.md)** — jump into working code, including [FastAPI](quickstart/fastapi.md) on the backend side.
