---
title: Sign In with Apple
description: Sign in with Apple is not yet supported by Faable Auth. Here is why the generic Custom OAuth2 path cannot cover it, and what to use in the meantime.
---

## Sign In with Apple

> **Not supported yet.** Faable Auth has no Apple connection type, and — unlike [Facebook](facebook.md) — Apple **cannot** be added through a [Custom OAuth2](../social) connection either. This page explains why, so you don't spend an afternoon discovering it the hard way.

## Why Custom OAuth2 doesn't cover Apple

Sign in with Apple (SIWA) is OAuth 2.0 shaped, but it departs from the generic flow in three ways that Faable's connection engine doesn't currently handle:

1. **The client secret is a signed JWT, not a string.** Apple requires the `client_secret` sent to its token endpoint to be an **ES256-signed JWT**, built from your Team ID, Key ID and a `.p8` private key, with a maximum lifetime of six months. It has to be regenerated on a schedule. Faable sends the stored client secret verbatim, so there is nothing to sign it with.
2. **There is no userinfo endpoint.** Apple returns the user's identity inside the `id_token` from the token exchange. Faable's flow fetches the profile with a `GET` against a **User Info URL** — a request that has no Apple equivalent, and a connection cannot work without one.
3. **The name arrives once, by `form_post`.** Apple sends `given_name` / `family_name` only on the **very first** authorization, as a `POST` body to your redirect URI, and never again. Faable's `/callback` handles the standard `?code&state` redirect.

Point 1 alone is enough to rule it out; the others mean SIWA needs a dedicated code path rather than configuration.

## What to use meanwhile

- **[Passwordless](../passwordless.md)** — a magic link or one-time code by email. Closest thing to SIWA's low-friction, no-password experience, and it works fine with the private relay addresses Apple hands out.
- **[Google](google.md)** and **[Microsoft](microsoft.md)** — built-in, one toggle to enable.
- **Database connection** — plain email + password.

## If you ship on the App Store

Apple's App Review guidelines require Sign in with Apple to be offered **only** in apps that use a third-party or social login service as their _sole_ sign-in option (guideline 4.8, "Login Services"). An app whose primary path is email + password, or an email-based passwordless login, generally falls outside that requirement — but the guideline is Apple's to interpret and it changes. Check the [current text](https://developer.apple.com/app-store/review/guidelines/#login-services) before you build your onboarding around it.

## When it lands

Adding Apple will need, from the [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list):

- An **App ID** with the _Sign In with Apple_ capability enabled.
- A **Services ID** — its identifier becomes the client id (not the App ID's).
- A **Sign in with Apple key**, whose `.p8` file signs the client secret; note the **Key ID** and your **Team ID**.
- Your Faable Auth callback (`https://{YOUR_DOMAIN}/callback`) registered as a Return URL on the Services ID.

Need it? Tell us at [support@faable.com](mailto:support@faable.com) — demand is how this gets prioritized.

## Related

- [Social Login overview](../social) — the providers that _are_ supported.
- [Passwordless](../passwordless.md) · [Connections](../connections.md)
