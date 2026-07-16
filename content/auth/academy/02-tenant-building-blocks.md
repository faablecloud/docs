---
title: 'Module 2 — Tenant Building Blocks'
description: Account, Connections, Clients, Users & Teams — the four concepts that model a Faable Auth tenant, plus how multi-tenancy works by host.
---

# Module 2 — Tenant Building Blocks

> **Learning objectives**
>
> - Name the four core resources of a tenant and how they relate.
> - Explain how Faable resolves _which tenant_ a request belongs to.
> - Know where each resource lives in the dashboard.

## Four concepts model the whole product

From the [Get Started](../get-started.md) guide:

- **Account** — your auth **tenant**. Hosted at `https://<account>.auth.faable.link`
  or under your own [custom domain](../custom-domain.md). Everything below hangs off
  the account.
- **[Connections](../connections.md)** — _sources of users_: database (email +
  password), social (Google, GitHub, Apple…), passwordless, or generic OIDC/SAML.
- **[Clients](../clients.md)** — the _applications_ that drive an OAuth flow against
  your account. Each has a **Client ID**, optional **Client Secret**, and
  **Allowed Callback URLs**.
- **[Users & Teams](../team-invitations.md)** — identities created through your
  connections, optionally grouped into **teams** with **RBAC** (roles + role members).

```
Account (tenant)
├── Connections        (how users authenticate)
├── Clients            (which apps can ask)
├── Users / Identities (who has authenticated)
└── Teams / Roles      (how users are grouped & authorized)
```

## How a tenant is resolved: by host

Faable Auth is **multi-tenant**. The tenant is determined from the **host** of the
incoming request: `acme.auth.faable.link` → the _acme_ account; a custom domain like
`login.acme.com` → whichever account claims it. Each account has its own keystore,
clients, connections and users — they are fully isolated.

> As an integrator you rarely set this yourself: you point the SDK at your tenant's
> `domain` and Faable does the rest. Just remember that **the domain identifies the
> tenant**, which is why the SDK always needs a `domain`.

## Clients in a bit more depth

A client represents one application. Two things matter most when integrating:

- **Public vs confidential.** A browser/mobile app is **public** — it cannot keep a
  secret, so it uses **PKCE** instead (Module 3). A backend is **confidential** and
  uses a **client secret**.
- **Allowed Callback URLs.** After login, Faable will only redirect back to URLs you
  have explicitly allow-listed. A mismatch here is the #1 "it works locally but not
  in prod" bug — add every environment's callback URL.

See [Clients](../clients.md) for the full field reference.

## Connections in a bit more depth

A connection is a _way to authenticate_. You can enable several at once; the login
screen shows the ones enabled for that client. Connections can be restricted to
specific clients (`enabled_clients`). Types include:

- **Database** — email + password, with a configurable password policy.
- **Social** — Google, GitHub, Apple, Facebook, etc. (see [Social](../social/)).
- **Passwordless** — magic link / OTP ([Passwordless](../passwordless.md)).
- **OIDC / Enterprise** — federate to another identity provider.

## Check yourself

1. You have a Next.js web app and a separate mobile app hitting the same tenant.
   How many clients do you create, and are they public or confidential?
2. A teammate says "login redirects to a Faable error page after the user signs in."
   What's the first thing you check?
3. Where does a _user_ come from — you create them manually, or…?

<details>
<summary>Answers</summary>

1. **Two clients**, both **public** (they run on the user's device and can't hold a
   secret) → both use PKCE.
2. The **Allowed Callback URLs** on that client — the post-login `redirect_uri` must
   be allow-listed exactly.
3. Users are **created through a connection** when they authenticate (or via
   invitations / admin APIs). The connection is the _source_ of users.

</details>

---

Next: **[Module 3 — Login & Flows](03-login-and-flows.md)**.
