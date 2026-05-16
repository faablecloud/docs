---
title: Deploy pricing
description: What each Faable plan includes for Faable Deploy — instance catalog, bandwidth allowance, egress overage rates, and per-tier behavior.
---

# Deploy pricing

Faable Deploy is part of the unified Faable subscription. The platform fee, support plans, and billing model are documented on the [Pricing](../platform/pricing.md) page — this page focuses on **what each tier includes for Deploy specifically**, plus the compute catalog and bandwidth pricing.

## What each plan includes for Deploy

| Plan         | Deploy entitlements |
|--------------|---------------------|
| **Hobby**    | 1 free `bi.xs` instance per account · catalog limited to `bi.xs` · apps run for **7 days and are then deleted** · 10 GB bandwidth |
| **Pro**      | Full instance catalog · apps run 24/7 (no auto-pause, no deletion) · custom domains per app · egress overage **0.24 €/GB** |
| **Business** | Everything in Pro · egress overage **0.18 €/GB** · 99.9 % uptime SLA |

## Compute catalog

Each deployed app is billed per month based on the instance size it requests. The `bi.xs` row is **free on Hobby** (1 per account); all other sizes require Pro or Business.

| Name         | Size            | Bandwidth | Price          |
|--------------|-----------------|-----------|----------------|
| `bi.xs`      | 0.5 CPU · 1 GB  | 10 GB     | Free on Hobby  |
| `bi.small`   | 1 CPU · 1.5 GB  | 50 GB     | 25 €           |
| `bi.base`    | 1 CPU · 3 GB    | 50 GB     | 40 €           |
| `bi.medium`  | 2 CPU · 3 GB    | 100 GB    | 50 €           |
| `bi.large`   | 2 CPU · 6 GB    | 100 GB    | 75 €           |
| `bi.xlarge`  | 4 CPU · 8 GB    | 1 TB      | 90 €           |
| `bi.2xlarge` | 6 CPU · 16 GB   | 1 TB      | 120 €          |

Instances are billed **per month**.

## Bandwidth

| Type    | Included                  | Overage                                          |
|---------|---------------------------|--------------------------------------------------|
| Ingress | Unlimited, free           | —                                                |
| Egress  | Per-instance allowance    | **0.24 €/GB** on Pro · **0.18 €/GB** on Business |

Egress overage is metered monthly across all of your instances, after the included bandwidth from each instance's catalog row is consumed.

## Related

- [Platform pricing](../platform/pricing.md) — tiers, platform fee, support plans, billing model.
- [Auth pricing](../auth/pricing.md) — MAU allowances and identity-feature gating.
