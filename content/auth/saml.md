---
title: SAML Single Sign-On for Your Apps
description: Make your Faable Auth tenant the SAML 2.0 identity provider of any application that speaks SAML — Slack, Notion, a corporate SaaS — with the same login, MFA and actions as the rest of your apps.
---

# SAML Single Sign-On for Your Apps

Some applications only accept single sign-on over **SAML 2.0**. With SAML on a [client](/auth/clients), your Faable Auth tenant becomes that application's **identity provider (IdP)**: your users sign in to it with the same login screen, session, [two-step verification](/auth/mfa) and [actions](/auth/extensibility/actions) as every other app of the tenant.

This page is about Faable Auth **as the identity provider**. Bringing a company's own identity provider to your tenant works over OpenID Connect — see [Organizations and Enterprise SSO](/auth/organizations). Inbound SAML connections are not available.

SAML needs the **Pro** plan.

## Set it up

1. In the dashboard, open **Clients** and create a client for the application (or open an existing one).
2. In the **SAML** section, enter what the application gives you:
   - **Service Provider Entity ID** — also called _Audience_, _SP Entity ID_ or _Identifier_.
   - **Assertion Consumer Service URL** — also called _ACS URL_, _Reply URL_ or _Single sign-on URL_ on the app side. It must be `https`.
3. Switch **Sign in with SAML** on.
4. Give the application the three values the section now shows:
   - **Metadata URL** — most apps import everything from it, signing certificate included.
   - **Identity Provider Entity ID** — your tenant's issuer, e.g. `https://acme.auth.faable.link`.
   - **Single sign-on URL** — `https://<your-domain>/saml/sso/<client_id>`.

With a [custom domain](/auth/custom-domain) set as canonical, every URL uses it.

## Endpoints

| Method       | Path                        | Purpose                                                                                                            |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET`        | `/saml/metadata/:client_id` | IdP metadata: entity ID, single sign-on URL and signing certificates.                                              |
| `GET`/`POST` | `/saml/sso/:client_id`      | Single sign-on (HTTP-Redirect and HTTP-POST bindings). Without a `SAMLRequest` it starts an IdP-initiated sign-in. |

## What the application receives

- **NameID** — the user's email by default. Choose **Persistent** to send the stable user id instead (it survives an email change), or **Unspecified** to send the email when the user has one and the user id otherwise. With the email format, a user without an email cannot sign in to that application.
- **Attributes** — `email`, `name`, `given_name` and `family_name`, plus every ID token claim your post-login actions set with `api.idToken.setCustomClaim`. Use an action to send groups or roles.
- **Authentication context** — `https://refeds.org/profile/mfa` when the user passed two-step verification, `PasswordProtectedTransport` after a password, `unspecified` otherwise.
- The **assertion is always signed** (RSA-SHA256). The whole response is signed too, unless you turn **Sign the whole response** off for an application that rejects a doubly-signed message. Assertions are valid for 5 minutes.

## How a sign-in works

- **SP-initiated**: the application redirects to the single sign-on URL with a `SAMLRequest`. If the user already has a session, they come straight back signed in; otherwise they see your login screen first.
- **IdP-initiated**: opening the single sign-on URL with no request (a bookmark, a link in your portal) signs the user in and posts to the application. A `RelayState` query parameter is passed through.
- `ForceAuthn` makes the user sign in again; `IsPassive` never shows a screen and answers `NoPassive` when there is no session.
- When the login comes back with an error instead of a user (`IsPassive` without a session, a denied consent), the application receives a signed SAML error response.
- Every response goes **only** to the Assertion Consumer Service URL you configured. A request that names another ACS URL, comes from another entity ID or asks for a binding other than HTTP-POST is refused with `saml_sp_mismatch`.
- Each sign-in is recorded in the tenant's [logs](/auth/logs) as `saml.response`.

## Rotate the signing certificate

The SAML certificate is separate from the keys that sign your tokens, so rotating token keys never breaks a SAML application. Rotation takes two calls to the Management API (scope `update:accountkeys`):

1. `POST /account/keys/saml/rotate` — a new certificate is **staged**: the metadata publishes both, and assertions are still signed with the current one. Update each application (or let it re-read the metadata).
2. `POST /account/keys/saml/rotate` again — the new certificate is **promoted** and the old one is dropped.

`GET /account/keys/saml` returns the current certificate, and the staged one if there is one.

## Errors

| Code                   | When                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `saml_not_enabled`     | The client has no SAML, or it is switched off.                                           |
| `saml_sp_mismatch`     | The request's Issuer, ACS URL or binding does not match the client's configuration.      |
| `invalid_saml_request` | The `SAMLRequest` is missing, too large, not well-formed or not a SAML 2.0 AuthnRequest. |
| `invalid_saml_sp`      | Saving a configuration whose ACS URL is not an absolute `https` URL.                     |
| `plan_required`        | Switching SAML on outside the Pro plan.                                                  |

Not supported yet: single logout (SLO), signed or encrypted AuthnRequests, and encrypted assertions.
