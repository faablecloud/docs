---
title: Pricing
description: Faable's unified pricing — one subscription covers Auth and Deploy. Three platform tiers (Free, Hobby, Pro) plus separately-purchased support plans.
---

# Pricing

Faable is sold as a **single subscription that covers every product** — both Faable Deploy (compute) and Faable Auth (identity). Pick the platform tier that matches the stage you're at, add a support plan if you need a guaranteed response time, and you're done.

The model is **hybrid**: a monthly **platform fee** that unlocks features and entitlements, plus **usage** for the resources you consume (compute instances, bandwidth overage, MAU above the included allowance). Each month you receive the bill for the **previous** month's usage.

Plans apply **per project**: each project has its own plan, starting on Free.

## Plans

| Plan      | Monthly fee  | What you get                                                                                                        |
| --------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Free**  | 0 €          | Try Faable end-to-end. 1 free instance, up to 3 deployments per day, Faable Auth included, community support.       |
| **Hobby** | 15 € + usage | Production-ready for a single product. Full instance catalog, unlimited deployments, custom domains, email support. |
| **Pro**   | 99 € + usage | Multi-account, enterprise SSO, audit logs, 99.9 % uptime SLA.                                                       |

The platform fee unlocks the tier; usage charges depend on what you actually deploy and how many users authenticate. The deep-dives below break down exactly what each plan includes per product.

## What's covered by your plan

The platform tier you choose maps to concrete entitlements in each product. See:

- **[Faable Auth pricing](../auth/pricing.md)** — MAU allowances, auth accounts, SSO/SAML, audit logs.
- **[Faable Deploy pricing](../deploy/pricing.md)** — compute instance catalog (`bi.xs` … `bi.2xlarge`), deployments per day, bandwidth allowance, egress overage rates.

## Support plans

Support plans are sold **separately** from the platform tiers — they are an independent purchase and are not included in Free, Hobby, or Pro.

| Plan       | Response time | Channel                                                      | Also includes                       | Price         |
| ---------- | ------------- | ------------------------------------------------------------ | ----------------------------------- | ------------- |
| Default    | —             | [Community](https://github.com/orgs/faablecloud/discussions) | —                                   | Free          |
| Starter    | < 6 hours     | Email                                                        | Customer Support                    | 350 €/month   |
| Enterprise | < 2 hours     | Email + Dedicated Slack channel                              | Technical Advisor, Customer Support | 1,000 €/month |

## Billing

- Billing cycle is **monthly, in arrears** — at the start of each month you receive the invoice for the previous month's usage.
- All prices are in **EUR** and shown **without taxes (VAT)** included.
- Payment methods are managed from your account's **Billing** settings in the dashboard; upgrades go through Stripe Checkout.
