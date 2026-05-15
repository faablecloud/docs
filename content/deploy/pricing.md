---
title: Pricing
description: Transparent pricing for Faable Deploy. Hybrid model with a monthly platform fee, per-instance compute catalog, and metered bandwidth.
---

# Pricing

Faable Deploy uses a hybrid pricing model: a monthly **platform fee** that unlocks features and entitlements, plus **usage** for the compute instances you run and any bandwidth overage. In any given month you receive the bill for the previous month of use, not the current one.

## Plans

| Plan         | Monthly fee     | Includes                                                                                                                                                                                                                |
| ------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hobby**    | 0 €             | 1 free `bi.xs` instance (1 per account) · apps run for **7 days and are then deleted** · 10 GB bandwidth · Community support · catalog limited to `bi.xs`                                                                |
| **Pro**      | 15 € + usage    | Full compute catalog (25 €–120 €/app/month) · apps run 24/7 (no auto-pause or deletion) · 1 auth account, **250 MAU** · custom domains · email support · egress overage **0.24 €/GB**                                   |
| **Business** | 99 € + usage    | Everything in Pro · SSO + audit logs · unlimited auth accounts, **10,000 MAU total** (pooled across accounts, not per-account) · egress overage **0.18 €/GB** · 99.9% SLA                                               |

## Compute catalog

Each deployed app is billed per month based on the instance size it requests. The `bi.xs` row is **free on Hobby** (1 per account); all other sizes require Pro or Business.

| Name         | Size            | Bandwidth | Price               |
| ------------ | --------------- | --------- | ------------------- |
| `bi.xs`      | 0.5 CPU · 1 GB  | 10 GB     | Free on Hobby       |
| `bi.small`   | 1 CPU · 1.5 GB  | 50 GB     | 25 €                |
| `bi.base`    | 1 CPU · 3 GB    | 50 GB     | 40 €                |
| `bi.medium`  | 2 CPU · 3 GB    | 100 GB    | 50 €                |
| `bi.large`   | 2 CPU · 6 GB    | 100 GB    | 75 €                |
| `bi.xlarge`  | 4 CPU · 8 GB    | 1 TB      | 90 €                |
| `bi.2xlarge` | 6 CPU · 16 GB   | 1 TB      | 120 €               |

Instances are billed **per month**.

## Bandwidth

| Type    | Included                  | Overage                                       |
| ------- | ------------------------- | --------------------------------------------- |
| Ingress | Unlimited, free           | —                                             |
| Egress  | Per-instance allowance    | **0.24 €/GB** on Pro · **0.18 €/GB** on Business |

Egress overage is metered monthly across all of your instances, after the included bandwidth from each instance's catalog row is consumed.

## Support plans

Support plans are sold **separately** from the platform tiers — they are an independent purchase and are not included in Hobby, Pro, or Business.

| Plan         | Response Time | Support channel                                              | Also includes                       | Price          |
| ------------ | ------------- | ------------------------------------------------------------ | ----------------------------------- | -------------- |
| Default      | —             | [Community](https://github.com/orgs/faablecloud/discussions) | —                                   | Free           |
| Starter      | < 6 hours     | Email                                                        | Customer Support                    | 350 €/month    |
| Enterprise   | < 2 hours     | Email + Dedicated Support via Slack                          | Technical Advisor, Customer Support | 1,000 €/month  |

---

All prices are in EUR and shown without taxes (VAT) included.
