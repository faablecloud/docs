---
title: Deploy pricing
description: What each Faable plan includes for Faable Deploy — instance catalog, deployments per day, bandwidth allowance, egress overage rates, and per-tier behavior.
---

# Deploy pricing

Faable Deploy is part of the unified Faable subscription. The platform fee, support plans, and billing model are documented on the [Pricing](../platform/pricing.md) page — this page focuses on **what each tier includes for Deploy specifically**, plus the compute catalog and bandwidth pricing.

## What each plan includes for Deploy

| Plan      | Deploy entitlements                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Free**  | 1 free `bi.xs` instance per project · catalog limited to `bi.xs` · **up to 3 deployments per day per project** (resets at 00:00 UTC) · 10 GB bandwidth |
| **Hobby** | Full instance catalog · **unlimited deployments** · apps run 24/7 · custom domains per app · egress overage **0.24 €/GB**                              |
| **Pro**   | Everything in Hobby · egress overage **0.18 €/GB** · 99.9 % uptime SLA                                                                                 |

## Compute catalog

Each deployed app is billed per month based on the instance size it requests. The `bi.xs` row is **free on the Free plan** (1 per project); all other sizes require Hobby or Pro.

| Name         | Size           | Bandwidth | Price     |
| ------------ | -------------- | --------- | --------- |
| `bi.xs`      | 0.5 CPU · 1 GB | 10 GB     | Free plan |
| `bi.small`   | 1 CPU · 1.5 GB | 50 GB     | 25 €      |
| `bi.base`    | 1 CPU · 3 GB   | 50 GB     | 40 €      |
| `bi.medium`  | 2 CPU · 3 GB   | 100 GB    | 50 €      |
| `bi.large`   | 2 CPU · 6 GB   | 100 GB    | 75 €      |
| `bi.xlarge`  | 4 CPU · 8 GB   | 1 TB      | 90 €      |
| `bi.2xlarge` | 6 CPU · 16 GB  | 1 TB      | 120 €     |

Instances are billed **per month**.

## Deployments per day (Free plan)

On the Free plan each project can create up to **3 deployments per calendar day (UTC)**. The 4th deploy of the day is rejected with a clear error from the CLI and dashboard; the counter resets at 00:00 UTC. Hobby and Pro have no deployment limits.

## Bandwidth

| Type    | Included               | Overage                                       |
| ------- | ---------------------- | --------------------------------------------- |
| Ingress | Unlimited, free        | —                                             |
| Egress  | Per-instance allowance | **0.24 €/GB** on Hobby · **0.18 €/GB** on Pro |

Egress overage is metered monthly across all of your instances, after the included bandwidth from each instance's catalog row is consumed.

## Related

- [Platform pricing](../platform/pricing.md) — tiers, platform fee, support plans, billing model.
- [Auth pricing](../auth/pricing.md) — MAU allowances and identity-feature gating.
