---
title: Connections
description: Learn about Connections in Faable Auth. Configure database, social, passwordless, and enterprise identity providers for a seamless login experience.
---

# Connections

In Faable Auth, a **Connection** represents a source of users. It defines how your users will authenticate when logging into your application. Connections are the core building blocks that enable different authentication methods without having to write custom integrations for each one of them.

You can configure and manage all your connections directly from the **Faable Dashboard**.

## Types of Connections

Every connection has a `connection_type`. These are all of them:

| `connection_type`    | Category       | What it is                                                                                                                                                                                  |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database`           | `database`     | Email + password. Faable Auth stores and manages the credentials on your behalf.                                                                                                            |
| `google_oauth2`      | `social`       | [Google](social/google.md) sign-in. Endpoints preconfigured.                                                                                                                                |
| `github`             | `social`       | [GitHub](social/github.md) sign-in. Endpoints preconfigured.                                                                                                                                |
| `microsoft`          | `social`       | [Microsoft / Entra ID](social/microsoft.md) — work, school and personal Microsoft accounts. Endpoints preconfigured.                                                                        |
| `figma`              | `social`       | Figma sign-in. Endpoints preconfigured; bring your own OAuth app.                                                                                                                           |
| `custom`             | `social`       | Any other OAuth 2.0 provider — you supply the authorize, token and userinfo URLs. See [Facebook](social/facebook.md) for a worked example.                                                  |
| `passwordless_email` | `passwordless` | [Magic link or one-time code](passwordless.md) by email. The address itself is the identity.                                                                                                |
| `oidc`               | `oidc`         | An external OIDC **issuer** whose JWTs are trusted in a [Token Exchange](oauth-flows/token-exchange.md) — GitHub Actions being the canonical case. Machine-to-machine, not a browser login. |

Those four **categories** (`database`, `social`, `passwordless`, `oidc`) are what the dashboard sidebar and the API filter on: `GET /connections?category=social`.

> **Not available yet:** SMS one-time codes, SAML, and any pre-built enterprise SSO connector (Okta, Entra ID as an _enterprise_ connection rather than a social one). For an OIDC-compliant corporate IdP, a `custom` connection covers browser login today, as long as its userinfo endpoint returns `id`, `name` and `email`.

## Using Connections for OAuth Login

When a developer uses Faable Auth to implement a login flow (such as the standard OAuth2 Authorization Code flow), the concept of a connection is crucial.

1.  **Creation:** First, you create and configure a Connection in the Faable Dashboard (e.g., you create a Google social connection and provide your Google Client ID and Secret). Each connection is assigned a unique name.
2.  **Authentication Request:** When your application redirects the user to the Faable Auth `/authorize` endpoint to log in, you can optionally include the `connection_id` parameter in the URL.
    - If you specify a specific connection (e.g., `connection_id=connection_abc123`, shown in the dashboard), Faable Auth will directly redirect the user to that provider's login page, bypassing the generic login screen. (The legacy `connection` parameter, which takes the connection name, is still accepted as a deprecated alias.)
    - If you don't specify a connection, Faable Auth will display the Universal Login screen, presenting the user with options for all the connections that are enabled for your client application (e.g., an email/password form alongside a "Log in with Google" button).
3.  **Unified Profile:** Regardless of the connection used to log in, Faable Auth normalizes the user data. It handles the specific handshake with the external provider and returns a standard set of OAuth2/OIDC tokens (Access Token, ID Token) to your application. This means your application's logic remains exactly the same whether the user logged in with a password, a magic link, or their GitHub account.

## Next Steps

Now that you understand what Connections are, you can learn how to integrate them into your application by exploring the following topics:

- **[Clients](clients.md):** Learn how to register your front-end application or backend API to use these connections.
- **[OAuth 2.0 Flows](oauth-flows):** Choose the right flow for your application type.
- **[Authorization Code Flow](oauth-flows/authorization-code.md):** Understand the standard OAuth2 flow used to redirect users to Faable Auth and handle the login callback.
- **[Social Login](social):** Set up Google, GitHub or Microsoft sign-in from one place.
- **[Passwordless](passwordless.md):** Magic links and one-time codes, no password to remember.
- **[Quickstart Next.js](quickstart/nextjs.md):** Jump straight into the code and see a full authentication implementation in action.
- **[Quickstart React Native](quickstart/react-native.md):** Jump straight into the code and see a full authentication implementation in action.
