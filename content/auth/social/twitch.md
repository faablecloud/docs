---
title: Twitch Social Login
description: Enable Twitch login in Faable Auth using OpenID Connect. Register a Twitch application, add the redirect URL, and map the profile claims.
---

# Twitch Social Login

The Twitch social connection (type `twitch`) lets users sign in with their Twitch account using Twitch's OpenID Connect flow. Bring your own app — there is no shared Faable app for Twitch, so you register one in the Twitch Developer Console.

Faable sends users to `https://id.twitch.tv/oauth2/authorize`, exchanges the code at `https://id.twitch.tv/oauth2/token`, and reads the profile from `https://id.twitch.tv/oauth2/userinfo`.

Twitch only returns the `email`, `email_verified`, `picture` and `preferred_username` claims when they are asked for through the `claims` parameter. Faable requests them automatically.

## Prerequisites

- A Twitch account with two-factor authentication enabled (required to register apps).
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Twitch**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Twitch

1. In the [Twitch Developer Console](https://dev.twitch.tv/console/apps), click **Register Your Application**.
2. Fill in:
   - **Name**: shown on the consent screen.
   - **OAuth Redirect URLs**: the Callback URL.
   - **Category**: the one that fits your product (e.g. **Website Integration**).
   - **Client Type**: **Confidential**.
3. Click **Create**, then **Manage**. Copy the **Client ID** and click **New Secret** to get the **Client Secret**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                       |
| ----------------- | ---------------------------------------------------------------------- |
| **Name**          | An identifier such as `twitch`. Shown in the dashboard and logs.       |
| **Client ID**     | The Twitch Client ID.                                                  |
| **Client secret** | The Twitch Client Secret.                                              |
| **Scopes**        | Comma-separated. Leave empty for the default `openid user:read:email`. |
| **Enabled**       | On to offer it on the login screen right away.                         |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `openid user:read:email`. `user:read:email` is what allows Twitch to return the email claim. Add other [Twitch scopes](https://dev.twitch.tv/docs/authentication/scopes/) only if your app calls the Twitch API with them.

## User profile mapping

| Faable user field | Source on the userinfo response            | Notes                             |
| ----------------- | ------------------------------------------ | --------------------------------- |
| `id`              | `sub`                                      | Twitch user id.                   |
| `name`            | `name`, else `preferred_username`          |                                   |
| `email`           | `email`                                    | Requires `user:read:email`.       |
| `email_verified`  | `email_verified`, only when exactly `true` | **Attested** — Twitch returns it. |
| `picture`         | `picture`                                  |                                   |

Identities are keyed by the Twitch `sub` plus the connection, never by email. Because Twitch vouches for the address, the user is created with `email_verified: true`. A Twitch login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=twitch
```

Without `connection`, Twitch appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                    | Likely cause                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `redirect_mismatch`        | The Callback URL isn't in **OAuth Redirect URLs**, or differs in any character.              |
| `Cannot fetch accessToken` | Client ID / Secret mismatch, a new secret wasn't updated here, or the client type is Public. |
| User has no email          | `user:read:email` was removed from the scopes.                                               |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
