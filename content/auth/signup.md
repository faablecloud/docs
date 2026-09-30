---
title: Signup
description: Register users by email or username from a fully client-side form, with or without signing them in, and detect brand-new accounts on the OAuth callback so you can trigger onboarding.
---

# Signup

Faable Auth lets you build a **self-service signup** for database connections without standing up a backend of your own. A browser-only app can create the account — and, if you want, sign the user in — with a single SDK call. For social logins, the callback tells you when an account was just created so you can branch into onboarding.

## Client-side signup

[`@faable/auth-js`](quickstart/nextjs.mdx) has two methods, named after their Auth0 counterparts:

| Method             | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `signup()`         | Creates the user and returns it. No login, no navigation. |
| `signupAndLogin()` | Creates the user, then signs them in through a redirect.  |

### Create the user and sign in

```ts
import { createClient } from '@faable/auth-js'

const auth = createClient({
  domain: 'https://your-tenant.faable.app',
  clientId: '<your_client_id>'
})

const { error } = await auth.signupAndLogin({
  email: 'user@example.com',
  password: '••••••••',
  name: 'Ada Lovelace',
  redirectTo: 'https://app.example.com/callback'
})

if (error) {
  // e.g. error.code === 'signup_disabled' | 'email_exists' | 'weak_password'
  showError(error.message)
}
// On success the browser is already navigating to complete the login.
```

> [!IMPORTANT]
> **`signupAndLogin()` logs the user in through a redirect.** Just like every interactive username/password login in the SDK, the sign-in step submits a form that round-trips through the auth server. On success the browser navigates to your `redirectTo`, where [`initialize()`](quickstart/nextjs.mdx) delivers the live session and fires a `SIGNED_IN` event. It only returns when the signup or the login fails.

### Only create the user

`signup()` stops after creating the user, so the page stays where it is. Use it for forms that register people who won't log in right away — a contact form, a waitlist, an admin inviting someone:

```ts
const { data, error } = await auth.signup({
  email: 'user@example.com',
  name: 'Ada Lovelace',
  user_metadata: { source: 'contact-form' }
})

if (error?.code === 'email_exists') showAlreadyRegistered()
else if (error) showError(error.message)
else console.log('created', data.user_id)
```

**The password is optional.** Without one, the user is created with no password at all — not a random or empty one — and nothing can sign in with a password until they set it through the password reset email ([Forgot password](hosted-login.mdx#forgot-password) on the hosted login). That is why a signup without a password needs an `email`. (Auth0 takes the other route and rejects a signup without a password.)

### Email or username

Which identifier a signup needs follows the database connection's **login identifier** (see [What users sign in with](connections.md#what-users-sign-in-with)):

| Login identifier    | Signup needs                       |
| ------------------- | ---------------------------------- |
| `email`             | `email`. A `username` is rejected. |
| `username`          | `username`. `email` is optional.   |
| `email_or_username` | Either one, or both.               |

A username is stored exactly as typed (case-sensitive) and can't contain `@` or whitespace. `signupAndLogin()` signs in with the email when there is one, and with the username otherwise.

The new user is created with `email_verified: false`. Whether a verification or welcome email goes out is controlled by your tenant's account settings (`verify_email_auto_send`, `welcome_email_enabled`) — see [Welcome email](#welcome-email) below.

### Parameters

| Field                               | Required                | Description                                                                                                           |
| ----------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `email`                             | see above               | Email identifier. Required on an `email` connection, and whenever `password` is omitted.                              |
| `username`                          | see above               | Username identifier. Required on a `username` connection.                                                             |
| `password`                          | `signupAndLogin()` only | Validated against the connection's password policy, hashed server-side. Optional in `signup()`.                       |
| `name`, `given_name`, `family_name` | no                      | Optional profile fields stored on the user.                                                                           |
| `user_metadata`                     | no                      | Arbitrary key/value metadata stored on the user.                                                                      |
| `connection`                        | no                      | Connection name, when the tenant has more than one database connection. Defaults to the tenant's database connection. |
| `redirectTo`                        | no (`signupAndLogin()`) | Where the login lands after the redirect. Defaults to `config.redirectUri` / the current origin.                      |

### `signUp()`

Earlier versions of the SDK had a single `signUp()` that created the user and signed them in. It still works the same way: it behaves like `signupAndLogin()` by default, and like `signup()` when you pass `signIn: false`. New code should call one of the two methods above.

## Welcome email

With `notification_settings.welcome_email_enabled` on, every new user receives the built-in welcome email once their address is verified. The default copy is generic (`Welcome to <account>`, a button to the first entry of `callback_hostnames`). You can personalise it per tenant with the `welcome_email` object of the account, through the management API (`POST /account/:id`) — the whole object is replaced on every update, and `null` returns to the generic copy.

```json
{
  "welcome_email": {
    "cta_url": "https://app.example.com/onboarding",
    "body": "Your account is ready. Create your first project from the dashboard.",
    "social_links": [
      { "label": "GitHub", "url": "https://github.com/example" },
      { "label": "LinkedIn", "url": "https://www.linkedin.com/company/example" }
    ]
  }
}
```

| Field          | Description                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cta_url`      | Where the button sends the user. Defaults to `https://<first callback hostname>` — point it at your app, not your marketing site, so a fresh user lands somewhere useful. |
| `body`         | Replaces the default one-line body. Plain text, sent verbatim in every locale the account enables.                                                                        |
| `social_links` | Up to six `{ label, url }` entries rendered as a "Follow <account>" block after the button (and one per line in the plain-text part). Empty or absent hides the block.    |

See [Email Sending](email-sending.md) for the address these come from and how to let users reply.

The subject, greeting and signature stay localised (`Welcome to <account>` / `Bienvenido a <account>`), so the email keeps working for tenants that enable more than one locale.

## The signup endpoint

Under the hood both methods call a public, account-scoped endpoint. You can call it directly (for example from a non-JS client):

```http
POST /dbconnections/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "••••••••",
  "name": "Ada Lovelace"
}
```

`email`, `username` and `password` follow the same rules as in the SDK: the identifier depends on the connection's login identifier, and `password` can be left out when there is an `email`.

Response:

```json
{
  "status": "created",
  "user_id": "user_abc",
  "email_verified": false
}
```

It creates the user and the database credential in one step. It does **not** establish a session — sign the user in afterwards (`signupAndLogin()` does this for you).

### Authentication & limits

- The endpoint is **public** (account-scoped, resolved by host) — no management token required. It can only ever create a new, unverified user.
- Rate-limited to **5 requests per minute** per IP.

### Errors

| HTTP | `error_code`        | Meaning                                                                                                           |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 400  | `bad_request`       | A required identifier is missing for this connection, or there is no password and no email. `message` says which. |
| 400  | `invalid_username`  | The username is empty or contains `@` or whitespace, or the connection signs in by email only.                    |
| 400  | `password_too_weak` | The password fails the connection's [password policy](connections.md). `message` lists what is missing.           |
| 403  | `signup_disabled`   | Public signup is turned off for this connection (see below).                                                      |
| 409  | `email_taken`       | A credential with that email already exists in the connection.                                                    |
| 409  | `username_taken`    | A credential with that username already exists in the connection.                                                 |

In `@faable/auth-js` these surface as an `AuthApiError` with a stable `code`: `signup_disabled`, `email_exists`, `username_exists`, `weak_password`, or `validation_failed` for the other 400s.

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
