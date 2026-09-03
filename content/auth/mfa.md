---
title: Two-Step Verification
description: Add a second factor to your logins — authenticator app codes, security keys and passkeys — or let users sign in with a passkey and no password at all.
---

# Two-Step Verification

A password, a magic link or a social login all prove **one** thing. Two-step verification asks for a second, so a stolen password on its own is not enough.

Faable Auth supports two kinds of second factor:

- **Authenticator app (TOTP)** — the six-digit codes from Google Authenticator, 1Password, Authy and friends.
- **Security keys and passkeys (WebAuthn)** — Touch ID, Face ID, Windows Hello or a hardware key.

Passkeys can also replace the password entirely: see [Signing in with a passkey](#signing-in-with-a-passkey) below.

Everything here is hosted. Your users enrol and verify on Faable Auth's own screens, and your application never handles a code or a credential.

## Turning it on

In the dashboard, open your auth account and go to **Security → Two-step verification**. There are three modes:

| Mode         | What happens                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Off**      | Nobody is asked. Users can still enrol a method from their own security page. This is the default.                                                  |
| **Optional** | Users who enrolled a method are asked for it. Users who have not are let in.                                                                        |
| **Required** | Everybody is asked. Users with no method are taken through enrolment **during** login — turning this on never locks out the users you already have. |

You can also restrict which methods count (authenticator app, security key, or both), and a single client can override the account policy — useful when only your admin application needs it.

<Callout type="info">
  Turning the policy on is available from the **Hobby** plan up. Logins already
  in flight are never affected, and downgrading a plan does not silently switch
  an existing policy off.
</Callout>

## What your users see

When the policy asks for a second factor, the login pauses on a Faable-hosted screen and picks up exactly where it left off once the factor checks out. Nothing changes in your application: the same `redirect_uri` receives the same authorization code, just a few seconds later.

Users manage their own methods at `https://<your-auth-domain>/flow/account/security`, where they can add an authenticator app, add a security key or passkey, and remove either.

**Recovery codes** are issued once, when a user confirms their first method. They are shown a single time and each one works once. They are the way back in when the phone is gone — and the only one, short of an administrator removing the method (see below).

## Remember this browser

Set **Remember this browser** to a number of days and a browser that passed a challenge is not asked again until that many days have gone by. The default, `0`, asks every time.

It is a signed cookie on the auth domain, bound to the user, that deliberately outlives the session: signing out and back in on the same browser skips the second step, a different browser does not. Setting the number back to `0` stops honouring the cookie immediately — you do not have to wait for the ones already out there to expire.

## Unblocking a user who lost their device

Open the user in the dashboard, find **Two-step verification** and remove the method. That does not let them in by itself: with a `required` policy their next login takes them through enrolment again.

There is deliberately no way for an administrator to _add_ a factor on someone's behalf — a factor an administrator enrolled proves nothing about the user holding it.

## Signing in with a passkey

A passkey verified with a biometric or a PIN proves possession **and** knowledge in a single gesture, which is why a passkey login is not asked for a second factor afterwards.

Enable it under **Login Experience → Passkeys**. The login screen grows a "Continue with a passkey" button, and browsers that support it also offer the passkey from inside the email field, so returning users often never click anything.

<Callout type="warning">
  A passkey is bound to the domain it was created on. If your login moves to a
  [custom domain](custom-domain.md), every passkey registered on the old domain
  stops working. Set a **WebAuthn Relying Party ID** to a domain you own (e.g.
  `example.com`) **before** users start enrolling, and passkeys keep working
  across every host under it.
</Callout>

## In the tokens

A login that satisfied a second factor says so, following [RFC 8176](https://datatracker.ietf.org/doc/html/rfc8176):

```json
{
  "amr": ["pwd", "otp", "mfa"],
  "acr": "urn:faable:loa:2"
}
```

`amr` lists how the user authenticated (`pwd`, `otp`, `hwk` for a hardware key, `federated` for a social login, `mfa` once a second factor was satisfied). `acr` is `urn:faable:loa:1` for a single factor and `urn:faable:loa:2` for two. Both are advertised in the [discovery document](oidc) and both survive a token refresh — refreshing is not re-authenticating.

Read them in your application straight from the session, no network call:

```ts
const aal = await auth.getAal() // 0 signed out · 1 one factor · 2 second factor satisfied
const usedPasskey = await auth.hasAmr('hwk')
```

Or as hooks, with `@faable/auth-helpers-react`:

```tsx
const aal = useAal()
const usedPasskey = useHasAmr('hwk')
```

### Asking for a step-up

A session that signed in with one factor can be raised to two before a sensitive action — changing payment details, deleting an organisation — without changing the tenant's policy for everyone:

```ts
if ((await auth.getAal()) < 2) {
  auth.stepUp({ redirectTo: window.location.href })
  return
}
```

`stepUp()` sends the user through `/authorize` with `acr_values=urn:faable:loa:2` and `prompt=login`, so the server asks for a second factor even if the policy is `optional` and even if a single-factor session already exists. Users with nothing enrolled are taken through enrolment. When they land back, `getAal()` is `2`.

## Direct grants

The [passwordless OTP grant](passwordless.mdx) has no browser to send anywhere, so it uses a two-step exchange instead. When a policy applies, the token endpoint answers:

```http
HTTP/1.1 403 Forbidden

{
  "error": "mfa_required",
  "mfa_token": "…",
  "mfa_required_factors": ["totp"]
}
```

Come back with the code:

```http
POST /oauth/token

grant_type=http://auth0.com/oauth/grant-type/mfa-otp
&client_id=…
&mfa_token=…
&otp=123456
```

Use `http://auth0.com/oauth/grant-type/mfa-recovery-code` with a `recovery_code` parameter instead when the user falls back to a recovery code. The `mfa_token` is single-use and short-lived; a wrong code does not burn it, so the user can retry.

With `@faable/auth-js` the same exchange is two calls and a typed error in between:

```ts
import { isAuthMfaRequiredError } from '@faable/auth-js'

const { error } = await auth.signInWithOtp({ username: email, otp })
if (isAuthMfaRequiredError(error)) {
  if (error.factors.length === 0) {
    // Nothing enrolled yet: send them to the hosted security page.
    return
  }
  const code = await askForTheirCode() // six digits, or a recovery code
  await auth.signInWithMfa({ mfa_token: error.mfa_token, code })
  // type: 'recovery_code' when it was one of those
}
```

`signInWithMfa` stores the session and fires `MFA_CHALLENGE_VERIFIED` followed by `SIGNED_IN`, so an `onAuthStateChange` subscriber that only cares whether there is a session keeps working unchanged.

## Limits

- Five wrong codes in five minutes locks verification for that user. During the lockout even a correct code waits.
- A TOTP code works once. Reusing one inside its 30-second window is rejected.
- Clock drift of up to 30 seconds either way is tolerated. If codes are consistently rejected, check the clock on the user's device.

## Related

- [Sign in with Face ID or a passkey in Next.js](guides/nextjs-passkeys.mdx) — the end-to-end guide
- [Passwordless](passwordless.mdx) — magic links and emailed codes
- [Custom Domain](custom-domain.md) — read the passkey warning above first
- [Pricing](pricing.mdx)
