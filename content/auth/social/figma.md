---
title: Figma Social Login
description: Enable Figma login in Faable Auth. Create a Figma OAuth app, register the callback URL, set the scope, and map the Figma user.
---

# Figma Social Login

The Figma social connection (type `figma`) lets users sign in with their Figma account — useful for design tools and plugins with a web companion. Bring your own app — there is no shared Faable app for Figma, so you create one in Figma's developer settings.

Faable sends users to `https://www.figma.com/oauth`, exchanges the code at `https://www.figma.com/api/oauth/token`, and reads the profile from `https://api.figma.com/v1/me`.

## Prerequisites

- A Figma account.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Figma**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Figma

1. In Figma's [developer settings](https://www.figma.com/developers/apps), open **My apps** and create a new app.
2. Add the Callback URL under **Callback URLs** (or **Redirect URLs**).
3. Choose the scopes the app may request. For login, the user-profile scope (`current_user:read`) is enough.
4. Copy the **Client ID** and **Client secret**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                |
| ----------------- | --------------------------------------------------------------- |
| **Name**          | An identifier such as `figma`. Shown in the dashboard and logs. |
| **Client ID**     | The Figma Client ID.                                            |
| **Client secret** | The Figma Client secret.                                        |
| **Scopes**        | Comma-separated. **Required** — see below.                      |
| **Enabled**       | On to offer it on the login screen right away.                  |

The endpoints are preconfigured; you don't enter them.

## Scopes

Faable stores **no default scope** for Figma: set the scope your Figma app is configured for. For login that is `current_user:read`. Figma's scope names have changed over time, so check [Figma's current scopes](https://www.figma.com/developers/api#authentication-scopes) and keep the connection in sync with the app.

## User profile mapping

| Faable user field | Source on the `/v1/me` response | Notes                                 |
| ----------------- | ------------------------------- | ------------------------------------- |
| `id`              | `id`                            | Figma user id.                        |
| `name`            | `handle`                        |                                       |
| `email`           | `email`                         |                                       |
| `picture`         | `img_url`                       |                                       |
| `email_verified`  | —                               | **Not attested** — Figma doesn't say. |

Identities are keyed by the Figma id plus the connection, never by email. Figma doesn't vouch for the address, so the user is created with `email_verified: false` and can go through Faable's own email verification. A Figma login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=figma
```

Without `connection`, Figma appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                       | Likely cause                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------- |
| Invalid redirect URI on Figma | The Callback URL isn't registered on the Figma app.                               |
| `Invalid scopes` on Figma     | The connection's scope is empty or isn't one the Figma app is allowed to request. |
| `Cannot fetch accessToken`    | Client ID / Client secret mismatch.                                               |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
