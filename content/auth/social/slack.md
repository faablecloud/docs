---
title: Slack Social Login
description: Enable Sign in with Slack in Faable Auth using OpenID Connect. Create a Slack app, register the redirect URL, and map the Slack profile.
---

# Slack Social Login

The Slack social connection (type `slack`) lets users sign in with their Slack account through **Sign in with Slack**, Slack's OpenID Connect flow. Bring your own app — there is no shared Faable app for Slack, so you create one at api.slack.com.

Faable sends users to `https://slack.com/openid/connect/authorize`, exchanges the code at `https://slack.com/api/openid.connect.token`, and reads the profile from `https://slack.com/api/openid.connect.userInfo`.

## Prerequisites

- A Slack workspace where you can create apps.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Slack**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Slack

1. At [api.slack.com/apps](https://api.slack.com/apps), click **Create New App → From scratch** and pick a development workspace.
2. Open **OAuth & Permissions** and add the Callback URL under **Redirect URLs**. Slack requires `https`.
3. Under **User Token Scopes**, add `openid`, `profile` and `email`.
4. Open **Basic Information** and copy the **Client ID** and **Client Secret**.
5. To let people from other workspaces sign in, enable public distribution under **Manage Distribution**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                     |
| ----------------- | -------------------------------------------------------------------- |
| **Name**          | An identifier such as `slack`. Shown in the dashboard and logs.      |
| **Client ID**     | The Slack Client ID.                                                 |
| **Client secret** | The Slack Client Secret.                                             |
| **Scopes**        | Comma-separated. Leave empty for the default `openid profile email`. |
| **Enabled**       | On to offer it on the login screen right away.                       |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `openid profile email`, which is all Sign in with Slack supports. Bot and workspace-API scopes belong to Slack's "Add to Slack" flow, not to login.

## User profile mapping

| Faable user field | Source on the userinfo response                                      | Notes                            |
| ----------------- | -------------------------------------------------------------------- | -------------------------------- |
| `id`              | `sub`                                                                | Slack user id in that workspace. |
| `name`            | `name`, else `given_name` + `family_name`, else `preferred_username` |                                  |
| `given_name`      | `given_name`                                                         |                                  |
| `family_name`     | `family_name`                                                        |                                  |
| `email`           | `email`                                                              |                                  |
| `email_verified`  | `email_verified`, only when exactly `true`                           | **Attested** — Slack returns it. |
| `picture`         | `picture`                                                            |                                  |

Identities are keyed by the Slack `sub` plus the connection, never by email. Because Slack vouches for the address, the user is created with `email_verified: true`. A Slack login never merges into an existing account that happens to have the same email — it is a separate user.

**Slack identities are per workspace.** A person who belongs to two workspaces has two Slack user ids, and so gets two separate identities on the connection.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=slack
```

Without `connection`, Slack appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                             | Likely cause                                                                |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `redirect_uri did not match`        | The Callback URL isn't under **Redirect URLs** in OAuth & Permissions.      |
| Only your own workspace can sign in | Public distribution isn't enabled for the app.                              |
| `Cannot fetch accessToken`          | Client ID / Client Secret mismatch, or the secret was regenerated in Slack. |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
