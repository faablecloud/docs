---
title: LinkedIn Social Login
description: Enable LinkedIn login in Faable Auth with Sign In with LinkedIn using OpenID Connect. Register the redirect URL, configure scopes, and map the profile.
---

# LinkedIn Social Login

The LinkedIn social connection (type `linkedin`) lets users sign in with their LinkedIn account through **Sign In with LinkedIn using OpenID Connect**. Bring your own app — there is no shared Faable app for LinkedIn, so you create one in the LinkedIn Developer Portal.

Faable sends users to `https://www.linkedin.com/oauth/v2/authorization`, exchanges the code at `https://www.linkedin.com/oauth/v2/accessToken`, and reads the profile from `https://api.linkedin.com/v2/userinfo`.

## Prerequisites

- A LinkedIn account and a LinkedIn **Company Page** (LinkedIn requires one to create an app).
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **LinkedIn**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with LinkedIn

1. In the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps), click **Create app** and link it to your Company Page.
2. On the **Products** tab, add **Sign In with LinkedIn using OpenID Connect**. Without it, the `openid profile email` scopes are rejected.
3. On the **Auth** tab, add the Callback URL under **Authorized redirect URLs for your app**.
4. On the same tab, copy the **Client ID** and **Primary Client Secret**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                     |
| ----------------- | -------------------------------------------------------------------- |
| **Name**          | An identifier such as `linkedin`. Shown in the dashboard and logs.   |
| **Client ID**     | The LinkedIn Client ID.                                              |
| **Client secret** | The LinkedIn Primary Client Secret.                                  |
| **Scopes**        | Comma-separated. Leave empty for the default `openid profile email`. |
| **Enabled**       | On to offer it on the login screen right away.                       |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `openid profile email`, which is everything the OpenID Connect product grants. Other LinkedIn scopes belong to separate products that need LinkedIn's approval.

## User profile mapping

| Faable user field | Source on the userinfo response                                      | Notes                               |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------- |
| `id`              | `sub`                                                                |                                     |
| `name`            | `name`, else `given_name` + `family_name`, else `preferred_username` |                                     |
| `given_name`      | `given_name`                                                         |                                     |
| `family_name`     | `family_name`                                                        |                                     |
| `email`           | `email`                                                              |                                     |
| `email_verified`  | `email_verified`, only when exactly `true`                           | **Attested** — LinkedIn returns it. |
| `picture`         | `picture`                                                            |                                     |

Identities are keyed by the LinkedIn `sub` plus the connection, never by email. Because LinkedIn vouches for the address, the user is created with `email_verified: true`. A LinkedIn login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=linkedin
```

Without `connection`, LinkedIn appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                           | Likely cause                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `The redirect_uri does not match` | The Callback URL isn't in **Authorized redirect URLs**, or differs in any character. |
| `unauthorized_scope_error`        | The **Sign In with LinkedIn using OpenID Connect** product isn't added to the app.   |
| `Cannot fetch accessToken`        | Client ID / Client Secret mismatch, or the secret was regenerated in LinkedIn.       |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
