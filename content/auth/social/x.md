---
title: X (Twitter) Social Login
description: Enable X (Twitter) login in Faable Auth with OAuth 2.0 and PKCE. Configure user authentication in the X Developer Portal, request the email, and map the profile.
---

# X (Twitter) Social Login

The X social connection (type `x`) lets users sign in with their X (formerly Twitter) account. Bring your own app — there is no shared Faable app for X, so you create one in the X Developer Portal.

X uses OAuth 2.0 Authorization Code with PKCE. Faable runs PKCE (`S256`) and authenticates to X with HTTP Basic client authentication automatically. It sends users to `https://x.com/i/oauth2/authorize`, exchanges the code at `https://api.x.com/2/oauth2/token`, and reads the profile from `https://api.x.com/2/users/me?user.fields=profile_image_url,confirmed_email`.

## Prerequisites

- An [X Developer Portal](https://developer.x.com/) account with a Project and an App.
- Public **privacy policy** and **terms of service** URLs, if you want users' email addresses.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **X (Twitter)**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with X

1. In the [X Developer Portal](https://developer.x.com/en/portal/dashboard), open your App and click **User authentication settings → Set up**.
2. Configure:
   - **App permissions**: Read.
   - **Request email from users**: on, to receive the user's email. X then asks for your privacy policy and terms URLs.
   - **Type of App**: **Web App, Automated App or Bot** (a confidential client).
   - **Callback URI / Redirect URL**: the Callback URL.
   - **Website URL**: your product's public URL.
3. Save, then copy the **OAuth 2.0 Client ID** and **Client Secret** from **Keys and tokens**.

Use the **OAuth 2.0** Client ID and Secret — not the API Key and Secret, which belong to OAuth 1.0a and won't work.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                                  |
| ----------------- | --------------------------------------------------------------------------------- |
| **Name**          | An identifier such as `x`. Shown in the dashboard and logs.                       |
| **Client ID**     | The X OAuth 2.0 Client ID.                                                        |
| **Client secret** | The X OAuth 2.0 Client Secret.                                                    |
| **Scopes**        | Comma-separated. Leave empty for the default `users.read tweet.read users.email`. |
| **Enabled**       | On to offer it on the login screen right away.                                    |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `users.read tweet.read users.email`. X requires `tweet.read` alongside `users.read` to read the user, and `users.email` returns the confirmed email (only when **Request email from users** is on). Add `offline.access` or posting scopes only if your app uses them.

## User profile mapping

| Faable user field | Source on the `/2/users/me` response     | Notes                                               |
| ----------------- | ---------------------------------------- | --------------------------------------------------- |
| `id`              | `data.id`                                |                                                     |
| `name`            | `data.name`, else `data.username`        |                                                     |
| `email`           | `data.confirmed_email`                   | Only with `users.email` and email requests enabled. |
| `email_verified`  | `true` when `confirmed_email` is present | **Attested** — X only returns a confirmed address.  |
| `picture`         | `data.profile_image_url`                 |                                                     |

Identities are keyed by the X user id plus the connection, never by email, so changing the `@handle` doesn't orphan the account. When X returns a confirmed email, the user is created with it and `email_verified: true`; without one, the user has no email. An X login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=x
```

Without `connection`, X appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                                    | Likely cause                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| "Something went wrong" on X's consent page | The Callback URL doesn't match the app's Callback URI exactly.                                                        |
| `unauthorized_client` / `invalid_client`   | You used the API Key/Secret (OAuth 1.0a) instead of the OAuth 2.0 Client ID/Secret, or the app type is not a Web App. |
| User has no email                          | **Request email from users** is off, or `users.email` was removed from the scopes.                                    |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
