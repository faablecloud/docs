---
title: RP-Initiated Logout
description: Sign users out of Faable Auth and propagate the logout to every Relying Party in the same session via OpenID Connect Front-Channel and Back-Channel Logout 1.0.
---

# RP-Initiated Logout

Faable Auth implements [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-1_0.html), [Front-Channel Logout 1.0](https://openid.net/specs/openid-connect-frontchannel-1_0.html) and [Back-Channel Logout 1.0](https://openid.net/specs/openid-connect-backchannel-1_0.html). A single `GET /logout` call lets your application:

1. Terminate the user's session at the auth tenant. Every refresh token issued in that session is refused from then on (`invalid_grant`).
2. Notify every other Relying Party (RP) in that session — through the browser (front-channel) and/or server to server (back-channel) — so they can end their own sessions.
3. Redirect the user back to a registered URL with optional state preserved.

## The endpoint

```http
GET /logout?id_token_hint=<id_token>&post_logout_redirect_uri=<url>&state=<opaque>
```

| Parameter                  | Description                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id_token_hint`            | The ID Token previously issued to the user. RECOMMENDED (per spec §3): it lets Faable identify the client and session being ended, and is **verified** against the tenant's signing keys (its expiry is ignored — an expired ID Token is still a valid hint). A token that fails verification is treated the same as a missing one. |
| `client_id`                | OAuth client identifier. Inferred from `id_token_hint.aud` when omitted.                                                                                                                                                                                                                                                            |
| `post_logout_redirect_uri` | Where to send the user after logout. **Must be pre-registered** in the client's `logout_urls` (exact match). This is what prevents open-redirect abuse.                                                                                                                                                                             |
| `state`                    | Opaque value echoed back as `?state=…` on the post-logout redirect. Use it for CSRF protection.                                                                                                                                                                                                                                     |
| `logout_hint`              | Optional hint about the user being logged out (session id, email). Provider-specific.                                                                                                                                                                                                                                               |
| `ui_locales`               | Space-separated preferred languages for any UI shown during logout.                                                                                                                                                                                                                                                                 |
| `returnTo`                 | Deprecated alias for `post_logout_redirect_uri`. Kept for backwards compatibility.                                                                                                                                                                                                                                                  |

## What happens

### Session termination

1. Faable enumerates RPs in the user's browser session that have a `frontchannel_logout_uri` registered.
2. The tenant session cookie is cleared.
3. Internal session tracking records are removed.

### Without front-channel logout

If no RP in the session needs front-channel notification, Faable either:

- returns a small JSON body `{ "status": "logout" }` (HTTP 200), or
- issues a `302` redirect to `post_logout_redirect_uri` (with `?state=…` appended if provided).

### With front-channel logout

If any RP needs notification, Faable renders an HTML page containing one sandboxed `<iframe>` per RP, pointed at each RP's registered `frontchannel_logout_uri`. The browser loads them in parallel; once all iframes finish (or a 3-second safety timeout elapses), the page redirects to `post_logout_redirect_uri`.

Cache and framing headers protect this flow:

```
Cache-Control: no-store
Pragma: no-cache
Content-Security-Policy: frame-ancestors 'none'
```

## Wiring up front-channel logout on a client

To opt an RP in, register two fields on the client (via [Clients](../clients.md) or `POST /clients`):

| Field                                  | Description                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontchannel_logout_uri`              | The URL Faable loads inside an iframe to tell your app the user has logged out. Your handler should clear local cookies/storage and return a tiny 200 response. |
| `frontchannel_logout_session_required` | When `true`, Faable appends `iss` and `sid` query parameters to the iframe URL so your app can correlate the logout with the specific session.                  |

A minimal handler:

```ts
// app/api/logout-frontchannel/route.ts (Next.js)
export async function GET(req: Request) {
  // Optionally read ?iss and ?sid if you set frontchannel_logout_session_required.
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain'
  })

  // Clear your session cookie(s) here.
  headers.append('Set-Cookie', 'session=; Max-Age=0; Path=/; HttpOnly')

  return new Response('', { status: 200, headers })
}
```

## Requiring confirmation before logout

By default `/logout` ends the session as soon as it's called — which, since the session cookie must be sent cross-site for front-channel logout to work, means **any page can trigger it** with no gesture from the user (a bare `<img src="…/logout">` is enough). If the request carries a verified `id_token_hint`, that's a strong enough signal on its own; without one, you may want a real confirmation step.

Set `logout_confirm_required: true` on the account (via the [Management API](../academy/05-server-and-management-api.md), `POST /account/:account_id`) to require it: a `/logout` call with no verified `id_token_hint` — and an active session to protect — is parked on a confirmation screen instead of ending the session outright. Confirming calls `POST /logout/confirm` with the parked `state`, which finishes exactly as the direct call would have. A request with no active session is unaffected — there's nothing to confirm.

Turn this on once your client sends `id_token_hint` on every sign-out (see the full example below) — otherwise every ordinary sign-out shows the confirmation screen.

## Back-channel logout

Front-channel logout depends on the browser: it only reaches apps whose iframe loads, and it cannot reach an app's **server**. Back-channel logout does not: when the session ends, Faable POSTs a signed `logout_token` from its servers to every RP of the session that registered a `backchannel_logout_uri`, whether the browser is still there or not. That is what ends an application's server-side session (a `HttpOnly` cookie, a Redis session) and, together with the refresh-token revocation above, what a "sign out everywhere" actually needs.

The discovery document advertises `backchannel_logout_supported` and `backchannel_logout_session_supported`.

### Registering

Set two fields on the client (via [Clients](../clients.md) or `POST /clients`):

| Field                                 | Description                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backchannel_logout_uri`              | The HTTPS URL Faable POSTs the `logout_token` to. It must answer `200` within 5 seconds; Faable retries twice (after 0.5 s and 2 s) and records the outcome.  |
| `backchannel_logout_session_required` | When `true`, the RP requires a `sid` in the token. Faable always includes it, so this is informational.                                                        |

### What arrives

```http
POST /auth/backchannel-logout HTTP/1.1
Content-Type: application/x-www-form-urlencoded

logout_token=eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

The `logout_token` is a JWT signed with the same key as the tenant's `id_token`s (its `jwks_uri`), with header `typ: logout+jwt` and these claims:

| Claim    | Value                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| `iss`    | The tenant issuer, identical to the `id_token`'s.                                                 |
| `aud`    | Your `client_id`.                                                                                |
| `sub`    | The user (`user_…`).                                                                             |
| `sid`    | The session id — the same `sid` every `id_token` of that session carried.                        |
| `events` | `{ "http://schemas.openid.net/event/backchannel-logout": {} }`                                   |
| `iat`, `exp`, `jti` | Issued at, 2-minute expiry, unique id. There is never a `nonce`.                      |

### Receiving it

Per spec §2.6, validate the signature against the JWKS, `iss`, `aud`, `iat` (reject stale tokens), the `events` claim, that `sid` or `sub` is present and that there is no `nonce`. Then end every local session with that `sid` (or, without one, every session of `sub`) and answer `200` with `Cache-Control: no-store`. Answer `400` for a token that does not validate.

`@faable/auth-js/nextjs` ships this receiver: mount its handlers and register `https://app.example.com/auth/backchannel-logout`. See [Next.js (Server-Side)](../quickstart/nextjs-server-side.md).

Each delivery leaves an `oauth.backchannel_logout` entry in the tenant [logs](../logs.md) with `success`, `failed` (the RP's last status or error, after the retries) or `skipped` (no URI registered).

## Confirming the logout

`GET /logout` is a link anyone can put on a page. When the session is active and the request carries no verifiable `id_token_hint`, a tenant with `logout_confirm_required` enabled shows the user a confirmation page instead of ending the session on a stranger's say-so. `@faable/auth-js` sends the session's `id_token` as `id_token_hint` on `signOut()`, so its logouts never see that page; enable the setting once every app of the tenant does the same.

## Per-RP session tracking

Internally, Faable maintains one session record per (browser session, client) pair. It's created during the Authorization Code flow at `/authorize` and removed at `/logout`. They exist so the `id_token` can carry a stable `sid` claim and so front-channel logout knows exactly which RPs to notify — and, since they're also how [Sessions](../sessions.md) tracks a user's devices, you can list and revoke them from there.

## A full example

```ts
// In your application's "Sign out" handler:
const logoutUrl = new URL('https://your-tenant.faable.app/logout')
logoutUrl.searchParams.set('id_token_hint', session.id_token)
logoutUrl.searchParams.set(
  'post_logout_redirect_uri',
  'https://app.example.com/logged-out'
)
logoutUrl.searchParams.set('state', crypto.randomUUID())

// Clear your own session, then redirect the browser:
return Response.redirect(logoutUrl.toString())
```

Make sure `https://app.example.com/logged-out` is in the client's `logout_urls`, or the redirect will be rejected.

## Next steps

- [Clients](../clients.md) — configure `logout_urls`, `frontchannel_logout_uri`, `backchannel_logout_uri` and their `_session_required` flags.
- [UserInfo](userinfo.md) — fetch end-user claims using the access token before logout.
