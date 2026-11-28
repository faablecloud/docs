---
title: Disable a Tenant
description: Switch a whole Faable Auth tenant off without deleting it. Nobody can sign in and management writes are refused, while reads keep working. Enabling it brings everything back.
---

# Disable a Tenant

Disabling a tenant **stops every sign-in to it without deleting anything**. Users, connections, clients, roles and settings are all kept, and you can still see them in the dashboard. Enabling the tenant again brings it back exactly as it was.

Use it when an application is retired or paused, or when you need to stop all access at once while you investigate something. To block a single person instead, [suspend the user](suspend-users.md). To remove a tenant for good, delete it from **Settings → Danger Zone**.

## Disabling from the dashboard

Open the tenant's **Settings** and scroll to the **Danger Zone**:

- **Disable this tenant**: a confirmation dialog explains what stops, then switches it off.
- **Enable this tenant**: appears once the tenant is disabled and switches it back on.

While the tenant is disabled, every page of it in the dashboard shows a banner saying so.

## Disabling via the Management API

Disabling and enabling go through the tenant's [Management API](academy/05-server-and-management-api.md). Both need a management token with the `update:accounts` scope, and both are idempotent.

With [`@faable/auth-sdk`](academy/05-server-and-management-api.md):

```ts
// Disable
const account = await api.accountDisable(accountId)
console.log(account.disabled_at, account.disabled_by) // '2026-11-28T10:58:04.049Z', 'owner'

// Enable
await api.accountEnable(accountId)
```

Or over raw HTTP against your tenant (e.g. `https://acme.auth.faable.link`):

```http
POST /account/account_123/disable
Authorization: Bearer <management_access_token>
```

```http
POST /account/account_123/enable
Authorization: Bearer <management_access_token>
```

Both return the tenant.

### Tenant fields

| Field         | Type                      | Notes                                                                                      |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| `disabled_at` | string (ISO 8601) or null | When the tenant was disabled. `null` while it is enabled. Read-only.                       |
| `disabled_by` | `owner`, `staff` or null  | Who disabled it: you (`owner`) or Faable (`staff`). `null` while it is enabled. Read-only. |

## What a disabled tenant blocks

Every refusal is a `403` with the error code [`account_disabled`](errors.md#account_disabled). `details.disabled_by` says who disabled the tenant.

| Surface                                                   | Result while disabled                                                                                    |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [Hosted login](hosted-login.mdx)                          | Shows «Sign-in is unavailable» to the person signing in. It does not say who disabled the tenant or why. |
| `/authorize` in a browser                                 | The hosted error page, with `account_disabled`.                                                          |
| Token endpoint (every grant, `refresh_token` included)    | `403` with OAuth error `invalid_grant` and `error_code: "account_disabled"`.                             |
| Passwordless, sign-up and password reset                  | `403 account_disabled`.                                                                                  |
| Management API: writes (`POST`, `PATCH`, `PUT`, `DELETE`) | `403 account_disabled`.                                                                                  |
| Management API: reads (`GET`)                             | Work as usual.                                                                                           |
| Discovery, JWKS and `/oauth/revoke`                       | Work as usual.                                                                                           |

> [!NOTE]
> **Access tokens already issued remain valid until they expire.** Faable access tokens are stateless JWTs (default lifetime 24h), so a resource server that validates them against your JWKS keeps accepting a live token until it expires. Nothing is revoked: refresh tokens stop working while the tenant is disabled and work again once it is enabled.

### In your application

With [`@faable/auth-js`](academy/04-integrate-your-app.md), the next token refresh fails while the tenant is disabled. The SDK then ends the local session, emits `SIGNED_OUT` and records why, so your sign-in page can say what happened (`ErrorCode` includes `account_disabled` from version 3.10.0):

```ts
const reason = await auth.getSignOutReason()
if (reason?.code === 'account_disabled') {
  // Sign-in to this app is switched off for now.
}
```

Users signed out this way sign in again once the tenant is enabled.

## Disabled by Faable

Faable can also disable a tenant, for example for abuse or at the end of a contract. In that case `disabled_by` is `staff`, and:

- the project owner and billing contact get an email;
- the dashboard says the tenant was disabled by Faable staff and offers no **Enable** button;
- `POST /account/:account_id/enable` and `DELETE /account/:account_id` answer `403 account_disabled` with `details.disabled_by: "staff"`.

To have it enabled again, write to [support@faable.com](mailto:support@faable.com).

## Limits

Faable's own platform tenants cannot be disabled: the request answers `409` [`account_protected`](errors.md#account_protected).
