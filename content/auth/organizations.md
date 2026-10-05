---
title: Organizations and Enterprise SSO
description: Give each of your B2B customers an organization in your Faable Auth tenant — verified email domains, their own OpenID Connect identity provider found by email domain, auto-join into teams and Require SSO claims for your API.
---

# Organizations and Enterprise SSO

An **organization** groups [teams](/auth/team-invitations) of your tenant and owns the identity of one company: its **verified email domains**, its **identity provider**, **auto-join** and **Require SSO**. It never grants access by itself — access is team membership.

Typical use: you run a B2B SaaS on Faable Auth and each customer company wants its employees to sign in with their own Okta, Entra, Google Workspace or Faable Auth tenant.

All endpoints are part of the **Management API** (scopes `…:organizations`). Domains, the identity provider, auto-join and Require SSO need the **Pro** plan.

## Endpoints

| Method   | Path                                      | Purpose                                                                 |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `POST`   | `/organization`                           | Create (`name`, optional `admins`).                                     |
| `POST`   | `/organization/:id/admin`                 | Add an admin (`user_id`).                                               |
| `DELETE` | `/organization/:id/admin/:user_id`        | Remove an admin; one always remains.                                    |
| `PUT`    | `/team/:team_id/organization`             | Put a team in an organization (`{"organization": id}`) or out (`null`). |
| `POST`   | `/organization/:id/domain`                | Claim an email domain; returns its `verification_token`.                |
| `POST`   | `/organization/:id/domain/:domain/verify` | Verify it through DNS.                                                  |
| `DELETE` | `/organization/:id/domain/:domain`        | Remove a domain.                                                        |
| `PUT`    | `/organization/:id/auto-join`             | Teams and roles people of the domains join on sign-in.                  |
| `PUT`    | `/organization/:id/require-sso`           | Turn Require SSO on or off.                                             |

Webhooks: `organization.created`, `organization.updated`, `organization.deleted` (payload `{organization_id}`), and `team.updated` when a team changes organization.

## Verified domains

Claim the domain, publish `_faable-challenge.<domain>  TXT  faable-verification=<verification_token>` and call verify. A verified domain belongs to one organization of your tenant. Public email providers cannot be claimed.

## The organization's identity provider

Create an `oidc` [connection](/auth/connections) with `organization` set to the organization id (issuer, authorization, token and userinfo URLs, client ID and secret). Then:

- **Home realm discovery** — on the identifier-first screen, an address of a verified domain goes straight to that connection.
- The connection can only sign in addresses of the organization's verified domains (`organization_domain_mismatch` otherwise).
- When the provider attests the email (`email_verified: true`), a user who already exists with that address is the one who signs in: the identity is added to them instead of creating a second account.

## Auto-join

`PUT /organization/:id/auto-join` with `[{ "team": "team_…", "roles": ["role_…"] }]`: whoever signs in with a verified email of a verified domain joins those teams. Existing members are never changed. The membership comes out as `team.member.added` with `method: "domain"`.

## Require SSO in your API

When a user's verified email belongs to a verified domain of an organization, their access tokens carry two claims:

| Claim                        | Value                                                                       |
| ---------------------------- | --------------------------------------------------------------------------- |
| `https://faable.com/org`     | The organization of the user's email domain.                                |
| `https://faable.com/org_sso` | `true` when this session came through the organization's identity provider. |

With `require_sso` on, refuse those users on the organization's resources unless `org_sso` is `true`. Users of other domains carry neither claim and are not affected. Tokens from direct grants (password, OTP) do not carry them — treat their absence as "not SSO".
