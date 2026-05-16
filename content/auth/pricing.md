---
title: Auth pricing
description: What each Faable plan includes for Faable Auth — MAU allowances, auth accounts, passwordless caps, enterprise SSO, and per-feature gating.
---

# Auth pricing

Faable Auth is part of the unified Faable subscription. The platform fee, support plans, and billing model are documented on the [Pricing](../platform/pricing.md) page — this page focuses on **what each tier includes for Auth specifically**.

## What each plan includes for Auth

| Plan         | Auth entitlements |
|--------------|-------------------|
| **Hobby**    | 1 auth account · trial MAU allowance · passwordless **100 lifetime emails** · **1 Action** max · no Webhooks · no Custom Domain, MFA, SSO/SAML |
| **Pro**      | 1 auth account · **250 MAU** · unlimited passwordless within MAU · unlimited Actions · Webhooks · Custom Domain · MFA |
| **Business** | Everything in Pro · **unlimited auth accounts** · **10,000 MAU pooled** across accounts · Enterprise **SSO / SAML** · **Audit logs** |

## Monthly Active Users (MAU)

A **Monthly Active User** is any unique user who completes at least one successful login during a calendar month. The same user logging in from multiple devices in the same month counts once.

- **Pro** includes **250 MAU** on a single auth account.
- **Business** includes **10,000 MAU pooled** across every auth account on the subscription — useful when you run multiple products under one Faable plan.

If you expect to exceed your plan's MAU allowance, [contact us](https://github.com/orgs/faablecloud/discussions) before you do — overage is handled on a case-by-case basis at the time of writing.

## Feature gating

| Feature                                | Hobby                 | Pro            | Business       |
|----------------------------------------|:---------------------:|:--------------:|:--------------:|
| Social Login                           | ✅                    | ✅             | ✅             |
| Database (username/password) connection | ✅                    | ✅             | ✅             |
| Passwordless (OTP / Magic Link)        | ✅ (100 lifetime cap) | ✅             | ✅             |
| RBAC, Teams                            | ✅                    | ✅             | ✅             |
| Actions (PostLogin)                    | ✅ (**1 Action max**) | ✅ unlimited   | ✅ unlimited   |
| Webhooks                               | —                     | ✅             | ✅             |
| Custom Domain                          | —                     | ✅             | ✅             |
| MFA                                    | —                     | ✅             | ✅             |
| Enterprise SSO / SAML                  | —                     | —              | ✅             |
| Audit logs                             | —                     | —              | ✅             |
| Multiple auth accounts                 | —                     | —              | ✅             |

## Related

- [Platform pricing](../platform/pricing.md) — tiers, platform fee, support plans, billing model.
- [Deploy pricing](../deploy/pricing.md) — compute catalog and bandwidth.
- [Features overview](features.md) — what Faable Auth does, end-to-end.
