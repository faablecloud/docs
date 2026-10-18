---
title: Facebook Social Login
description: Enable Facebook Login in Faable Auth. Create a Meta app, register the callback URL, and map the Graph API profile onto a Faable user.
---

# Facebook Social Login

The Facebook social connection (type `facebook`) lets users sign in with their Facebook account. Bring your own app — there is no shared Faable app for Facebook, so you create one in the Meta developer portal.

Faable runs the Authorization Code flow against `https://www.facebook.com/v21.0/dialog/oauth`, exchanges the code at `https://graph.facebook.com/v21.0/oauth/access_token`, and reads the profile from `https://graph.facebook.com/v21.0/me?fields=id,name,first_name,last_name,email,picture.type(large)`.

## Prerequisites

- A [Meta for Developers](https://developers.facebook.com/) account.
- Your Faable Auth domain (`{YOUR_FAABLEAUTH_NAME}.auth.faable.link` or your [custom domain](../custom-domain.md)).

## Find your redirect URI

In the Faable Dashboard, go to **Auth → Connections → Create → Social** and pick **Facebook**. Copy the **Callback URL** shown in the form — it is `https://{YOUR_DOMAIN}/callback`. With a custom domain both hosts are listed; register both if your apps start logins on either.

## Register the app with Facebook

1. In the [Meta app dashboard](https://developers.facebook.com/apps), create an app with the use case that includes **Facebook Login**.
2. Under **Facebook Login → Settings**, enable **Client OAuth Login** and **Web OAuth Login**, and add the Callback URL to **Valid OAuth Redirect URIs** (exact match, no trailing slash).
3. Under **App settings → Basic**, copy the **App ID** and **App Secret**.
4. Make sure the `email` and `public_profile` permissions are available to the app. Both work without app review.
5. Switch the app to **Live** when you are ready. In Development mode only users with a role on the app can sign in.

## Create the connection in Faable Auth

| Field             | Value to Provide                                                     |
| ----------------- | -------------------------------------------------------------------- |
| **Name**          | An identifier such as `facebook`. Shown in the dashboard and logs.   |
| **Client ID**     | Your Facebook **App ID**.                                            |
| **Client secret** | Your Facebook **App Secret**.                                        |
| **Scopes**        | Comma-separated. Leave empty for the default `email public_profile`. |
| **Enabled**       | On to offer it on the login screen right away.                       |

The endpoints are preconfigured; you don't enter them.

### Already using a Custom OAuth2 Facebook connection?

It keeps working — nothing changes for it. Switching to the built-in type means creating a new connection. The Facebook user ids are the same, but identities belong to a connection: someone who signed in through the custom connection and then signs in through the new one becomes a **second, separate user**. For an established user base, stay on the custom connection, or talk to us before migrating.

## Scopes

The default scope is `email public_profile`. Anything beyond those needs Meta's app review; only request it if your app uses it.

## User profile mapping

| Faable user field | Source on the Graph `/me` response | Notes                                                      |
| ----------------- | ---------------------------------- | ---------------------------------------------------------- |
| `id`              | `id`                               | App-scoped Facebook user id.                               |
| `name`            | `name`                             |                                                            |
| `given_name`      | `first_name`                       |                                                            |
| `family_name`     | `last_name`                        |                                                            |
| `email`           | `email`                            | Empty if the user declined the permission or has no email. |
| `picture`         | `picture.data.url`                 | Large profile picture.                                     |
| `email_verified`  | —                                  | **Not attested** — Graph doesn't return it.                |

Identities are keyed by the Facebook id plus the connection, never by email. Facebook doesn't vouch for the address, so the user is created with `email_verified: false` and can go through Faable's own email verification. A Facebook login never merges into an existing account that happens to have the same email — it is a separate user.

## Trigger a login

Pass `connection=<connection id or name>` on `/authorize` to skip the login screen:

```
https://{YOUR_DOMAIN}/authorize?client_id={YOUR_CLIENT_ID}&response_type=code&redirect_uri={YOUR_APP_CALLBACK}&scope=openid%20profile%20email&state={RANDOM_STATE}&connection=facebook
```

Without `connection`, Facebook appears as an option on the [hosted login](../hosted-login.mdx) screen.

## Troubleshooting

| Symptom                              | Likely cause                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `URL Blocked: This redirect failed…` | The Callback URL isn't in **Valid OAuth Redirect URIs**, or differs by a trailing slash. |
| Only some people can log in          | The app is in Development mode. Add testers under **App roles** or switch it to Live.    |
| User has no email                    | The user declined the `email` permission, or signed up to Facebook with a phone number.  |
| `Cannot fetch accessToken`           | App ID / App Secret mismatch, or the secret was reset in Meta and not updated here.      |

## Related

- [Social Login overview](/auth/social)
- [Connections](../connections.md)
- [Hosted login](../hosted-login.mdx)
