---
title: WordPress sign-in with Faable Auth
description: Replace the WordPress login with Faable Auth (OpenID Connect with PKCE). Roles synced from your Auth tenant on every login, account linking by verified email, federated logout, machine-to-machine tokens for the REST API, and emergency access. Comes connected on Faable Deploy; one click on any other host.
rank: high
---

# WordPress sign-in with Faable Auth

The Faable Auth plugin makes a WordPress site an OpenID Connect client of your Faable Auth tenant. `wp-login.php` shows a **Log in with Faable** button instead of the username and password form, and who can get in, and as what, is decided by the roles your users have in Faable Auth.

Your editors and administrators sign in with the same account they use in the rest of your product, with the social logins, passkeys and two-step verification your tenant already offers, and every login lands in the same [audit log](../logs.md).

## What the plugin does

- **Sign in with Faable only.** Authorization code flow with PKCE (S256). Once the site is connected, password logins, password resets, registration, XML-RPC authentication and Application Passwords are turned off.
- **Accounts without local passwords.** A user is created on their first login, with no usable local password.
- **Roles from Faable Auth, re-synced on every login.** The user gets the WordPress role their Faable Auth role maps to. A user whose roles map to nothing gets no account, and an existing user who lost their role loses their WordPress role and sessions at their next login.
- **Linking by verified email.** A WordPress user that existed before the plugin is linked to the Faable Auth account with the same email, but only if Faable Auth reports that email as verified.
- **Federated logout (optional).** Logging out of WordPress also ends the Faable Auth session.
- **Headless front-ends.** The REST API accepts Faable Auth machine-to-machine (`client_credentials`) tokens instead of Basic Auth with an Application Password.
- **Emergency access** from day one, in case Faable Auth cannot be reached.

It works with any Faable Auth plan, including Free. WordPress 6.4 or later and PHP 8.1 or later. Multisite is not supported in this version.

## Two ways it runs

|                                | On Faable Deploy                                          | Self-hosted WordPress                                                     |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Install                        | Comes in the image of WordPress from the Faable catalogue | Install and activate the plugin                                           |
| Connect                        | Already connected when the site is installed              | Settings → Faable Auth → **Connect with Faable**, or manual configuration |
| Client in your tenant          | Created by the platform                                   | Created by the dashboard (Connect) or by you (manual)                     |
| Disconnect or deactivate       | Not possible while the site is hosted on Faable           | Yes; the native login comes back                                          |
| Role map, REST, logout options | Editable                                                  | Editable                                                                  |

### On Faable Deploy

When you install WordPress from the Faable catalogue, sign-in is set up for you as part of the install:

1. The platform creates the site's OIDC client in your project's Faable Auth tenant and gives the site its credentials as environment variables.
2. It creates the tenant roles `administrator`, `editor`, `author`, `contributor` and `subscriber`, if they do not exist yet.
3. It gives `administrator` to the email of the person who installed the site. If that email is not a user of the tenant yet, it is invited.

The plugin is loaded as a must-use plugin from the image, so it cannot be deactivated, and its connection cannot be changed or disconnected while the site is hosted on Faable. Settings → Faable Auth says **Managed by Faable** and shows the tenant domain, client ID and redirect URI read-only, with a **Manage users and roles in Faable** button that takes you to the tenant in the [Faable dashboard](https://dashboard.faable.com).

Who can get in, and with which role, is managed there: invite a user to the tenant and give them one of the five roles. Being a member of the Faable project gives no role on the site.

### Self-hosted WordPress

Install and activate the plugin. Until the site is connected, the normal WordPress login stays on, so the administrator who connects it can still log in.

**Connect with Faable (recommended).** Go to Settings → Faable Auth and press **Connect with Faable**. You log in to Faable, pick the project and the Auth tenant, and the dashboard creates the site's client and sends you back connected. From then on, the site signs in with Faable only.

Create the roles your users need in the tenant (see [Roles](#roles)) and give yourself `administrator` **before** you log out, or your next login will be refused. If that happens, use [emergency access](#emergency-access).

**Manual configuration.** If you cannot use Connect, create a regular web [client](../clients.md) in your tenant, register this redirect URI on it (the settings page shows the exact value for your site):

```text
https://<your-site>/wp-login.php?faable-auth=callback
```

and fill the **Manual configuration** section of the settings page:

| Field         | Value                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Tenant domain | Your tenant URL, e.g. `https://acme.auth.faable.link`, or its [custom domain](../custom-domain.md). Must be `https`. |
| Client ID     | The client's ID.                                                                                                     |
| Client secret | The client's secret. It is stored encrypted with the site's salts.                                                   |

**Environment variables or `wp-config.php`.** Every setting can also come from an environment variable or a PHP constant of the same name. A value set this way wins over the settings page and shows there read-only.

```php
// wp-config.php
define( 'FAABLE_AUTH_DOMAIN', 'https://acme.auth.faable.link' );
define( 'FAABLE_AUTH_CLIENT_ID', '...' );
define( 'FAABLE_AUTH_CLIENT_SECRET', '...' );
```

| Name                                                                                                       | Purpose                                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `FAABLE_AUTH_DOMAIN`                                                                                       | Tenant URL (the token issuer), no trailing slash.                                                                  |
| `FAABLE_AUTH_CLIENT_ID`, `FAABLE_AUTH_CLIENT_SECRET`                                                       | The site's client in that tenant.                                                                                  |
| `FAABLE_AUTH_AUDIENCE`                                                                                     | Optional. An [API](../apis.md) of the tenant with "include roles in ID token" on; roles then come in the ID token. |
| `FAABLE_AUTH_ROLE_MAP`                                                                                     | Optional. The role map, as JSON (`{"staff":"editor"}`) or `faable_role = wp_role` lines.                           |
| `FAABLE_AUTH_REST_AUDIENCE`, `FAABLE_AUTH_REST_USER`, `FAABLE_AUTH_REST_CLIENTS`, `FAABLE_AUTH_REST_SCOPE` | Optional. [REST API with machine-to-machine tokens](#headless-front-ends-rest-api).                                |
| `FAABLE_AUTH_FEDERATED_LOGOUT`                                                                             | Optional. `true` to end the Faable Auth session on logout.                                                         |
| `FAABLE_AUTH_BREAK_GLASS`                                                                                  | Emergency access, see below.                                                                                       |

Removing the plugin brings back the normal WordPress login. Users created by the plugin have no local password; each of them sets one with "Lost your password?".

## Roles

Roles come only from your Faable Auth tenant ([Roles and Permissions](../roles-and-permissions.md)). The settings page holds a role map, one `Faable Auth role = WordPress role` per line. The default is:

```text
administrator = administrator
admin = administrator
editor = editor
author = author
contributor = contributor
subscriber = subscriber
```

Role names are case-insensitive. You can map your own tenant roles, e.g. `staff = editor`, and map to custom WordPress roles too.

- On every login, the user's Faable Auth roles are read and the user gets the mapped WordPress role. If several roles map, the most privileged one wins.
- A user with **no mapped role** is refused with a message asking them to get a role from a site administrator. If they already had a WordPress account, its role is removed and its sessions are ended.
- If the roles cannot be read, the login is refused rather than guessed.

**Where the roles are read from.** If you set an API audience whose API includes roles in ID tokens, they come in the ID token's `roles` claim. Otherwise the plugin reads them from your tenant's Management API (`GET /user/:id/roles`) with a `client_credentials` token of the site's own client, limited to `read:rolemembers` and cached for its lifetime (about one token a day). For that, the site's client needs the Management API scope `read:rolemembers` (see [Client Credentials](../oauth-flows/client-credentials.mdx)).

## Existing WordPress users

A Faable Auth user is matched to a WordPress user in this order:

1. The WordPress user already linked to that Faable Auth account.
2. A WordPress user with the same email that is not linked to any Faable Auth account yet, **only if the email is verified** in Faable Auth.
3. Otherwise a new WordPress user is created, with the name from Faable Auth and no local password.

If the email belongs to an existing WordPress user but Faable Auth has not verified it, the login is refused and the user is asked to verify their email first. A user without an email in Faable Auth cannot get an account.

## Federated logout

By default, logging out of WordPress ends only the WordPress session. Tick **Also end the Faable session on logout** (or set `FAABLE_AUTH_FEDERATED_LOGOUT`) to send the browser to the tenant's logout endpoint as well ([RP-Initiated Logout](../oidc/logout.md)).

Add this URL to the client's **Logout URLs** first, or Faable Auth refuses the logout:

```text
https://<your-site>/wp-login.php?loggedout=true
```

## Headless front-ends (REST API)

Application Passwords are off once the site is connected. A headless front-end (Next.js, a mobile app, a build job) calls the REST API with a Faable Auth [machine-to-machine token](../oauth-flows/client-credentials.mdx) instead:

```bash
curl https://<your-site>/wp-json/wp/v2/posts \
  -H "Authorization: Bearer <access_token>"
```

Configure it in the **Headless** section of the settings page:

| Setting                   | Meaning                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Token audience            | Identifier of the [API](../apis.md) of your tenant the tokens are issued for. Empty: Bearer tokens are not accepted.                  |
| Acts as user (login)      | The WordPress user the requests act as; they get that user's capabilities. Create a dedicated user with the smallest role that works. |
| Allowed client IDs        | Comma separated. Empty: any client of the tenant.                                                                                     |
| Required scope (optional) | A scope or permission every token must carry.                                                                                         |

A request is accepted when the token is signed by your tenant, issued for that audience, is a `client_credentials` token (tokens issued to a user are refused), comes from an allowed client and carries the required scope if one is set. Otherwise the API answers `401` or `403`.

Move each front-end from Basic Auth to a `client_credentials` token **before** connecting the site, since Application Passwords stop working at that moment.

## Emergency access

If Faable Auth cannot be reached, nobody can log in. There are two ways in, and you should know them before you need them.

**Break glass.** Add this line to `wp-config.php` (or set the environment variable `FAABLE_AUTH_BREAK_GLASS=1`):

```php
define( 'FAABLE_AUTH_BREAK_GLASS', true );
```

The username and password form, "Lost your password?" and password resets come back, next to the Faable button, and the admin shows a warning while it is on. Users created by the plugin have no local password: they use "Lost your password?", or an administrator sets one with `wp user update <user> --user_pass=<password>`. Remove the line once Faable Auth is back.

**One-time login link.** With WP-CLI:

```bash
wp faable-auth login-link <user>
```

prints a URL that logs in as that user (ID, login or email) once, within 10 minutes. It works whether or not break glass is on. Opening it shows a confirmation button, so link previews in chat apps do not use it up. On Faable Deploy, run it as a Task.

`wp faable-auth status` shows the login mode, whether the site is managed by Faable, whether break glass is on, and where each setting comes from. It never prints the secret.

## Troubleshooting

| Symptom                                              | Cause and fix                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Your Faable account has no access to this site"     | The user has no tenant role that the role map maps. Give them one in Faable Auth, or add their role to the map.                                   |
| "Your roles could not be read from Faable Auth"      | The site's client cannot read roles from the Management API. Give it `read:rolemembers`, or set an API audience that includes roles in ID tokens. |
| "A user with your email already exists on this site" | The email is taken by a WordPress user and is not verified in Faable Auth. Verify it and log in again.                                            |
| Logout shows an error from Faable Auth               | Federated logout is on, but `https://<your-site>/wp-login.php?loggedout=true` is not in the client's Logout URLs.                                 |
| The native login came back after changing salts      | The stored secret can no longer be decrypted. Reconnect in Settings → Faable Auth.                                                                |
| A headless front-end gets `401`                      | Application Passwords are off. Send a `client_credentials` token for the configured audience.                                                     |

## Developers

Filters: `faable_auth_wp_role`, `faable_auth_authorize_params`, `faable_auth_rest_user_id`. Actions: `faable_auth_user_created`, `faable_auth_user_synced`, `faable_auth_login_failed`, `faable_auth_login_link_used`.

Further reading: [Authorization Code Flow](../oauth-flows/authorization-code.md) · [Client Credentials](../oauth-flows/client-credentials.mdx) · [Roles and Permissions](../roles-and-permissions.md) · [Clients](../clients.md) · [Logs](../logs.md).
