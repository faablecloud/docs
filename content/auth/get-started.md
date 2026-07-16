---
title: Get Started
description: Set up Faable Auth in minutes — create a tenant, register a client, and authenticate your first user using OAuth 2.0, OpenID Connect, social login, or passwordless.
---

# Get Started with Faable Auth

Faable Auth is a multi-tenant identity platform built around the OAuth 2.0 and OpenID Connect standards. You get social login, passwordless, enterprise SSO/SAML, RBAC, MFA, custom domains and audit logs out of the box — without writing or maintaining any of the protocol plumbing yourself.

> New to the concept? Read [What is a multi-tenant identity server?](what-is-a-multi-tenant-identity-server.mdx). Comparing platforms? See [Faable Auth vs Auth0, Clerk & Keycloak](compare.mdx).

## How Faable Auth is structured

Four concepts are enough to model the whole product:

- **Account** — your auth tenant. Hosted at `https://<account>.auth.faable.link` or under your [custom domain](custom-domain.md).
- **Connections** — sources of users: database (email + password), social (Google, GitHub, Apple, Facebook…), passwordless, generic OIDC.
- **Clients** — the applications that drive an OAuth flow against your account.
- **Users & Teams** — identities created via your connections, grouped into teams with RBAC.

## Prerequisites

1. Create an account on the **[Faable Dashboard](https://dashboard.faable.com)**.
2. Create an **Auth Account** (your tenant). Note the auth domain shown in the dashboard.
3. Create a **Client** for your application. Save the **Client ID** and configure the **Allowed Callback URLs** (e.g. `http://localhost:3000/callback` for local dev).
4. Enable at least one **[Connection](connections.md)** — a social provider, passwordless, or database.

## Your first sign-in

Pick the path that matches your stack.

### Path A — use a Quickstart

The fastest way to add login to an existing app.

- **[React Quickstart](quickstart/react.md)** — Vite SPA + session hooks from `@faable/auth-helpers-react`.
- **[Next.js Quickstart](quickstart/nextjs.md)** — App Router + client SDK with PKCE.
- **[React Native Quickstart](quickstart/react-native.md)** — Expo + Faable Auth helpers.

### Path B — roll your own using the SDK

Build directly on `@faable/auth-js` for a custom integration:

```ts
import { createClient } from '@faable/auth-js'

const auth = createClient({
  domain: 'your-tenant.auth.faable.link',
  clientId: '<your_client_id>'
})

await auth.signInWithOauthConnection({
  redirectTo: 'https://app.example.com/callback'
})
```

The SDK handles the PKCE handshake, the redirect, and the token exchange. See the [Authorization Code Flow](oauth-flows/authorization-code.mdx) for what happens under the hood.

## What you can build

Once a user can sign in, Faable Auth gives you the building blocks for the rest of your identity experience:

| Feature                                     | What it gives you                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **[Change Email](change-email.md)**         | Self-service email update with ownership verification (and optional double-confirmation).                                |
| **[Team Invitations](team-invitations.md)** | Invite users by email; existing users are added directly, unknowns get a magic link that creates their account on click. |
| **[Passwordless](passwordless.md)**         | Magic link or OTP login, no password to remember.                                                                        |
| **[Actions](extensibility/actions.md)**     | Run JavaScript in the auth flow to enforce rules or redirect through custom UI.                                          |
| **[Webhooks](extensibility/webhooks.md)**   | Signed HTTPS callbacks for `user.created`, `user.updated`, `user.deleted`, `auth.login`.                                 |
| **[APIs](apis.md)**                         | Register backend resource servers and define scoped permissions.                                                         |
| **[Logs](logs.md)**                         | Audit email deliveries, webhook calls, and authentication events.                                                        |
| **[Custom Domain](custom-domain.md)**       | Serve the login UI under your own branded domain with auto-renewed SSL.                                                  |
| **[OIDC Logout](oidc/logout.md)**           | RP-Initiated + Front-Channel logout across every signed-in application.                                                  |
| **[UserInfo](oidc/userinfo.md)**            | Standard claims endpoint, scope-gated per OIDC §5.4.                                                                     |

## SDKs and libraries

- **[`@faable/auth-js`](https://www.npmjs.com/package/@faable/auth-js)** — client SDK for browsers and React Native (PKCE, session management, token refresh).
- **[`@faable/auth-sdk`](https://www.npmjs.com/package/@faable/auth-sdk)** — server-side SDK for Node.js (token verification, admin operations).
- **[`@faable/auth-helpers-react`](https://www.npmjs.com/package/@faable/auth-helpers-react)** — React hooks for session and user state.

## Pricing & limits

See **[Auth pricing](pricing.md)** for MAU allowances and per-feature gating, and the [unified platform pricing](../platform/pricing.md) for plans and support tiers.
