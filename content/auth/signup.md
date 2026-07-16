---
title: Signup
description: Register users with email + password from a fully client-side form, and detect brand-new accounts on the OAuth callback so you can trigger onboarding.
---

# Signup

Faable Auth lets you build a **self-service signup** for database (email + password) connections without standing up a backend of your own. A browser-only app can create the account and sign the user in with a single SDK call. For social logins, the callback tells you when an account was just created so you can branch into onboarding.

## Client-side email + password signup

Use [`@faable/auth-js`](quickstart/nextjs.mdx) `signUp()` from a plain client-side form. It creates the user and its password against your tenant's database connection, then signs them in:

```ts
import { createClient } from '@faable/auth-js'

const auth = createClient({
  domain: 'https://your-tenant.faable.app',
  clientId: '<your_client_id>'
})

const { error } = await auth.signUp({
  email: 'user@example.com',
  password: '••••••••',
  name: 'Ada Lovelace',
  redirectTo: 'https://app.example.com/callback'
})

if (error) {
  // e.g. error.code === 'signup_disabled' | 'email_exists'
  showError(error.message)
}
// On success the browser is already navigating to complete the login.
```

> [!IMPORTANT]
> **`signUp()` logs the user in through a redirect.** Just like every interactive username/password login in the SDK, the sign-in step submits a form that round-trips through the auth server. On success the browser navigates to your `redirectTo`, where [`initialize()`](quickstart/nextjs.mdx) delivers the live session and fires a `SIGNED_IN` event. `signUp()` only returns synchronously when signup itself fails.

The new user is created with `email_verified: false`. Whether a verification or welcome email goes out is controlled by your tenant's account settings (`verify_email_auto_send`, `welcome_email_enabled`) — see [Connections](connections.md).

### Parameters

| Field                               | Required | Description                                                                                                           |
| ----------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `email`                             | yes      | The login identifier for the new account.                                                                             |
| `password`                          | yes      | Validated against the connection's password policy, hashed server-side.                                               |
| `name`, `given_name`, `family_name` | no       | Optional profile fields stored on the user.                                                                           |
| `user_metadata`                     | no       | Arbitrary key/value metadata stored on the user.                                                                      |
| `connection`                        | no       | Connection name, when the tenant has more than one database connection. Defaults to the tenant's database connection. |
| `redirectTo`                        | no       | Where the auto-login lands after the redirect. Defaults to `config.redirectUri` / the current origin.                 |

## The signup endpoint

Under the hood `signUp()` calls a public, account-scoped endpoint. You can call it directly (for example from a non-JS client):

```http
POST /dbconnections/signup
Content-Type: application/json

{
  "client_id": "<your_client_id>",
  "email": "user@example.com",
  "password": "••••••••",
  "name": "Ada Lovelace"
}
```

Response:

```json
{
  "status": "created",
  "user_id": "user_abc",
  "email_verified": false
}
```

It creates the user and the database credential in one step. It does **not** establish a session — sign the user in afterwards (the `signUp()` helper does this for you).

### Authentication & limits

- The endpoint is **public** (account-scoped, resolved by host) — no management token required. It can only ever create a new, unverified user.
- Rate-limited to **5 requests per minute** per IP.

### Errors

| HTTP | `message`            | Meaning                                                                |
| ---- | -------------------- | ---------------------------------------------------------------------- |
| 400  | password policy text | The password fails the connection's [password policy](connections.md). |
| 403  | `signup_disabled`    | Public signup is turned off for this connection (see below).           |
| 409  | `email_taken`        | A credential with that email already exists in the connection.         |

In `@faable/auth-js` these surface as an `AuthApiError` with a stable `code` (`signup_disabled`, `email_exists`).

### Disabling signup

Public signup is on by default. To turn it off for a connection, set `disable_signup: true` on the database [Connection](connections.md) (dashboard or management API):

```http
POST /connection/:connection_id
Content-Type: application/json
Authorization: Bearer <management_token>

{
  "disable_signup": true
}
```

With signup disabled, `POST /dbconnections/signup` returns `403 signup_disabled` and you can restrict account creation to admins provisioning users via the management API.

## Detecting new accounts on the OAuth callback

For social / OAuth logins there is no signup form — the account is created transparently on first login. To let your app tell a **first-time** login apart from a returning one, the auth server appends `?signup=true` to the `redirect_uri` when the callback just created a new account:

```
https://app.example.com/callback?code=…&state=…&signup=true
```

`@faable/auth-js` lifts this into the result of `initialize()` / `handleRedirectCallback()` as `is_new_user`, and strips the marker from the URL:

```ts
const result = await auth.handleRedirectCallback()
if (result.is_new_user) {
  // brand-new account — send them to onboarding, fire a signup analytics event…
  router.push('/welcome')
}
```

> [!NOTE]
> Only **social / OAuth** logins signal this today. Passwordless and username/password callbacks always report `is_new_user: false`. The marker lives only on the callback URL — it is never a claim in the issued tokens.

## Next steps

- [Connections](connections.md) — configure the database connection, its password policy, and welcome/verification emails.
- [Change Email](change-email.md) — let users update their address after signup.
- [Authorization Code with PKCE](oauth-flows/authorization-code.mdx) — the flow behind the callback and `is_new_user`.
