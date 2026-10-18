---
title: Spotify Social Login
description: Enable Spotify login in Faable Auth. Create an app in the Spotify Developer Dashboard, register the redirect URI, and map the Spotify profile.
---

# Spotify Social Login

The Spotify social connection (type `spotify`) lets users sign in with their Spotify account. Bring your own app — there is no shared Faable app for Spotify, so you create one in the Spotify Developer Dashboard.

Faable sends users to `https://accounts.spotify.com/authorize`, exchanges the code at `https://accounts.spotify.com/api/token`, and reads the profile from `https://api.spotify.com/v1/me`.

> **Development mode limits who can sign in.** A new Spotify app only accepts the small allowlist of users you add in its dashboard. Opening it to the public needs Spotify's extended quota approval. Check [Spotify's current quota policy](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) before you plan a launch around it.

## Prerequisites

- A Spotify account.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Spotify**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Spotify

1. In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), click **Create app**.
2. Fill in the name and description, add the Callback URL under **Redirect URIs**, and tick **Web API**.
3. Open the app's **Settings** and copy the **Client ID** and **Client secret**.
4. While the app is in Development mode, add the people who should be able to sign in under **User Management**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                                  |
| ----------------- | --------------------------------------------------------------------------------- |
| **Name**          | An identifier such as `spotify`. Shown in the dashboard and logs.                 |
| **Client ID**     | The Spotify Client ID.                                                            |
| **Client secret** | The Spotify Client secret.                                                        |
| **Scopes**        | Comma-separated. Leave empty for the default `user-read-email user-read-private`. |
| **Enabled**       | On to offer it on the login screen right away.                                    |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `user-read-email user-read-private`: the email and the basic profile. Add playback or library scopes only if your app uses them — see the [Spotify scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes).

## User profile mapping

| Faable user field | Source on the `/v1/me` response | Notes                                   |
| ----------------- | ------------------------------- | --------------------------------------- |
| `id`              | `id`                            | Spotify user id.                        |
| `name`            | `display_name`                  |                                         |
| `email`           | `email`                         | Requires `user-read-email`.             |
| `picture`         | `images[0].url`                 | When the user has a profile image.      |
| `email_verified`  | —                               | **Not attested** — Spotify doesn't say. |

Identities are keyed by the Spotify id plus the connection, never by email. Spotify doesn't vouch for the address, so the user is created with `email_verified: false` and can go through Faable's own email verification. A Spotify login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=spotify
```

Without `connection`, Spotify appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                                | Likely cause                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `INVALID_CLIENT: Invalid redirect URI` | The Callback URL isn't in the app's **Redirect URIs**.                                        |
| Only some people can sign in           | The app is in Development mode; add them under **User Management** or request extended quota. |
| `Cannot fetch accessToken`             | Client ID / Client secret mismatch, or the secret was rotated in Spotify.                     |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
