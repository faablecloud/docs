---
title: Auth pricing
description: What each Faable plan includes for Faable Auth — MAU allowances, auth accounts, enterprise SSO, and per-feature gating.
---

# Auth pricing

Faable Auth is part of the unified Faable subscription — and it is **included in every plan, starting on Free**. The platform fee, support plans, and billing model are documented on the [Pricing](../platform/pricing.md) page; this page focuses on **what each tier includes for Auth specifically**.

## What each plan includes for Auth

| Plan      | Auth entitlements |
|-----------|-------------------|
| **Free**  | Faable Auth included · 1 auth account · fair-use MAU allowance · passwordless, social login, RBAC · 1 Action |
| **Hobby** | 1 auth account · **250 MAU** · unlimited passwordless within MAU · unlimited Actions · Webhooks · Custom Domain · MFA |
| **Pro**   | Everything in Hobby · **unlimited auth accounts** · **10,000 MAU pooled** across accounts · Enterprise **SSO / SAML** · **Audit logs** |

## Monthly Active Users (MAU)

A **Monthly Active User** is any unique user who completes at least one successful login during a calendar month. The same user logging in from multiple devices in the same month counts once.

- **Free** includes a fair-use MAU allowance while you build. If your project takes off, we'll reach out before applying any limit.
- **Hobby** includes **250 MAU** on a single auth account.
- **Pro** includes **10,000 MAU pooled** across every auth account on the subscription — useful when you run multiple products under one Faable plan.

If you expect to exceed your plan's MAU allowance, [contact us](https://github.com/orgs/faablecloud/discussions) before you do — overage is handled on a case-by-case basis at the time of writing.

## Feature gating

| Feature                                  | Free | Hobby        | Pro          |
|------------------------------------------|:----:|:------------:|:------------:|
| Social Login                             | ✅   | ✅           | ✅           |
| Database (username/password) connection  | ✅   | ✅           | ✅           |
| Passwordless (OTP / Magic Link)          | ✅   | ✅           | ✅           |
| RBAC, Teams                              | ✅   | ✅           | ✅           |
| Actions (PostLogin)                      | ✅ (1 Action max) | ✅ unlimited | ✅ unlimited |
| Webhooks                                 | —    | ✅           | ✅           |
| Custom Domain                            | —    | ✅           | ✅           |
| MFA                                      | —    | ✅           | ✅           |
| Enterprise SSO / SAML                    | —    | —            | ✅           |
| Audit logs                               | —    | —            | ✅           |
| Multiple auth accounts                   | —    | —            | ✅           |

## Related

- [Platform pricing](../platform/pricing.md) — tiers, platform fee, support plans, billing model.
- [Deploy pricing](../deploy/pricing.md) — compute catalog, deployments per day, and bandwidth.
- [Features overview](features.md) — what Faable Auth does, end-to-end.
