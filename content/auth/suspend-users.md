---
title: Suspend Users
description: Block a user from signing in or obtaining tokens without deleting them. Suspension is enforced across every login flow, token grant, session and management-API call, and is fully reversible.
---

# Suspend Users

Suspension lets you **immediately block a user** — for abuse, fraud, a compromised account, or a billing hold — without deleting them or losing their data. A suspended user cannot log in, obtain new tokens, or use the management API, and any active browser session becomes inert. Lifting the suspension (**reinstating**) restores access instantly.

Unlike deleting a user, suspension is non-destructive and reversible: the account, its identities, credentials and metadata are all preserved.

## Suspending from the dashboard

Open the user's detail page (**Users → the user**) and use the actions menu (**⋮**) in the header:

- **Suspend** — opens a dialog where you enter a **reason** (recorded for audit), then confirms.
- **Reinstate** — appears once a user is suspended; a single confirmation lifts the block.

Suspended users are marked with a red dot on their avatar in the user list and on the detail header, and the profile shows a read-only **Suspended** field with the reason.

## Suspending via the Management API

Suspension is a standard user update, so it goes through the same [Management API](academy/05-server-and-management-api.md) as any other admin operation. It requires a management token with the `update:users` scope.

With [`@faable/auth-sdk`](academy/05-server-and-management-api.md):

```ts
// Suspend
await api.updateUser(userId, {
  suspended: true,
  suspended_reason: 'abuse: crypto-mining workload'
})

// Reinstate
await api.updateUser(userId, { suspended: false })
```

Or over raw HTTP against your tenant (e.g. `https://acme.auth.faable.link`):

```http
POST /user/user_123
Authorization: Bearer <management_access_token>
Content-Type: application/json

{
  "suspended": true,
  "suspended_reason": "abuse: crypto-mining workload"
}
```

### User fields

| Field              | Type              | Notes                                                                                    |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------- |
| `suspended`        | boolean           | `true` blocks the user everywhere. Defaults to `false`.                                  |
| `suspended_at`     | string (ISO 8601) | Stamped automatically when `suspended` flips to `true`; cleared on reinstate. Read-only. |
| `suspended_reason` | string            | Free-form note stored for audit. Cleared on reinstate.                                   |

Setting `suspended: false` clears both `suspended_at` and `suspended_reason` for you. Users cannot be created suspended — the field is only writable on update.

## What suspension blocks

The check runs everywhere a user authenticates or a token is minted:

| Surface                                                                                 | Result while suspended                                                |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Email/password, social and passwordless login                                           | Rejected — no session is created.                                     |
| Token endpoint (`authorization_code`, `refresh_token`, `device_code`, passwordless OTP) | `403` with OAuth error `invalid_grant` (`"user is suspended"`).       |
| `GET/POST /userinfo`                                                                    | `401` with `WWW-Authenticate: Bearer error="invalid_token"`.          |
| Silent SSO (`prompt=none`)                                                              | Treated as no session → the OIDC `login_required` error is returned.  |
| Your tenant's Management API                                                            | `403` immediately, for any token whose subject is the suspended user. |

Because the `refresh_token` grant is blocked, a suspended user's refresh tokens stop working on their next refresh — even though refresh tokens are otherwise long-lived.

> [!NOTE]
> **Access tokens already issued remain valid until they expire.** Faable access tokens are stateless JWTs (default lifetime 24h, configurable per API), so a resource server that validates them offline against your JWKS will keep accepting a live token until it expires. Suspension stops all _new_ tokens immediately and cuts off Faable's own endpoints (`/userinfo`, the Management API) right away; to bound the residual window, keep access-token lifetimes short for sensitive APIs.

## Listing suspended users

Filter the users list with the `suspended` field:

```http
GET /user?query=suspended:true
Authorization: Bearer <management_access_token>
```

With the SDK:

```ts
const { results } = await api.listUsers({ query: 'suspended:true' }).first()
```

## Audit log

Every suspension decision is recorded in your tenant's [logs](logs.md):

- Suspending or reinstating a user emits the standard `admin.user.updated` event.
- Each denied attempt while suspended emits an `auth.suspended` event with the flow that was blocked (login, token grant, userinfo, management API, …).

## Errors

| HTTP  | Code             | Meaning                                                                               |
| ----- | ---------------- | ------------------------------------------------------------------------------------- |
| `403` | `invalid_grant`  | Token-endpoint grant for a suspended user (`error_description: "user is suspended"`). |
| `401` | `invalid_token`  | `/userinfo` called with a token belonging to a suspended user.                        |
| `403` | `user_suspended` | Interactive login, `/me`, or a Management API call by a suspended user.               |

## Next steps

- [Logs](logs.md) — audit suspensions and blocked attempts.
- [Server-side & Management API](academy/05-server-and-management-api.md) — how to get a management token and call the admin surface.
- [Change Email](change-email.md) — another user-lifecycle operation.
