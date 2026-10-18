---
title: Bitbucket Social Login
description: Enable Bitbucket Cloud login in Faable Auth. Create an OAuth consumer in your workspace, register the callback URL, and map the Bitbucket account.
---

# Bitbucket Social Login

The Bitbucket social connection (type `bitbucket`) lets users sign in with their **Bitbucket Cloud** account. Bring your own app — there is no shared Faable app for Bitbucket, so you create an OAuth consumer in one of your workspaces. Bitbucket Data Center and Server are not supported.

Faable sends users to `https://bitbucket.org/site/oauth2/authorize`, exchanges the code at `https://bitbucket.org/site/oauth2/access_token` (authenticating with HTTP Basic), reads the account from `https://api.bitbucket.org/2.0/user`, and the email from `https://api.bitbucket.org/2.0/user/emails`.

## Prerequisites

- A Bitbucket Cloud workspace where you are an admin.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Bitbucket**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; Bitbucket takes a single Callback URL, so use the host your apps start logins on.

## Register the app with Bitbucket

1. In Bitbucket, open **Workspace settings → OAuth consumers** and click **Add consumer**.
2. Fill in:
   - **Name**: shown on the consent screen.
   - **Callback URL**: the Callback URL.
   - **Permissions → Account**: **Email** and **Read**.
3. Save, expand the consumer and copy its **Key** and **Secret**.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                    |
| ----------------- | ------------------------------------------------------------------- |
| **Name**          | An identifier such as `bitbucket`. Shown in the dashboard and logs. |
| **Client ID**     | The consumer **Key**.                                               |
| **Client secret** | The consumer **Secret**.                                            |
| **Scopes**        | Comma-separated. Leave empty for the default `account email`.       |
| **Enabled**       | On to offer it on the login screen right away.                      |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `account email`. Bitbucket only grants scopes that are also ticked as permissions on the consumer, so keep the two in sync.

## User profile mapping

| Faable user field | Source                                    | Notes                                                      |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `id`              | `uuid` from `/2.0/user`                   | Kept with its braces, e.g. `{1a2b…}`.                      |
| `name`            | `display_name`, else `nickname`           |                                                            |
| `picture`         | `links.avatar.href`                       |                                                            |
| `email`           | `/2.0/user/emails`                        | The primary **confirmed** address, else any confirmed one. |
| `email_verified`  | `true` when the email came from that list | **Attested** — only confirmed addresses are used.          |

Unconfirmed addresses are never used: a user with no confirmed email is created without one. Identities are keyed by the Bitbucket `uuid` plus the connection, never by email. Because Bitbucket vouches for the address, the user is created with `email_verified: true`. A Bitbucket login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=bitbucket
```

Without `connection`, Bitbucket appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                    | Likely cause                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `Invalid redirect_uri`     | The consumer's **Callback URL** doesn't match the host the login started on.        |
| `invalid_scope`            | A scope on the connection isn't ticked as a permission on the consumer.             |
| User has no email          | The user has no confirmed address on Bitbucket, or the **Email** permission is off. |
| `Cannot fetch accessToken` | Key / Secret mismatch.                                                              |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
