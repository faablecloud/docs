---
title: Shopify Plus customer accounts
description: Use Faable Auth as the OpenID Connect identity provider for a Shopify Plus store, so shoppers sign in to the storefront with the same account they use everywhere else.
---

# Shopify Plus customer accounts

Shopify Plus lets a store replace the built-in customer login with **your own OpenID Connect identity provider**. Point it at Faable Auth and your shoppers sign in to the storefront with the same account they use in the rest of your product — one identity, one password reset, one audit log.

Faable Auth satisfies every requirement Shopify publishes for a third-party provider: authorization code flow, PKCE (S256), discovery, JWKS, RS256 signing, refresh tokens and RP-Initiated Logout.

## Before you start

- **A Shopify Plus plan.** Connecting your own identity provider is a Plus-only feature. On any other plan the option does not exist in the Shopify admin.
- **A Faable Auth tenant on HTTPS** — either your custom domain or the `*.auth.faable.link` one.
- **An application** in your tenant (Dashboard → Applications). You will use its Client ID and Client Secret.

## What you paste into Shopify

| Field                      | Value                                                        |
| -------------------------- | ------------------------------------------------------------ |
| Issuer                     | `https://your-domain`                                        |
| Discovery / well-known URL | `https://your-domain/.well-known/openid-configuration`       |
| Client ID                  | Dashboard → Applications → your app → **Client ID**          |
| Client secret              | Same screen → **Client Secret**                              |
| Scopes                     | `openid email` (add `profile` to also pass name and picture) |

If the Shopify form asks for endpoints individually rather than reading discovery:

| Endpoint      | URL                                         |
| ------------- | ------------------------------------------- |
| Authorization | `https://your-domain/authorize`             |
| Token         | `https://your-domain/oauth/token`           |
| JWKS          | `https://your-domain/.well-known/jwks.json` |
| Logout        | `https://your-domain/logout`                |

> **Use the exact same hostname everywhere, with no trailing slash.** Faable Auth derives the `iss` claim from the host that served the request, so a discovery document fetched from your custom domain issues tokens with that domain as issuer. If you configure Shopify with one hostname and your application uses another, Shopify rejects the ID token because the issuer does not match.

## What you paste into Faable Auth

Copy these two URLs out of the Shopify admin once the connection exists, and add them to your application:

- The **redirect URI** → _Allowed Callback URLs_
- The **post-logout redirect URI** → _Allowed Logout URLs_

Logout returns a `400` if the URL a Relying Party asks to return to is not in _Allowed Logout URLs_. It is the single most common thing to forget, and it only shows up the first time a customer signs out.

## Email verification is required

This is the part worth reading twice. **Shopify only provisions a customer account when the ID token carries `email_verified: true`.** A user whose email Faable Auth has not verified can authenticate perfectly and still be turned away by Shopify.

Faable Auth reports `email_verified` honestly — it never asserts a verification that did not happen — so which connection your users sign in with decides whether they can shop:

| Connection                                             | `email_verified`                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| **Passwordless** (magic link or code)                  | ✅ always — proving control of the inbox _is_ the login            |
| Email + password (database)                            | ❌ **not at signup** — until the user clicks the verification link |
| Google, GitHub                                         | ✅ when the provider attests it                                    |
| **Microsoft (Entra ID)**                               | ❌ never — see below                                               |
| After a verification link, invitation, or email change | ✅                                                                 |

**Recommendation: use a passwordless connection for stores.** Every user is verified by construction and there is nothing else to configure.

If you use **email + password**, turn on automatic verification emails for the account (Dashboard → Settings → Notifications) so new users receive the verification link at signup. Until they click it, their first Shopify sign-in fails.

**Microsoft never reports a verified email**, and that is deliberate. Entra sources the email from the directory's `mail` attribute, which a tenant administrator can point at a domain they do not own — so treating it as verified would let them claim someone else's customer account. Microsoft users must complete Faable Auth's own email verification before they can use the storefront.

To check a specific user, read `email_verified` on `GET /user/:id`, or open the user in the dashboard.

## Troubleshooting

| Symptom                                        | Cause                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Shopify rejects the provider at setup          | Discovery URL unreachable, or the issuer does not match byte for byte (trailing slash, `www.`, `http` vs `https`) |
| The connection option is missing in Shopify    | The store is not on Shopify Plus                                                                                  |
| A customer signs in but Shopify shows an error | `email_verified` is not `true` for that user — see above                                                          |
| Sign-out shows a 400 page                      | Shopify's post-logout URL is not in _Allowed Logout URLs_                                                         |
| `invalid_client` at token exchange             | Wrong Client Secret                                                                                               |

## Limitations

- Shopify supports **RP-Initiated Logout** only. Back-channel and front-channel logout are not used, so a session ended elsewhere is not pushed to the storefront.
- Implicit and hybrid flows are unsupported on both sides. Authorization code only.
- One Faable Auth application per store.
