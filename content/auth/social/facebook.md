---
title: Facebook Social Login
description: Add Facebook login to Faable Auth using a Custom OAuth2 connection. Create a Facebook app, configure the redirect URI, and map the Graph API profile onto a Faable user.
---

## Facebook Social Login

Facebook is **not a built-in connection type** in Faable Auth — there is no "Facebook" entry in the connection dropdown. You add it as a **Custom OAuth2** connection, supplying Facebook's endpoints yourself. Everything downstream is identical to a built-in provider: same Authorization Code flow, same user record, same tokens issued to your app.

This page doubles as the worked example for [Custom OAuth2 connections](../social) in general.

## Prerequisites

- A [Facebook Developer account](https://developers.facebook.com/).
- Your Faable Auth domain. Without a [custom domain](../custom-domain.md) it's `{YOUR_FAABLEAUTH_NAME}.auth.faable.link`, and your redirect URI is:

  ```
  https://{YOUR_DOMAIN}/callback
  ```

  The path is always `/callback` — one account-wide callback handled by Faable Auth, not by your application. Facebook requires HTTPS here, which Faable domains always are.

## Step 1 — Create the Facebook app

1. In the [Facebook Developer portal](https://developers.facebook.com/apps), create an app and pick the use case that includes **Facebook Login**.
2. Under **Facebook Login → Settings**:

   | Field                             | Value to Provide                                                                                               |
   | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
   | **Client OAuth Login**            | Enabled.                                                                                                       |
   | **Web OAuth Login**               | Enabled.                                                                                                       |
   | **Valid OAuth Redirect URIs**     | `https://{YOUR_DOMAIN}/callback` — exact match, no trailing slash.                                             |
   | **Login with the JavaScript SDK** | Disabled. Faable drives the server-side Authorization Code flow; the JS SDK is a different mechanism entirely. |

3. Under **App settings → Basic**, copy the **App ID** and **App Secret**.
4. Under **App review → Permissions and features**, confirm `public_profile` and `email`. These two are the only permissions granted without Facebook's app review — anything beyond them requires review and, for advanced access, Business Verification.

## Step 2 — Create the Custom OAuth2 connection

In the Faable Dashboard, go to **Auth → Social Login → Create** and choose **Custom OAuth2**. Fill in:

| Field               | Value to Provide                                           |
| ------------------- | ---------------------------------------------------------- |
| **Connection name** | `facebook`                                                 |
| **Authorize URL**   | `https://www.facebook.com/v21.0/dialog/oauth`              |
| **Token URL**       | `https://graph.facebook.com/v21.0/oauth/access_token`      |
| **User Info URL**   | `https://graph.facebook.com/v21.0/me?fields=id,name,email` |
| **Client ID**       | Your Facebook **App ID**.                                  |
| **Client Secret**   | Your Facebook **App Secret**. Stored encrypted at rest.    |
| **Scope**           | `public_profile` `email`                                   |
| **Response type**   | `code`                                                     |
| **Enabled**         | On.                                                        |

Pin the Graph API version (`v21.0` above) rather than omitting it — unversioned Graph calls follow Facebook's default version, which moves under you and eventually breaks the connection without any change on your side. Bump it deliberately when you're ready.

### Why the `?fields=` query string matters

Facebook's `/me` endpoint returns **only `id` and `name`** unless you ask for more. Faable's generic mapper reads `id`, `name`, `email` and `picture` straight off the userinfo response, so anything you don't request in `fields` simply arrives empty. Requesting `email` is what makes the user's address show up on the Faable user record.

`picture` is deliberately left out of the field list: Facebook returns it as a nested object (`{"data": {"url": …}}`), and the mapper only accepts string values — so it would be dropped anyway rather than stored.

## Step 3 — Test it

1. Trigger a login from your app with `connection_id=connection_abc123` (the id is shown on the connection in the dashboard), or use **Try Connection** in the dashboard.
2. Facebook shows its consent screen. While your app is in **Development** mode only users listed under **App roles** can log in — add yourself as a tester, or switch the app to Live.
3. After consent, Facebook redirects to `https://{YOUR_DOMAIN}/callback`; Faable exchanges the code, fetches the profile, provisions the user, and redirects back to your application.
4. Confirm in **Users** that the account exists with an email attached.

## Limitations

- **No profile picture.** See above — the mapper takes string fields only.
- **`email_verified` is not set.** Facebook doesn't attest verification in this response, so users land unverified. Run Faable's own verification if you need a proven address.
- **Users can hide their email.** An account that declined the email permission, or one created with a phone number, produces a user with no address. The login still succeeds — identities are keyed by the provider `id`, not the email.

## Troubleshooting

| Symptom                                             | Likely cause                                                                                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `URL Blocked: This redirect failed…`                | The redirect URI isn't in **Valid OAuth Redirect URIs**, or differs by a trailing slash.                                                                                |
| `Provider mapper cannot obtain a valid id for user` | The userinfo response has no `id` — usually a wrong **User Info URL**, or a Graph error body returned in place of the profile.                                          |
| Login works but the user has no email               | `email` is missing from the `?fields=` list, from the connection **Scope**, or the user declined the permission.                                                        |
| `Invalid Scopes` from Facebook                      | Faable sends scopes space-separated. If Facebook rejects the value, put the permissions in a single scope entry (`public_profile,email`) so it arrives comma-separated. |
| Only some people can log in                         | The Facebook app is still in Development mode. Only users with an app role can authenticate.                                                                            |
| `Cannot fetch accessToken from connection`          | App ID / App Secret mismatch, or the secret was regenerated in Facebook and not updated on the connection.                                                              |

## Related

- [Social Login overview](../social) — the built-in providers and how Custom OAuth2 works.
- [Connections](../connections.md) · [Clients](../clients.md)
- [Authorization Code Flow](../oauth-flows/authorization-code.md)
