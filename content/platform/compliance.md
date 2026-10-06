---
title: Compliance
description: Faable's compliance scope — GDPR and EU data residency, the DPA, and the documentation, contractual terms and questionnaires for SOC 2, ISO 27001, NIS2, DORA, ENS and other frameworks, included in the Pro plan.
rank: low
---

# Compliance

**Last updated:** 6 October 2026

This page lists the frameworks your procurement may ask about and what Faable provides for each. The technical controls behind it — where your data runs, tenant isolation, encryption, backups, change management — are described in [Security](security-compliance.md).

## Compliance scope

**Compliance support is included in the [Pro plan](pricing.mdx) at no extra cost.** For every framework marked **Included in Pro**, we provide what your procurement needs for it: our security documentation, completed questionnaires, the contractual terms the framework requires of a supplier, and direct answers to architecture questions. Write to [support@faable.com](mailto:support@faable.com) from your Pro project and tell us what you need.

Included in Pro describes what we give you, not a certificate we hold: where a framework is a certification (SOC 2, ISO 27001, ENS, BSI C5, SecNumCloud, EUCS), Faable is not certified under it today, and the documentation we provide says where it stands.

| Framework / assurance        | Status                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| GDPR (EU processor, DPA)     | ✅ Compliant, all plans — [details below](#gdpr)                                                                           |
| EU data residency            | ✅ All workloads and identities stay in Europe — [where your data runs](security-compliance.md#where-your-data-runs)       |
| Data Processing Agreement    | ✅ All plans — [section 10 of the Privacy Policy](privacy-policy.md#10-data-you-process-through-faable-our-processor-role) |
| PCI DSS (card payments)      | ✅ Out of scope: card data goes to a PCI DSS Level 1 provider, never to Faable — [details below](#payment-card-data)       |
| Uptime commitment            | ✅ Pro — [99.9 % SLA with service credits](sla.md)                                                                         |
| Security questionnaires      | ✅ Included in Pro                                                                                                         |
| SOC 2                        | Included in Pro                                                                                                            |
| ISO 27001                    | Included in Pro                                                                                                            |
| HIPAA (BAA)                  | Included in Pro                                                                                                            |
| Third-party penetration test | Included in Pro                                                                                                            |

### European frameworks

| Framework                                     | Status                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NIS2 Directive (EU 2022/2555)                 | No certificate exists under NIS2. Supplier security clauses for customers in scope — included in Pro                                                                                                                                                                                                                     |
| DORA (EU 2022/2554), for financial entities   | ICT third-party contractual terms (Art. 30) — included in Pro                                                                                                                                                                                                                                                            |
| EU Data Act (EU 2023/2854), cloud switching   | Your data can leave on every plan: users with their password hashes ([export](../auth/guides/import-password-hashes.mdx#export)), apps from your own Git repository. Contract terms — included in Pro                                                                                                                    |
| Digital Omnibus (EU proposal)                 | Not in force: its data part (changes to GDPR, ePrivacy, NIS2 and DORA) is [still being negotiated](https://www.europarl.europa.eu/legislative-train/theme-a-new-plan-for-europe-s-sustainable-prosperity-and-competitiveness/file-digital-package). We will adapt when it is adopted; nothing on this page depends on it |
| EUCS (EU Cloud Services certification scheme) | Included in Pro                                                                                                                                                                                                                                                                                                          |

### National schemes

| Scheme                                                   | Status          |
| -------------------------------------------------------- | --------------- |
| ENS — Esquema Nacional de Seguridad (Spain, RD 311/2022) | Included in Pro |
| BSI C5 (Germany)                                         | Included in Pro |
| SecNumCloud (France)                                     | Included in Pro |

## GDPR

Faable is built for GDPR compliance rather than retrofitted to it: European company, European infrastructure, European supervisory authority. Concretely, we:

- process customer data as a **processor** on your documented instructions, under the DPA in [section 10 of the Privacy Policy](privacy-policy.md#10-data-you-process-through-faable-our-processor-role);
- publish a [sub-processor list](privacy-policy.md#7-sub-processors) and the safeguards for any transfer outside the EEA;
- notify you **without undue delay** of a personal data breach affecting your data;
- assist you with access, erasure, and portability requests from your own users;
- apply the technical and organisational measures described in [Security](security-compliance.md).

This applies on every plan, Free included.

## Payment card data

**We never see or store your card details.** Payments run through the hosted checkout of a PCI DSS Level 1 certified payment provider; card data goes directly to them.

## What we can show today

European infrastructure under our control, tenant isolation, GitOps-audited change management, managed edge filtering, encrypted backups, and a GDPR posture we can document — all described in [Security](security-compliance.md). On Pro we also complete your security questionnaire, sign the contractual terms your framework requires, and answer architecture questions directly.

## Related

- [Security](security-compliance.md) — the technical controls behind this page
- [Service Level Agreement](sla.md) — the Pro uptime commitment and service credits
- [Privacy Policy](privacy-policy.md) — what we collect, why, and the DPA
- [Pricing](pricing.mdx) — what each plan includes
