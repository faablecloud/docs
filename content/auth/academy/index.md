---
title: Faable Auth Academy — Integrator
description: A hands-on minicourse that takes you from OAuth basics to a working Faable Auth integration. Pass the lab and exam to earn the Faable Auth Integrator credential.
---

# Faable Auth Academy — Integrator

A short, practical course for **developers who integrate applications with Faable
Auth**. By the end you will be able to add login to an app, model a tenant
(clients, connections, users, teams), call the Management API from a backend with
the SDK, and reason about tokens and scopes.

This is the **Integrator** track. A separate **Operator** track (for people who
run and extend the auth server itself) is planned later.

## Who this is for

- Frontend / fullstack devs adding sign-in to a web or mobile app.
- Backend devs that need to read or mutate users, clients or connections from
  server code (machine-to-machine).
- Anyone who needs a working mental model of OAuth 2.0 / OIDC as Faable implements it.

**No prior OAuth knowledge required.** Basic JavaScript/TypeScript and HTTP are enough.

## How the course works

1. **Read the 5 modules** (~15–20 min each). They are intentionally short and link
   into the full [Faable Auth docs](/auth/get-started) for depth.
2. **Do the [hands-on lab](/auth/academy/lab)** in a throwaway practice tenant. This is where
   the learning sticks — you create a client, integrate a tiny app, and mint an M2M token.
3. **Take the [certification exam](/auth/academy/exam)**: ~18 questions (concepts) + 3 practical
   tasks you complete in your lab tenant and submit evidence for.

### Earning the credential

To pass you need **≥ 80% on the written part AND all 3 practical tasks accepted**.
On success you receive the **Faable Auth Integrator** badge — issued as a signed
JWT minted by the `auth-academy` client with a `cert: "integrator"` claim, so the
credential is itself a Faable Auth token (we dogfood our own product). Your manager
or the platform team grades the practical tasks against the rubric.

## Syllabus

| Module                                                                         | You'll learn                                                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| [1 · OAuth & OIDC Foundations](/auth/academy/01-oauth-foundations)             | Why OAuth exists; `id_token` vs `access_token`; scopes; the actors in a flow.       |
| [2 · Tenant Building Blocks](/auth/academy/02-tenant-building-blocks)          | Account, Connections, Clients, Users & Teams — and how multi-tenancy works by host. |
| [3 · Login & Flows](/auth/academy/03-login-and-flows)                          | Authorization Code + PKCE, social, passwordless OTP, refresh tokens.                |
| [4 · Integrate Your App](/auth/academy/04-integrate-your-app)                  | Add login with `@faable/auth-js`, handle the callback, read the session.            |
| [5 · Server-side & Management API](/auth/academy/05-server-and-management-api) | `client_credentials`, audience + scopes, `@faable/auth-sdk`, Actions & webhooks.    |

## What this course is _not_

It does not cover operating the auth server (deployment, key rotation, the authz
enforcement layer, Mongo/Valkey internals). That's the **Operator** track.

---

Ready? Start with **[Module 1 — OAuth & OIDC Foundations](/auth/academy/01-oauth-foundations)**.
