---
title: "Module 5 — Server-side & Management API"
description: Call the Faable Management API from backend code with client_credentials and @faable/auth-sdk, understand audience + scopes, and extend the flow with Actions and webhooks.
---

# Module 5 — Server-side & Management API

> **Learning objectives**
> - Use the **Client Credentials** grant for machine-to-machine (no user) calls.
> - Configure `@faable/auth-sdk` to read/mutate users, clients, connections.
> - Explain **audience** and **scopes** for management tokens.
> - Know what **Actions** and **webhooks** are for.

## When there's no user: Client Credentials

A backend job — sync users, provision a tenant, react to an event — has **no logged-in
user**. It authenticates *as itself* with a **confidential client** using the
**Client Credentials** grant. Reference: [Client Credentials Flow](../oauth-flows/client-credentials.mdx).

You get an **access token** (no ID token, no refresh token — there's no user to
represent). The token's `aud` and `scope` decide what it can do.

## Calling the Management API with `@faable/auth-sdk`

The Management API is the admin surface of your tenant: CRUD for users, clients,
connections, teams, etc. The server SDK handles auth for you, Octokit-style — you give
it a strategy and credentials, no environment magic:

```ts
import { FaableAuthApi, authClientCredentials } from "@faable/auth-sdk";

const api = FaableAuthApi.create({
  authStrategy: authClientCredentials,
  auth: {
    client_id: process.env.FAABLEAUTH_CLIENT_ID!,
    client_secret: process.env.FAABLEAUTH_CLIENT_SECRET!,
  },
  domain: process.env.FAABLEAUTH_DOMAIN!, // your tenant, e.g. acme.auth.faable.link
});

const { results } = await api.listUsers().first();
await api.updateUser(userId, { locale: "es" });
```

You only supply **domain + credentials**. The SDK discovers the right **management
audience** from the domain automatically (it reads the tenant's
`/.well-known/openid-configuration`).

## Audience & scopes (the two things that gate a management token)

See [APIs](../apis.md) and the [Client Credentials Flow](../oauth-flows/client-credentials.mdx)
for the full reference. The short version:

- **Audience (`aud`)** — *which* API the token is for. The management audience is
  `faable:management:<account_id>`. A token for the wrong audience is rejected
  (`aud_mismatch`). The SDK sets this for you via discovery.
- **Scopes / permissions** — *what* the token may do, as `verb:resource` strings:
  `read:users`, `update:users`, `read:clients`, … A call needs the matching scope.

### Do I have to list every scope?

**No.** For a machine-to-machine (`client_credentials`) client, if you request **no
scopes**, Faable grants the **full catalog** of the API (this matches Auth0 behavior).
So the common case — "I made a client, put the id/secret in the SDK, and expect
access" — just works without enumerating permissions. Request specific scopes only
when you want to *narrow* what a particular integration can do (least privilege).

> Tip: there are no per-client grant lists to configure. Migrating an integration is
> just "point it at the right `domain` and give it credentials"; the SDK handles
> audience, and an empty scope request yields the full catalog.

## Extending the flow: Actions

[Actions](../extensibility/actions.md) run **your JavaScript inside the auth flow** at
hooks like `postLogin`. Use them to enforce rules (block a login, add custom claims)
or to **pause the flow and send the user to your own UX**.

Canonical example — **progressive profiling**: a social provider didn't return a
required field (classic: GitHub with a private email). A `postLogin` Action can call
`api.redirect.sendUserTo(url)` to pause the flow, you collect the missing data in your
own page, then resume at `/continue`. To guarantee the data is really there, the
continue hook should `api.access.deny(reason)` if the field is still empty — otherwise
a user could close the tab and replay to log in with an incomplete profile.

You don't need to *write* Actions to pass this course, but you must know **what they're
for** and the progressive-profiling pattern.

## Reacting to changes: Webhooks

[Webhooks](../extensibility/webhooks.md) are signed HTTPS callbacks Faable sends on
events like `user.created`, `user.updated`, `user.deleted`, `auth.login`. Use them to
keep your own systems in sync. **Always verify the signature** before trusting a
payload.

## Check yourself

1. A nightly job updates user locales. Which grant and which SDK?
2. You create an M2M client and request **no scopes**. Can it read users?
3. Your M2M call returns `aud_mismatch`. What's wrong, and does the SDK normally
   prevent this?
4. GitHub login succeeds but the user has no email. Which feature do you reach for?

<details>
<summary>Answers</summary>

1. **Client Credentials** grant via **`@faable/auth-sdk`** (server-side).
2. **Yes** — an M2M client requesting no scopes is granted the **full catalog** of the
   management API (Auth0 parity).
3. The token's **audience** isn't the tenant's `faable:management:<account_id>`. The
   SDK **auto-discovers** the correct audience from `domain`, so this usually means a
   misconfigured `domain` or a hand-rolled token bypassing the SDK.
4. An **Action** (`postLogin`) for **progressive profiling** — pause the flow, collect
   the email, resume, and `deny` if still missing.
</details>

---

You've finished the modules. Now do the **[Hands-on Lab](lab.md)**, then take the
**[Certification Exam](exam.md)**.
