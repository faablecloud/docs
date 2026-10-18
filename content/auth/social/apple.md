---
title: Sign In with Apple
description: Enable Sign in with Apple in Faable Auth. Create a Services ID and a Sign in with Apple key, paste the .p8 into the connection, and Faable signs the client secret for you.
---

# Sign In with Apple

The Apple social connection (type `apple`) lets users sign in with their Apple ID on the web. Bring your own app — there is no shared Faable app for Apple, so you register a Services ID and a key in the Apple Developer portal.

Apple departs from plain OAuth 2.0 in a few ways, and Faable handles all of them for you:

- **Client secret.** Apple wants an ES256-signed JWT as the client secret. Faable signs a fresh one with your `.p8` key on every token request (5-minute lifetime). You never generate or rotate a JWT yourself.
- **`form_post` callback.** Faable sends users to `https://appleid.apple.com/auth/authorize` with `response_mode=form_post`. Apple POSTs the result to `/callback`, and Faable picks it up and continues the normal flow.
- **No userinfo endpoint.** Faable reads the profile from the `id_token` returned by `https://appleid.apple.com/auth/token`, after verifying it: signature against `https://appleid.apple.com/auth/keys`, issuer `https://appleid.apple.com`, audience equal to your Services ID, and a nonce Faable sends on the request.

## Prerequisites

- A paid [Apple Developer Program](https://developer.apple.com/programs/) membership.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Apple**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Apple

In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list):

1. **App ID.** Create (or reuse) an App ID and enable the **Sign in with Apple** capability.
2. **Services ID.** Create a Services ID (e.g. `com.example.web`). Its identifier is the client id. Enable **Sign in with Apple**, click **Configure**, and set:
   - **Primary App ID**: the App ID from step 1.
   - **Domains and Subdomains**: your Faable Auth domain host (e.g. `acme.auth.faable.link`).
   - **Return URLs**: `https://{YOUR_DOMAIN}/callback`.
3. **Key.** Under **Keys**, create a key with **Sign in with Apple** enabled and linked to the primary App ID. Download the `.p8` file (Apple lets you download it only once) and note the **Key ID**.
4. **Team ID.** It is shown in the top-right corner of the developer portal (10 characters).

## Create the connection in Faable Auth

Back in **Auth → Connections → Create → Social → Apple**, fill in:

| Field                 | Value to Provide                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **Name**              | An identifier such as `apple`. Shown in the dashboard and logs.                          |
| **Services ID**       | The Services ID identifier (e.g. `com.example.web`) — **not** the App ID.                |
| **Team ID**           | Your 10-character Apple Team ID.                                                         |
| **Key ID**            | The Key ID of the Sign in with Apple key.                                                |
| **Private key (.p8)** | Paste the whole `.p8` file, including the `-----BEGIN PRIVATE KEY-----` and `END` lines. |
| **Scopes**            | Comma-separated. Leave empty for the default `name email`.                               |
| **Enabled**           | On to offer it on the login screen right away.                                           |

**Rotating the key** means creating a new key in Apple and pasting it, with its new Key ID, into the connection. Then revoke the old key in Apple.

## Scopes

The default scope is `name email`. Those are the only two scopes Apple supports for Sign in with Apple; leave the field empty unless you want to drop one of them.

## User profile mapping

| Faable user field                   | Source in the Apple `id_token`        | Notes                                                                                            |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`                                | `sub`                                 | Stable per user and per Apple team.                                                              |
| `email`                             | `email`                               | May be a private relay address (`…@privaterelay.appleid.com`).                                   |
| `email_verified`                    | `email_verified` (`true` or `"true"`) | **Attested** — Apple vouches for the address.                                                    |
| `name`, `given_name`, `family_name` | The first authorization only          | Apple sends the name only the very first time a user authorizes your app. Faable stores it then. |
| `picture`                           | —                                     | Apple provides no picture.                                                                       |

Identities are keyed by the Apple `sub` plus the connection, never by email. Because Apple vouches for the address, the user is created with `email_verified: true`. An Apple login never merges into an existing account that happens to have the same email — it is a separate user.

Later logins carry no name. If a user removes your app under **Apple ID → Sign-In & Security → Sign in with Apple** and signs in again, Apple sends the name once more.

**Private relay.** Users who choose "Hide My Email" get a relay address. To deliver mail to those addresses, register your sending domain or address in Apple's **Private Email Relay Service** configuration; otherwise Apple drops your messages.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=apple
```

Without `connection`, Apple appears as an option on the [hosted login](../hosted-login.mdx) screen.

## If you ship on the App Store

App Review guideline 4.8 ("Login Services") requires apps that offer a third-party or social login to also offer an equivalent privacy-focused option, and Sign in with Apple qualifies. An app whose only sign-in is your own email + password or email passwordless generally falls outside it. The guideline is Apple's to interpret and it changes — check the [current text](https://developer.apple.com/app-store/review/guidelines/#login-services) before planning your onboarding.

Native iOS sign-in (sending the identity token from your app) is not covered by this connection yet; it handles the web flow.

## Troubleshooting

| Symptom                                      | Likely cause                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `invalid_client`                             | Wrong Services ID, Team ID, Key ID or private key — or the key was revoked in Apple.      |
| `invalid_request` / redirect URI mismatch    | The Return URL on the Services ID doesn't match `https://{YOUR_DOMAIN}/callback` exactly. |
| User has no name                             | Not the user's first authorization. Apple sends the name only once.                       |
| Emails to `@privaterelay.appleid.com` bounce | Your sending domain isn't registered in Apple's Private Email Relay Service.              |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
