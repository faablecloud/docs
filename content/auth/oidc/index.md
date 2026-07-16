---
title: OpenID Connect
description: How Faable Auth implements OpenID Connect Core 1.0 — discovery, ID tokens, signing keys (JWKS), UserInfo, and RP-Initiated Logout — on top of OAuth 2.0.
---

# OpenID Connect

**OpenID Connect (OIDC)** is the identity layer on top of OAuth 2.0. Where OAuth alone answers _"can this client access this API?"_, OIDC also answers _"who is the user?"_ — by returning a signed **ID token** alongside the access token and standardizing how to fetch profile claims.

Faable Auth implements [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html). Every tenant domain is a fully self-describing OIDC issuer, so any standard OIDC client library works out of the box.

## Discovery

Each tenant publishes its configuration at the standard well-known URL:

```http
GET https://your-tenant.faable.app/.well-known/openid-configuration
```

The document lists the issuer, the `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`, `end_session_endpoint`, and the supported scopes, response types, and signing algorithms. Point your OIDC library at your tenant domain and it configures itself from here.

## ID tokens and signing keys

ID tokens (and access tokens) are JWTs signed with **RS256**. The public keys are published at:

```http
GET https://your-tenant.faable.app/.well-known/jwks.json
```

Keys rotate automatically; each token's `kid` header identifies the key that signed it, so libraries that cache the JWKS pick up rotations transparently. See [Validate Access Tokens](/auth/validate-access-tokens) for how to verify tokens in your own API.

## What's supported

| Capability                               | Notes                                                                            |
| :--------------------------------------- | :------------------------------------------------------------------------------- |
| Authorization Code Flow + PKCE (S256)    | The recommended login flow — see [OAuth 2.0 Flows](/auth/oauth-flows)            |
| Discovery                                | `/.well-known/openid-configuration` per tenant                                   |
| JWKS with key rotation                   | `/.well-known/jwks.json`, RS256                                                  |
| `nonce`                                  | Replay protection for ID tokens                                                  |
| `prompt`                                 | `none`, `login`, `consent`, `select_account`                                     |
| `max_age` + `auth_time`                  | Force or measure re-authentication                                               |
| [UserInfo endpoint](/auth/oidc/userinfo) | Claims gated by scopes (§5.4)                                                    |
| [RP-Initiated Logout](/auth/oidc/logout) | `id_token_hint`, `post_logout_redirect_uri`                                      |
| Dynamic Client Registration              | [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591), `POST /oidc/register` |

## Standard claims

Which claims end up in the ID token and the UserInfo response is controlled by the **scopes** you request at `/authorize` time — `openid` is required, and `profile`, `email`, `phone`, `address` unlock their claim groups. The full scope-to-claim mapping is documented on the [UserInfo page](/auth/oidc/userinfo#scope-to-claim-mapping).

## Next steps

- [OAuth 2.0 Flows](/auth/oauth-flows) — pick the right grant and obtain your first tokens.
- [UserInfo Endpoint](/auth/oidc/userinfo) — fetch end-user profile claims with the access token.
- [RP-Initiated Logout](/auth/oidc/logout) — sign users out and propagate it to relying parties.
- [Validate Access Tokens](/auth/validate-access-tokens) — verify RS256 signatures against your tenant's JWKS in your API.
