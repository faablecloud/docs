---
title: Microsoft (Entra ID) Social Login
description: Enable Microsoft social login in Faable Auth. Register an Entra ID app, configure the redirect URI, restrict sign-in to your own directory, and understand how Faable maps the Microsoft Graph profile.
---

## Microsoft (Entra ID) Social Login

The Microsoft social connection lets users sign in with a **Microsoft account** — both work/school identities from **Microsoft Entra ID** (formerly Azure AD) and personal accounts (`outlook.com`, `hotmail.com`, Xbox). Faable Auth talks to the Microsoft identity platform on the `common` authority, which accepts both, so a single connection type covers what other providers split into two.

Faable Auth runs the standard [Microsoft identity platform Authorization Code flow](https://learn.microsoft.com/entra/identity-platform/v2-oauth2-auth-code-flow). After consent, Microsoft redirects back to Faable Auth's `/callback`, which exchanges the code for a token, fetches the profile from `https://graph.microsoft.com/oidc/userinfo`, normalizes it, and issues your application its own OAuth 2.0 / OIDC tokens.

## Two ways to enable it

|                           | **Faable's shared app**                                         | **Your own Entra app**                          |
| ------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Setup                     | Toggle the connection on. No Azure portal.                      | Register an app in Entra ID, paste credentials. |
| Consent screen shows      | Faable                                                          | Your company name                               |
| Redirect URI at Microsoft | `https://faable.auth.faable.link/callback` (already registered) | `https://{YOUR_DOMAIN}/callback`                |
| Restrict to one directory | ❌ Not possible                                                 | ✅ Yes                                          |
| Good for                  | Trying it out, side projects                                    | Production, anything branded                    |

Leaving **Client ID** and **Client Secret** empty puts the connection on Faable's shared app registration; filling them in switches it to yours. The connection's read-only `is_using_default_credentials` field tells you which mode it's in.

> **Switching modes changes user identities.** Read [Entra's `sub` is pairwise](#entras-sub-is-pairwise-plan-before-you-switch-apps) before you move a live connection from the shared app to your own.

---

## Option A — Use Faable's shared app

1. In the Faable Dashboard, go to **Auth → Social Login** and click **Create**.
2. Choose **Microsoft** as the connection type.
3. Name the connection (e.g. `microsoft`), leave **Client ID** and **Client Secret** empty, toggle **Enabled** on and save.

Sign-in works immediately. Because Google, GitHub and Microsoft all require an **exact, non-wildcard** redirect URI — and per-tenant subdomains cannot all be registered in one app — connections on shared credentials send Microsoft to a single central callback (`https://faable.auth.faable.link/callback`). That host acts as a pure relay: it forwards `?code&state` to your own auth domain, where the session cookie is set. Nothing to configure on your side, but it's why the consent screen says Faable.

---

## Option B — Register your own Entra ID app

### Find your Faable Auth domain

1. In the Faable Dashboard, go to **Auth → Settings → Custom Domains**.
2. Without a custom domain, your Faable Auth domain is `{YOUR_FAABLEAUTH_NAME}.auth.faable.link`.
3. Your redirect URI is:

   ```
   https://{YOUR_DOMAIN}/callback
   ```

   The path is always `/callback` — one account-wide callback handled by Faable Auth, not by your application. Your app's own redirect URI (registered on the Faable Auth [Client](../clients.md)) is invoked later, once Faable finishes the handshake with Microsoft.

### Register the app

1. Open the [Microsoft Entra admin center](https://entra.microsoft.com) → **Identity → Applications → App registrations** → **New registration**. (The same blade exists in the Azure portal.)
2. Fill in:

   | Field                       | Value to Provide                                                                                                                                                                                                                                              |
   | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | **Name**                    | The name users see on the consent screen (e.g. `Acme Corp`).                                                                                                                                                                                                  |
   | **Supported account types** | _Accounts in any organizational directory and personal Microsoft accounts_ for the widest reach, or _Accounts in this organizational directory only_ to lock sign-in to your company — see [Restricting sign-in](#restricting-sign-in-to-your-own-directory). |
   | **Redirect URI**            | Platform **Web** → `https://{YOUR_DOMAIN}/callback`. Must match exactly: scheme, host, path, no trailing slash.                                                                                                                                               |

3. Click **Register** and copy the **Application (client) ID** from the overview page.
4. Go to **Certificates & secrets → Client secrets → New client secret**. Copy the **Value** (not the Secret ID) immediately — Entra shows it once.
5. Under **API permissions**, confirm the delegated Microsoft Graph permissions `openid`, `profile`, `email`. They are granted by default and are all Faable needs.

> **Entra client secrets always expire.** The maximum lifetime is 24 months and there is no "never expires" option. Put the expiry date in your calendar: when the secret lapses, every sign-in through this connection breaks at once with a token-exchange error.

### Create the connection in Faable Auth

1. **Auth → Social Login → Create**, choose **Microsoft**.
2. Fill in:

   | Field               | Value to Provide                                                                                           |
   | ------------------- | ---------------------------------------------------------------------------------------------------------- |
   | **Connection name** | Internal identifier, e.g. `microsoft`.                                                                     |
   | **Client ID**       | The Application (client) ID from Entra.                                                                    |
   | **Client Secret**   | The secret **Value** from Entra. Stored encrypted at rest.                                                 |
   | **Scope**           | Optional. Defaults to `openid profile email` — see [Scopes](#scopes).                                      |
   | **Enabled clients** | Optional. Restrict which Faable Auth Clients can use this connection. Empty = every Client in the account. |
   | **Enabled**         | Toggle on to make the connection live.                                                                     |

3. Save.

The upstream URLs are preconfigured, so you do **not** enter them manually:

- **Authorize URL:** `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token URL:** `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- **User Info URL:** `https://graph.microsoft.com/oidc/userinfo`
- **Response type:** `code`

---

## Restricting sign-in to your own directory

The `common` authority accepts every Microsoft identity on earth, including personal accounts. To allow only members of your own Entra tenant, override both URLs on the connection, replacing `common` with your **Directory (tenant) ID**:

```
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
```

This only works with your own app registration — the shared Faable app is multi-tenant by construction. Set **Supported account types** to _this organizational directory only_ as well, so the restriction is enforced by Microsoft rather than by URL hygiene alone.

---

## Scopes

The default scope is **`openid profile email`**:

| Scope     | What it grants                                                                 |
| --------- | ------------------------------------------------------------------------------ |
| `openid`  | Required. Without it the `/oidc/userinfo` endpoint rejects the token outright. |
| `profile` | The name claims (`name`, `given_name`, `family_name`).                         |
| `email`   | The user's email address.                                                      |

Faable deliberately requests **no Microsoft Graph resource scopes** (`User.Read` and friends). They widen the consent screen for every tenant on the shared app and buy nothing the login flow needs. If your application calls Graph itself, request those scopes from your own app with your own token — don't bolt them onto the login connection.

---

## User profile mapping

Faable normalizes the `https://graph.microsoft.com/oidc/userinfo` response into the internal user shape:

| Faable user field | Source                                             | Notes                                                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `sub`                                              | **Pairwise** — see the warning below.                                                                                                                                                                                             |
| `name`            | `name`, falling back to `given_name + family_name` | `name` needs the `profile` scope and is absent on some guest accounts.                                                                                                                                                            |
| `given_name`      | `given_name`                                       |                                                                                                                                                                                                                                   |
| `family_name`     | `family_name`                                      |                                                                                                                                                                                                                                   |
| `email`           | `email`                                            | Comes from the directory `mail` attribute.                                                                                                                                                                                        |
| `picture`         | —                                                  | **Deliberately dropped.** Graph returns the literal string `https://graph.microsoft.com/v1.0/me/photo/$value`, an endpoint that demands a bearer token. Storing it would render a broken 401 image everywhere the avatar appears. |
| `email_verified`  | —                                                  | **Never set to true.** See below.                                                                                                                                                                                                 |

### Entra's `sub` is pairwise — plan before you switch apps

Unlike Google's `sub` or GitHub's numeric `id`, Microsoft's `sub` is **unique per (user, app registration)**. The same human signing in through Faable's shared app and through your own app produces two different `sub` values, so Faable sees two different identities.

Consequence: moving a live connection from shared credentials to your own app registration makes every existing user look brand new — they get a fresh account instead of their old one. Do it before you have users, or plan an identity migration.

### Why `email_verified` stays false

Microsoft does not return `email_verified`, and Entra's `email` comes from the directory `mail` attribute — which a tenant admin can point at a domain they do not own. That's the **nOAuth** class of account-takeover attack: an attacker who controls any Entra tenant sets `mail` to your user's address and, on a server that trusts it, takes over the account.

Faable therefore lands Microsoft users with `email_verified: false` and never treats the Microsoft-supplied address as proof of ownership. If you want a verified address, run Faable's own email verification on top.

---

## Trigger a login

Send users straight to Microsoft by passing the connection on `/authorize` (the id is shown on the connection in the dashboard):

```
https://{YOUR_DOMAIN}/authorize
  ?client_id={YOUR_CLIENT_ID}
  &response_type=code
  &redirect_uri={YOUR_APP_CALLBACK}
  &scope=openid%20profile%20email
  &state={RANDOM_STATE}
  &connection_id=connection_abc123
```

Omit `connection_id` and the Universal Login screen appears with Microsoft as one of the options, provided the connection is enabled for that Client. See [Authorization Code Flow](../oauth-flows/authorization-code.md) for the full request reference.

## Rotate or revoke credentials

- **Rotate the client secret:** create a new secret in **Certificates & secrets** _before_ the current one expires, paste it into the connection and save. Existing sessions are unaffected; only new sign-ins need the new secret.
- **Revoke a user's grant:** users manage this at [myapplications.microsoft.com](https://myapplications.microsoft.com). Revoking does not end their Faable session — that lives until it expires — but they will re-consent on their next Microsoft sign-in.
- **Delete the app registration:** cuts off everyone. Disable the Faable connection at the same time so users aren't routed to a broken upstream.

## Troubleshooting

| Symptom                                                                     | Likely cause                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AADSTS50011: redirect URI mismatch`                                        | The Redirect URI in Entra doesn't match `https://{YOUR_DOMAIN}/callback` exactly. If you're on shared credentials it must instead be Faable's relay — you shouldn't be registering anything at all. |
| `AADSTS7000215: Invalid client secret`                                      | The **Secret ID** was pasted instead of the secret **Value**, or the secret expired.                                                                                                                |
| `AADSTS50020: user account from identity provider does not exist in tenant` | The app is registered as single-tenant but the user belongs elsewhere. Widen **Supported account types**, or keep the restriction if that's the intent.                                             |
| Login works but the user has no name                                        | The `profile` scope was removed from the connection, or it's a guest account with no `name` in the directory.                                                                                       |
| Users show up as new accounts after a config change                         | The connection moved between the shared app and your own — `sub` is pairwise. See [above](#entras-sub-is-pairwise-plan-before-you-switch-apps).                                                     |
| All Microsoft logins break on the same day                                  | The Entra client secret expired. It always does, within 24 months at most.                                                                                                                          |

## Related

- [Social Login overview](../social) · [Connections](../connections.md) · [Clients](../clients.md)
- [Authorization Code Flow](../oauth-flows/authorization-code.md)
