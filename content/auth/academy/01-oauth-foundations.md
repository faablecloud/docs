---
title: "Module 1 — OAuth & OIDC Foundations"
description: The minimum OAuth 2.0 and OpenID Connect you need before integrating Faable Auth — actors, tokens, and scopes.
---

# Module 1 — OAuth & OIDC Foundations

> **Learning objectives**
> - Explain why OAuth 2.0 exists and name the actors in a flow.
> - Distinguish an **access token** from an **ID token** and say what each is for.
> - Explain what a **scope** is and how it limits a token.

## The problem OAuth solves

Before OAuth, apps asked users for their password and stored it. That's a disaster:
every app becomes a place your password can leak, and you can't revoke one app
without changing your password everywhere.

OAuth 2.0 replaces "give the app your password" with "the app gets a **token**, issued
by a trusted authorization server, that grants *limited* access for a *limited* time."
Faable Auth **is** that authorization server, for your tenant.

**OpenID Connect (OIDC)** is a thin layer on top of OAuth that adds *authentication*
— a standard way to answer "**who** is this user?" — via the **ID token**.

## The actors

| Actor | In Faable terms |
|---|---|
| **Resource Owner** | The end user signing in. |
| **Client** | Your application (a [Client](../clients.md) you register in the dashboard). |
| **Authorization Server** | Faable Auth — at `https://<tenant>.auth.faable.link`. |
| **Resource Server** | A backend API that accepts access tokens (an [API](../apis.md) / audience). |

## The two tokens (do not confuse them)

This is the single most common source of integration bugs.

- **ID token** — *"who the user is."* A JWT with identity claims (`sub`, `email`,
  `name`, `nonce`, `auth_time`). It is **for your app to read**. Never send it to an
  API as authorization. Defined by OIDC.
- **Access token** — *"what the bearer may do."* Sent to a resource server in the
  `Authorization: Bearer …` header. Its `aud` (audience) says *which* API it's for,
  and its `scope` / `permissions` say *what* it may do there. Your app should treat
  it as opaque and just forward it.

There's also the **refresh token** — a long-lived credential used to get new access
tokens without making the user log in again (covered in Module 3).

> **Rule of thumb:** read the **ID token** to know your user; send the **access
> token** to call APIs. If you're putting an ID token in an `Authorization` header,
> stop — you want the access token.

## Scopes

A **scope** is a string that narrows what a token can do, e.g. `openid`, `profile`,
`email`, or an API permission like `read:users`. The client *requests* scopes; the
server issues a token containing only the scopes it's willing to grant.

- `openid` is what turns an OAuth request into an **OIDC** request (you get an ID token).
- `profile` / `email` add standard claims, exposed via [UserInfo](../oidc/userinfo.md)
  and filtered per scope.
- API scopes (Module 5) gate access to your own backends.

## Why JWTs

Faable signs tokens as **JWTs** (RS256). A JWT has three parts —
`header.payload.signature` — base64url-encoded and dot-separated. Anyone can *read*
the payload (it's not encrypted), but only Faable can *sign* it. Resource servers
verify the signature against Faable's public keys, published at the
[JWKS endpoint](../oidc) (`/.well-known/jwks.json`), and discovered via
`/.well-known/openid-configuration`.

> ⚠️ Because the payload is readable, **never put secrets in token claims**, and
> never paste a real token into an online decoder — decode locally.

## Check yourself

1. Your SPA calls your own `/api/orders` backend. Which token goes in the
   `Authorization` header?
2. What does adding `openid` to the requested scopes change about the response?
3. True/false: a resource server needs to call Faable on every request to verify a token.

<details>
<summary>Answers</summary>

1. The **access token** (with an `aud` for your orders API).
2. You get back an **ID token** — the request becomes an OIDC authentication, not
   just an OAuth authorization.
3. **False.** It verifies the JWT **signature** locally using Faable's published
   **JWKS** public keys; no per-request call to Faable is needed.
</details>

---

Next: **[Module 2 — Tenant Building Blocks](02-tenant-building-blocks.md)**.
