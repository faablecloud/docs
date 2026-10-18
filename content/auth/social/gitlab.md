---
title: GitLab Social Login
description: Enable GitLab.com login in Faable Auth. Create a GitLab OAuth application, register the redirect URI, and map the OpenID Connect profile.
---

# GitLab Social Login

The GitLab social connection (type `gitlab`) lets users sign in with their **GitLab.com** account. Bring your own app — there is no shared Faable app for GitLab, so you register an OAuth application on GitLab.com.

Faable sends users to `https://gitlab.com/oauth/authorize`, exchanges the code at `https://gitlab.com/oauth/token`, and reads the OpenID Connect profile from `https://gitlab.com/oauth/userinfo`.

> **Self-managed GitLab** is not supported as a first-class option yet. If you need it, contact [support@faable.com](mailto:support@faable.com).

## Prerequisites

- A GitLab.com account (a group-owned application is recommended for production).
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **GitLab**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either (one per line in GitLab).

## Register the app with GitLab

1. On GitLab.com, go to **User Settings → Applications** (or **Group → Settings → Applications** for a group-owned app) and click **Add new application**.
2. Fill in:
   - **Name**: shown on the consent screen.
   - **Redirect URI**: the Callback URL.
   - **Confidential**: checked.
   - **Scopes**: `openid`, `profile`, `email`.
3. Save, then copy the **Application ID** and **Secret**. GitLab shows the secret only once.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                     |
| ----------------- | -------------------------------------------------------------------- |
| **Name**          | An identifier such as `gitlab`. Shown in the dashboard and logs.     |
| **Client ID**     | The GitLab **Application ID**.                                       |
| **Client secret** | The GitLab **Secret**.                                               |
| **Scopes**        | Comma-separated. Leave empty for the default `openid profile email`. |
| **Enabled**       | On to offer it on the login screen right away.                       |

The endpoints are preconfigured; you don't enter them.

## Scopes

The default scope is `openid profile email`. Any scope you request must also be ticked on the GitLab application, or GitLab rejects the request. Add API scopes such as `read_user` or `read_api` only if your app calls the GitLab API.

## User profile mapping

| Faable user field | Source on the userinfo response                                      | Notes                             |
| ----------------- | -------------------------------------------------------------------- | --------------------------------- |
| `id`              | `sub`                                                                | GitLab user id.                   |
| `name`            | `name`, else `given_name` + `family_name`, else `preferred_username` |                                   |
| `given_name`      | `given_name`                                                         |                                   |
| `family_name`     | `family_name`                                                        |                                   |
| `email`           | `email`                                                              |                                   |
| `email_verified`  | `email_verified`, only when exactly `true`                           | **Attested** — GitLab returns it. |
| `picture`         | `picture`                                                            |                                   |

Identities are keyed by the GitLab `sub` plus the connection, never by email, so renaming a GitLab username doesn't orphan the account. Because GitLab vouches for the address, the user is created with `email_verified: true`. A GitLab login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=gitlab
```

Without `connection`, GitLab appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                                  | Likely cause                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `The redirect URI included is not valid` | The Callback URL isn't in the application's **Redirect URI** list.     |
| `The requested scope is invalid`         | A scope on the connection isn't ticked on the GitLab application.      |
| `Cannot fetch accessToken`               | Application ID / Secret mismatch, or the secret was renewed in GitLab. |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
