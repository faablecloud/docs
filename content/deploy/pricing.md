---
title: Deploy pricing
description: What each Faable plan includes for Faable Deploy — instance catalog, deployments per day, build artifact size limits, bandwidth allowance, egress overage rates, and per-tier behavior.
---

# Deploy pricing

Faable Deploy is part of the unified Faable subscription. The platform fee and billing model are documented on the [Pricing](../platform/pricing.md) page — this page focuses on **what each tier includes for Deploy specifically**, plus the compute catalog and bandwidth pricing.

## What each plan includes for Deploy

| Plan      | Deploy entitlements                                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free**  | 1 free `bi.xs` instance per project · catalog limited to `bi.xs` · **up to 10 successful deployments per day per project** (resets at 00:00 UTC) · **build artifacts up to 512 MB** · 10 GB bandwidth |
| **Hobby** | Full instance catalog · **unlimited deployments** · **build artifacts up to 2 GB** · apps run 24/7 · custom domains per app · egress overage **0.24 €/GB**                                            |
| **Pro**   | Everything in Hobby · egress overage **0.18 €/GB** · 99.9 % uptime SLA                                                                                                                                |

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

On the Free plan each project can promote up to **10 successful deployments per calendar day (UTC)**. Once the quota is spent, nothing is dropped: the build still runs to completion and the deployment waits, ready to roll out. It goes live automatically at 00:00 UTC when the counter resets, or immediately if you upgrade. Hobby and Pro have no deployment limits.

> [!TIP]
> **Only successful deployments count.** A build that fails never touches the quota, so iterating on a broken build can't lock you out for the rest of the day.

## Build artifact size

When Faable builds your app it produces a **build artifact** — a compressed archive holding your application plus its installed dependencies — and your instances boot from it. The size of that archive is capped per plan:

| Plan      | Maximum build artifact |
| --------- | ---------------------- |
| **Free**  | 512 MB                 |
| **Hobby** | 2 GB                   |
| **Pro**   | 2 GB                   |

If a build produces something larger, the deploy stops with an `artifact_too_large` error naming the size it reached and the limit it passed. The build itself is not charged against your [daily deployment quota](#deployments-per-day-free-plan).

Most apps are far below these numbers — a typical Node or Python service lands in the tens of megabytes. Artifacts get large when something ships inside the repository that does not need to: bundled media and datasets, checked-in build caches, or development dependencies installed in the production image. Trimming those is usually enough to get back under the limit; if your app genuinely needs more, upgrade the plan.

> [!NOTE]
> 2 GB is also the platform maximum, so it is the ceiling on every plan. Builds above it are not supported on the artifact runtime.

## Bandwidth

| Type    | Included               | Overage                                       |
| ------- | ---------------------- | --------------------------------------------- |
| Ingress | Unlimited, free        | —                                             |
| Egress  | Per-instance allowance | **0.24 €/GB** on Hobby · **0.18 €/GB** on Pro |

Egress overage is metered monthly across all of your instances, after the included bandwidth from each instance's catalog row is consumed.

## Related

- [Platform pricing](../platform/pricing.md) — tiers, platform fee, billing model.
- [Auth pricing](../auth/pricing.md) — MAU allowances and identity-feature gating.
