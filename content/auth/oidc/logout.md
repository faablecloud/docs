---
title: RP-Initiated Logout
description: Sign users out of Faable Auth and propagate the logout to every Relying Party in the same session via OpenID Connect Front-Channel Logout 1.0.
---

# RP-Initiated Logout

Faable Auth implements both [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-1_0.html) and [OpenID Connect Front-Channel Logout 1.0](https://openid.net/specs/openid-connect-frontchannel-1_0.html). A single `GET /logout` call lets your application:

1. Terminate the user's session at the auth tenant.
2. Optionally notify every other Relying Party (RP) in that session so they can clear their local state in parallel.
3. Redirect the user back to a registered URL with optional state preserved.

## The endpoint

```http
GET /logout?id_token_hint=<id_token>&post_logout_redirect_uri=<url>&state=<opaque>
```

| Parameter                  | Description                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id_token_hint`            | The ID Token previously issued to the user. RECOMMENDED (per spec §3): it lets Faable identify the client and session being ended. Decoded without signature verification — it's a hint, not an authorizer. |
| `client_id`                | OAuth client identifier. Inferred from `id_token_hint.aud` when omitted.                                                                                                                                    |
| `post_logout_redirect_uri` | Where to send the user after logout. **Must be pre-registered** in the client's `logout_urls` (exact match). This is what prevents open-redirect abuse.                                                     |
| `state`                    | Opaque value echoed back as `?state=…` on the post-logout redirect. Use it for CSRF protection.                                                                                                             |
| `logout_hint`              | Optional hint about the user being logged out (session id, email). Provider-specific.                                                                                                                       |
| `ui_locales`               | Space-separated preferred languages for any UI shown during logout.                                                                                                                                         |
| `returnTo`                 | Deprecated alias for `post_logout_redirect_uri`. Kept for backwards compatibility.                                                                                                                          |

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

## Per-RP session tracking

Internally, Faable maintains one session record per (browser session, client) pair. It's created during the Authorization Code flow at `/authorize` and removed at `/logout`. You don't interact with these records directly — they exist so the `id_token` can carry a stable `sid` claim and so front-channel logout knows exactly which RPs to notify. There is no public API to list or revoke them.

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

- [Clients](../clients.md) — configure `logout_urls`, `frontchannel_logout_uri`, and `frontchannel_logout_session_required`.
- [UserInfo](userinfo.md) — fetch end-user claims using the access token before logout.
