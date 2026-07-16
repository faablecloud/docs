---
title: GitHub Social Login
description: Enable GitHub Social Login in Faable Auth. Step-by-step guide to registering a GitHub OAuth App, configuring scopes, and mapping user profile data.
---

## GitHub Social Login

The GitHub social connection allows users to log in to your application using their GitHub account. It's a popular choice for developer-facing products, since most engineers already have a GitHub identity and trust the OAuth consent screen.

Faable Auth implements the standard [GitHub OAuth 2.0 Authorization Code flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). After the user grants consent on `github.com`, GitHub redirects back to Faable Auth's `/callback` endpoint with an authorization code. Faable Auth exchanges that code for an access token, fetches the user's profile from `https://api.github.com/user`, normalizes it into a standard user object, and finally issues your application its own OAuth2/OIDC tokens.

By default, Faable Auth syncs the GitHub profile attributes (id, name, login, email, avatar) into the user record on every login. Changes you make on GitHub are reflected in Faable Auth the next time the user signs in.

## Prerequisites

Before you begin:

1. [Sign up for a GitHub account](https://github.com/signup) (a personal account is enough, but an organization-owned OAuth App is recommended for production).
2. Decide whether the connection will live under a personal account or a GitHub Organization. Organization-owned OAuth Apps make ownership transfer and team-based secret management easier.

## Find your Faable Auth domain

You will need your Faable Auth domain to register the redirect URI on GitHub.

1. In the Faable Auth Dashboard, navigate to **Auth → Settings → Custom Domains**.
2. If you haven't configured a custom domain, your Faable Auth domain is `{YOUR_FAABLEAUTH_NAME}.auth.faable.link`.
3. Your redirect URI is:

   ```
   https://{YOUR_DOMAIN}/callback
   ```

   If you're using a custom domain (e.g. `auth.yourcompany.com`), use that instead. The path is always `/callback` — it's a single, account-wide callback handled by Faable Auth, not by your application. Your application's own redirect URI (the one registered on the Faable Auth Client) is invoked later, after Faable Auth completes the upstream OAuth handshake with GitHub.

## Register a GitHub OAuth App

GitHub offers two flavors of integrations: **OAuth Apps** and **GitHub Apps**. For social login you want a classic **OAuth App** — GitHub Apps target fine-grained API access, not user sign-in.

1. Sign in to GitHub and navigate to [**Settings > Developer settings > OAuth Apps**](https://github.com/settings/developers) (for a personal app) or to your organization's settings and then **Developer settings > OAuth Apps** (for an org-owned app).
2. Click **New OAuth App** (or **Register a new application**).
3. Fill in the following fields:

   | Field                          | Value to Provide                                                                                                        |
   | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
   | **Application name**           | A user-facing name shown on the GitHub consent screen (e.g. `Acme Corp`).                                               |
   | **Homepage URL**               | Your product's public URL (e.g. `https://acme.com`).                                                                    |
   | **Application description**    | Optional. Shown on the consent screen — keep it short and accurate.                                                     |
   | **Authorization callback URL** | `https://{YOUR_DOMAIN}/callback` — must match the Faable Auth callback exactly, including scheme and no trailing slash. |
   | **Enable Device Flow**         | Leave unchecked. Faable Auth uses the Authorization Code flow for browser-based login.                                  |

4. Click **Register application**.
5. On the application detail page, copy the **Client ID** (always visible) and click **Generate a new client secret** to obtain the **Client Secret**. Store the secret immediately — GitHub will only display it once.
6. Optional: upload an application logo. It appears on the consent screen and can improve trust.

> If you register the OAuth App under a GitHub Organization that enforces **OAuth App access restrictions**, organization owners must approve the app before members can sign in with it. Until approval, sign-in attempts from those members will fail at the GitHub consent step.

## Create the connection in Faable Auth

Once you have the Client ID and Client Secret from GitHub:

1. In the Faable Auth Dashboard, navigate to **Auth → Social Login** and click **Create**.
2. Choose **GitHub** as the connection type.
3. Fill in the fields:

   | Field               | Value to Provide                                                                                                                               |
   | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
   | **Connection name** | An internal identifier, e.g. `github`. This is the value your application will pass as the `connection` query parameter on `/authorize`.       |
   | **Client ID**       | The Client ID generated by GitHub.                                                                                                             |
   | **Client Secret**   | The Client Secret generated by GitHub. Stored encrypted at rest.                                                                               |
   | **Scope**           | Optional. Defaults to `user:email`. Add additional scopes (space-separated) only if your application needs more — see [Scopes](#scopes) below. |
   | **Enabled clients** | Optional. Restrict which Faable Auth Clients (applications) can use this connection. Leave empty to enable it for every Client in the account. |
   | **Enabled**         | Toggle on to make the connection live.                                                                                                         |

4. Save the connection.

Faable Auth ships with the upstream URLs preconfigured, so you do **not** need to enter them manually:

- **Authorize URL:** `https://github.com/login/oauth/authorize`
- **Token URL:** `https://github.com/login/oauth/access_token`
- **User Info URL:** `https://api.github.com/user`
- **Response type:** `code`

These defaults are merged with whatever you set on the connection — if you ever need to point at a GitHub Enterprise Server instance, you can override them on a per-connection basis.

## Scopes

The default scope is **`user:email`**. This is the minimum required for Faable Auth to retrieve the user's primary email address (which is needed to identify and dedupe accounts).

You can extend the scope list to request additional GitHub permissions, but only do so if your application actually consumes them. Common additions:

| Scope        | What it grants                                                                   |
| ------------ | -------------------------------------------------------------------------------- |
| `user:email` | Read access to the user's email addresses (default).                             |
| `read:user`  | Read access to the full profile (bio, location, etc.).                           |
| `read:org`   | List the organizations the user belongs to.                                      |
| `repo`       | Full control of private repositories. **Do not request unless strictly needed.** |

A full list is in the [GitHub OAuth scopes reference](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps). Scopes you request on the connection are merged with any scopes your application passes through the `scope` parameter on `/authorize`; duplicates are de-duplicated automatically.

## User profile mapping

After the upstream handshake completes, Faable Auth fetches the GitHub profile from `https://api.github.com/user` and normalizes it into the internal `StandarizedUser` shape:

| Faable user field | Source on GitHub response            | Notes                                                                                                                                                                            |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `id` (cast to string)                | GitHub returns a numeric id; Faable stores it as a string for compatibility with other providers.                                                                                |
| `name`            | `name` if present, otherwise `login` | If the user hasn't set a display name on GitHub, the username (`login`) is used as a fallback.                                                                                   |
| `email`           | `email`                              | Requires the `user:email` scope. May be `null` if the user has no public email and only private ones — Faable will pick up the verified primary email via the userinfo response. |
| `picture`         | `avatar_url`                         | URL to the user's GitHub avatar.                                                                                                                                                 |

Faable Auth identifies a returning user by the upstream `id` plus the connection — so renames on GitHub (changing `login`) do not orphan accounts, but a different `id` (e.g. switching to a different GitHub user) is treated as a different identity.

## Trigger a login

Once the connection is enabled, your application can redirect users straight to GitHub by including the `connection` query parameter on the standard `/authorize` request:

```
https://{YOUR_DOMAIN}/authorize
  ?client_id={YOUR_CLIENT_ID}
  &response_type=code
  &redirect_uri={YOUR_APP_CALLBACK}
  &scope=openid%20profile%20email
  &state={RANDOM_STATE}
  &connection=github
```

If you omit `connection`, the Universal Login screen is shown and GitHub appears as one of the available sign-in options (provided the connection is enabled for the Client). See [OAuth Flows: Authorization Code](../oauth-flows/authorization-code.md) for the full request reference.

## Test the connection

1. From the Faable Auth Dashboard, open your GitHub connection and click **Try Connection** (or trigger a login from your app with `connection=github`).
2. You'll be redirected to GitHub's authorization page showing the application name, requested scopes, and a **Authorize** button.
3. After authorizing, GitHub redirects back to `https://{YOUR_DOMAIN}/callback`. Faable Auth exchanges the code, fetches the profile, provisions or updates the user, and finally redirects to your application's `redirect_uri` with an authorization code (or tokens, depending on the response type you requested).
4. Confirm in the Dashboard's **Users** view that the new user exists and that the identity is linked to the `github` connection.

## Revoke or rotate credentials

- **Rotate the client secret:** Generate a new secret on GitHub, paste it into the Faable Auth connection's **Client Secret** field, and save. Existing user sessions are unaffected — only new sign-in attempts need the updated secret.
- **Revoke a user's grant:** GitHub users can revoke access at any time from [github.com/settings/applications](https://github.com/settings/applications). Doing so does not log them out of your app — Faable Auth's session remains valid until it expires — but they will need to re-consent the next time they sign in via GitHub.
- **Delete the OAuth App:** Removes access for everyone. Disable the Faable Auth connection at the same time so users aren't routed to a broken upstream.

## Troubleshooting

| Symptom                                                             | Likely cause                                                                                                                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch` from GitHub                                 | The **Authorization callback URL** on the GitHub OAuth App doesn't match `https://{YOUR_DOMAIN}/callback` exactly (scheme, host, path, trailing slash).                 |
| `Cannot fetch accessToken` error from Faable Auth                   | Client ID / Client Secret on the connection don't match the values on GitHub, or the secret has been regenerated and not updated in Faable Auth.                        |
| Login succeeds but `email` is empty on the user                     | The connection is missing the `user:email` scope, or the user has no verified email on GitHub. Re-check the connection scope list and the user's GitHub email settings. |
| Organization members hit a "this app needs approval" page on GitHub | The GitHub organization enforces OAuth App access restrictions. An organization owner must approve the OAuth App.                                                       |
| `Provider mapper cannot obtain a valid id for user`                 | The `/user` response is missing `id`. Almost always means the access token request actually returned an error body — check the auth service logs.                       |
