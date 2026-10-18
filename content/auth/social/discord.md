---
title: Discord Social Login
description: Enable Discord login in Faable Auth. Create a Discord application, register the redirect, configure scopes, and map the Discord user onto a Faable user.
---

# Discord Social Login

The Discord social connection (type `discord`) lets users sign in with their Discord account — a natural fit for gaming and community products. Bring your own app — there is no shared Faable app for Discord, so you create one in the Discord Developer Portal.

Faable sends users to `https://discord.com/oauth2/authorize`, exchanges the code at `https://discord.com/api/oauth2/token`, and reads the profile from `https://discord.com/api/users/@me`.

## Prerequisites

- A Discord account.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Discord**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Discord

1. In the [Discord Developer Portal](https://discord.com/developers/applications), click **New Application** and give it the name users will see on the consent screen.
2. Open the **OAuth2** page and add the Callback URL under **Redirects**. Save.
3. On the same page, copy the **Client ID** and click **Reset Secret** to get the **Client Secret**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                  |
| ----------------- | ----------------------------------------------------------------- |
| **Name**          | An identifier such as `discord`. Shown in the dashboard and logs. |
| **Client ID**     | The Discord Client ID.                                            |
| **Client secret** | The Discord Client Secret.                                        |
| **Scopes**        | Comma-separated. Leave empty for the default `identify email`.    |
| **Enabled**       | On to offer it on the login screen right away.                    |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `identify email`: the user's profile and email address. Add others (for example `guilds` to list the user's servers) only if your app uses them — see the [Discord OAuth2 scopes](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes).

## User profile mapping

| Faable user field | Source on the `/users/@me` response                    | Notes                                              |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------- |
| `id`              | `id`                                                   | Discord snowflake id.                              |
| `name`            | `global_name`, else `username`                         |                                                    |
| `email`           | `email`                                                | Requires the `email` scope.                        |
| `email_verified`  | `verified`, only when `true`                           | **Attested** — Discord says whether it's verified. |
| `picture`         | `https://cdn.discordapp.com/avatars/{id}/{avatar}.png` | Only when the user has set an avatar.              |

Identities are keyed by the Discord id plus the connection, never by email. Because Discord vouches for the address, the user is created with `email_verified: true`. A Discord login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=discord
```

Without `connection`, Discord appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                       | Likely cause                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| `Invalid OAuth2 redirect_uri` | The Callback URL isn't in the **Redirects** list on the OAuth2 page.    |
| `Cannot fetch accessToken`    | Client ID / Client Secret mismatch, or the secret was reset in Discord. |
| User has no email             | The `email` scope was removed from the connection.                      |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
