---
title: Organizations and SSO
description: Group your company's Faable Deploy projects in an organization and let your people sign in with your company account — verified email domains, your own identity provider (your Faable Auth tenant, Okta, Entra or Google Workspace), auto-join and Require SSO.
---

# Organizations and SSO

An **organization** groups your company's projects and owns how your people sign in to Faable. It does **not** give anyone access to a project: who can reach a project, and with which role, is still that project's [members](/deploy/members).

What an organization adds:

| Capability                                                         | Plan                                |
| ------------------------------------------------------------------ | ----------------------------------- |
| Group projects; organization admins                                | All plans                           |
| **Verified email domains** (`@acme.com`)                           | Pro (one project of the org on Pro) |
| **Your identity provider**: people of your domains sign in with it | Pro                                 |
| **Auto-join**: people of your domains join chosen projects         | Pro                                 |
| **Require SSO** for your people on the organization's projects     | Pro                                 |

## Create an organization

In **Project settings → Organization**, an owner of the project types the company name and clicks **Create organization**. You become its admin and the project its first one. To add another project, open its settings and pick the organization — you must be an owner of the project **and** an admin of the organization.

Taking a project out makes it personal again. Nothing is deleted: projects, members and billing stay as they were.

## Verify your email domain

In the organization's settings (**Manage**, or `/settings/organizations/<id>`), add your domain and publish the TXT record it shows:

```txt
_faable-challenge.acme.com  TXT  faable-verification=<token>
```

Then click **Verify**. A domain belongs to one organization; public email providers (gmail.com, outlook.com…) cannot be claimed.

## Sign in with your identity provider

Under **Identity provider**, enter any OpenID Connect provider: issuer, authorization, token and userinfo URLs, client ID and secret. Register `https://faable.auth.faable.link/callback` as its redirect URL.

The natural choice is **your own Faable Auth tenant**: your company already signs in there with its own rules (MFA, passkeys), and it becomes your company's SSO for Faable. Okta, Microsoft Entra and Google Workspace work the same way.

From then on, whoever types an address of your verified domain on the Faable login screen is sent straight to your identity provider. Your provider can only sign in addresses of your verified domains, and someone who already had a Faable account with that address keeps it — the company login is added to it.

## Auto-join

Choose, per project, whether people of your verified domains join it automatically on their first sign-in, and as **viewer** or **member** (never owner). Nobody who is already a member is changed.

## Require SSO

With **Require SSO** on, people of your verified domains reach the organization's projects **only** when they signed in through your identity provider; signing in by emailed code or password is refused there, with the error `sso_required`. External collaborators — other domains — are not affected, and their own projects neither.

Remember that removing someone from your identity provider stops new sign-ins; to take away access to a project right away, also remove them from its members.

## Errors

| Code                            | Meaning                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ |
| `organization_pro_required`     | Put one of the organization's projects on Pro first.                     |
| `organization_admin_required`   | Only an admin of the organization can do this.                           |
| `project_owner_required`        | Only an owner of the project can move it into or out of an organization. |
| `sso_required`                  | Sign in again through your company's identity provider.                  |
| `organization_plan_unavailable` | The plans could not be checked right now; try again in a minute.         |
