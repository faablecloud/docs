---
title: Connections
description: Learn about Connections in Faable Auth. Configure database, social, passwordless, and enterprise identity providers for a seamless login experience.
---

# Connections

In Faable Auth, a **Connection** represents a source of users. It defines how your users will authenticate when logging into your application. Connections are the core building blocks that enable different authentication methods without having to write custom integrations for each one of them.

You can configure and manage all your connections directly from the **Faable Dashboard**.

## Types of Connections

Faable Auth supports various connection types to accommodate different authentication needs:

- **Database Connections (Username & Password):** The traditional way of authenticating users. Faable Auth securely stores and manages credentials on your behalf.
- **Social Connections:** Allow users to log in using their existing accounts from popular providers like Google, GitHub, Apple, Facebook, and more. This reduces friction during the signup process.
- **Passwordless Connections:** Enable users to log in without a password, using methods like Magic Links sent via email or OTPs (One-Time Passwords) sent via SMS or email.
- **Enterprise Connections:** Integrate with corporate identity providers like Azure Active Directory, Okta, or any other SAML / OpenID Connect compliant server.

## Using Connections for OAuth Login

When a developer uses Faable Auth to implement a login flow (such as the standard OAuth2 Authorization Code flow), the concept of a connection is crucial.

1.  **Creation:** First, you create and configure a Connection in the Faable Dashboard (e.g., you create a Google social connection and provide your Google Client ID and Secret). Each connection is assigned a unique name.
2.  **Authentication Request:** When your application redirects the user to the Faable Auth `/authorize` endpoint to log in, you can optionally include the `connection` parameter in the URL.
    - If you specify a specific connection (e.g., `connection=google-oauth2`), Faable Auth will directly redirect the user to that provider's login page, bypassing the generic login screen.
    - If you don't specify a connection, Faable Auth will display the Universal Login screen, presenting the user with options for all the connections that are enabled for your client application (e.g., an email/password form alongside a "Log in with Google" button).
3.  **Unified Profile:** Regardless of the connection used to log in, Faable Auth normalizes the user data. It handles the specific handshake with the external provider and returns a standard set of OAuth2/OIDC tokens (Access Token, ID Token) to your application. This means your application's logic remains exactly the same whether the user logged in with a password, a magic link, or their GitHub account.

## Next Steps

Now that you understand what Connections are, you can learn how to integrate them into your application by exploring the following topics:

- **[Clients](clients.md):** Learn how to register your front-end application or backend API to use these connections.
- **[Authorization Code Flow](oauth-flows/authorization-code.md):** Understand the standard OAuth2 flow used to redirect users to Faable Auth and handle the login callback.
- **[Social Login Setup](social/google.md):** See an example of how to configure a specific social connection like Google.
- **[Quickstart Next.js](quickstart/nextjs.md):** Jump straight into the code and see a full authentication implementation in action.
- **[Quickstart React Native](quickstart/react-native.md):** Jump straight into the code and see a full authentication implementation in action.
