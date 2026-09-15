---
title: Hosted Login UI
description: You do not have to build login, signup, password reset, two-factor or passkey screens for your project. Faable Auth hosts them on your auth domain, branded as yours; your app redirects to /authorize and gets the user back signed in.
---

# Hosted Login UI

**You do not have to build the authentication screens for your project.** Sign-in, sign-up, password reset, two-step verification, passkey enrolment, device authorisation — Faable Auth serves all of them on your auth domain, with your logo, and you never write a login form.

That is the Hosted Login UI. Your application sends the user to `/authorize` and gets them back authenticated; everything in between is these screens. If you would rather build your own, you can — the same endpoints are there — but everything below is what you would be re-implementing.

## Why they are hosted, and not a form in your app

This is not about saving you an afternoon of HTML. Four things only work from the auth domain:

**A passkey belongs to the origin that created it.** WebAuthn binds the credential to the domain, so a passkey created on `app.example.com` cannot be used to sign in at `auth.example.com` — or at your second application. Registering them from one place is what makes them work everywhere.

**The session is a cookie on the auth domain.** That cookie (`faable_sess`) is what lets a second application skip the login screen entirely: the next `/authorize` finds an existing session and returns without asking for anything. That is single sign-on, and it cannot happen if each app holds its own form.

**Credentials never reach your code.** A password is posted from the login screen to the auth server. Your application never sees it, never logs it by accident, and a compromise of your frontend does not become a compromise of your users' passwords.

**One place to improve.** Two-step verification, passkeys, rate limits, the suspended-account message, the wording of an expired code — they land on every one of your applications at once, without a release on your side.

## The screens

All of them live under `/flow` on your auth domain (`https://<your-account>.auth.faable.link`, or your [custom domain](custom-domain.md)).

| Screen                | Path                         | What it is for                                                |
| --------------------- | ---------------------------- | ------------------------------------------------------------- |
| Sign in               | `/flow/login`                | The methods this client offers, in the order you chose        |
| Email first           | `/flow/identify`             | Asks for the address before showing a method                  |
| Two-step verification | `/flow/mfa/challenge`        | Authenticator app, security key or passkey as a second factor |
| Add a second factor   | `/flow/mfa/enroll`           | Enrolling an authenticator app, with its recovery codes       |
| Passkey offer         | `/flow/passkey/offer`        | Shown right after a login, inviting the user to create one    |
| Forgot password       | `/flow/forgot-password`      | Requests the reset email                                      |
| Reset password        | `/flow/reset-password`       | Sets the new one, against the tenant's password policy        |
| Security methods      | `/flow/account/security`     | Where a signed-in user manages their own factors              |
| Device activation     | `/flow/device-code/activate` | Enters the code a CLI or a TV app is showing                  |
| Device confirmation   | `/flow/device-code/confirm`  | Names the device and asks the user to authorise it            |

A user reaching one of these without a session is sent through the login and brought back where they were.

## What your application does

Nothing but the redirect. With [`@faable/auth-js`](quickstart):

```ts
import { createClient } from '@faable/auth-js'

const auth = createClient({
  domain: 'https://<your-account>.auth.faable.link',
  clientId: '<your-client-id>'
})

// Sends the browser to the hosted login and returns with a session.
await auth.authorize()
```

Or, without the SDK, any OAuth 2.0 / OIDC library pointed at `/authorize` — the screens are the same either way. See [OAuth 2.0 Flows](oauth-flows).

## Making them yours

| What                                             | Where                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Logo and icon                                    | **Branding** in the dashboard — used as the header of every screen        |
| Which methods, in what order, passkeys on or off | [Login Experience](login-experience.md), per account and per client       |
| The order the screens run in                     | [Login Flows](login-flows.md)                                             |
| Your own domain in the address bar               | [Custom Domain](custom-domain.md)                                         |
| Language                                         | Served in English or Spanish, chosen from the browser's `Accept-Language` |

<Callout type="info">
  Because a passkey is bound to its origin, move to a custom domain **before**
  users start enrolling — or set a WebAuthn Relying Party ID you own. See
  [Login Experience](login-experience.md#sign-in-with-a-passkey).
</Callout>

## The one screen your users go to on their own

`/flow/account/security` is the exception: it is not part of a login, and you can link to it from your own account settings. A user manages their authenticator app, security keys and passkeys there, on the domain those credentials belong to.

Link to it with the `client_id` of the application they came from, so a user who arrives without a session is sent back to the right login:

```
https://<your-auth-domain>/flow/account/security?client_id=<your-client-id>
```

## Related

- [Login Experience](login-experience.md) — what the sign-in screen offers, and how to change it.
- [Two-Step Verification](mfa.md) — the second factor these screens ask for.
- [Login Flows](login-flows.md) — the graph the screens walk through.
- [Custom Domain](custom-domain.md) — serving them from a domain you own.
