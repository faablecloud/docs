---
title: Security and Compliance
description: How Faable Cloud protects your applications and data — European infrastructure, tenant isolation, edge filtering, encryption, backups, and our honest compliance posture.
---

# Security and Compliance

**Last updated:** 13 August 2026

This page describes the security controls that are actually in place on the Faable platform, and states plainly which certifications we do and do not hold. If something here is not precise enough for your procurement process, write to [support@faable.com](mailto:support@faable.com) and we will answer specifics.

## Where your data runs

Faable runs on **our own hardware in a European datacenter (Poland)**. This is not a US platform with an optional EU region: there is no non-EU region to fall back to, and your workloads and user identities do not leave Europe.

| Component                                    | Location                                   |
| -------------------------------------------- | ------------------------------------------ |
| Your applications (compute, runtime)         | Our European datacenter                    |
| Faable Auth identities and user data         | Our European datacenter                    |
| Platform databases                           | European region, managed database provider |
| Container registry, build artifacts, backups | AWS `eu-west-3` (Paris)                    |
| Product analytics                            | PostHog EU Cloud                           |

Third-party services that handle limited operational data — transactional email, error monitoring, payments — are listed in the [Privacy Policy](privacy-policy.md#7-sub-processors), together with the transfer mechanism that applies to each.

## Tenant isolation

**Customer workloads and the Faable control plane run on separate Kubernetes clusters.** The cluster that serves your applications does not host the platform's own APIs, databases, or credentials — so a compromised workload does not sit next to the control plane.

Within the workload cluster:

- Each application runs in its **own pod with its own identity, network configuration, and domains**.
- Environment variables and secrets are **scoped to the app that owns them**; access through the API is bound to the same authorization as access to the app itself.
- Production and staging environments run in **separate namespaces** with separate credentials.

## Traffic protection

**TLS everywhere.** Every custom domain and every `*.faable.link` deployment gets a certificate automatically, issued and renewed by the platform. Traffic is served over HTTPS with modern cipher suites; plain HTTP is redirected.

**Managed request filtering at the edge.** Faable operates a managed [Web Application Firewall](../deploy/security-waf.md) in front of every application, on every plan. Rules are maintained by us as a set of **profiles** applied fleet-wide, so protection improves for all apps without you changing anything:

| Profile         | Applies to        | Blocks                                                                                                                                                                     |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sensitive paths | Every app         | `.git/`, `.env`, `.aws/`, `.ssh/`, `.npmrc`, `.netrc`, Terraform state, source maps, `/actuator`, `/phpmyadmin`, installer leftovers, and similar credential-hunting paths |
| Scanner traffic | Node applications | `*.php`, `/wp-*`, `/xmlrpc`, WordPress and IIS bait probes                                                                                                                 |

Matching requests are rejected with `403` **at the edge, before they reach your application** — so they do not consume your compute, do not keep a scaled-to-zero app awake, and do not appear as load in your app. Per-app rules can be added or relaxed on request; see the [WAF documentation](../deploy/security-waf.md) for how to read WAF events and tune false positives.

**Traffic visibility.** Every HTTP request to your apps is recorded with its host, status, and timing, which is what drives usage metering and lets us spot abusive traffic patterns per app.

## Encryption

- **In transit:** HTTPS/TLS between clients and the platform, and for connections between the platform and its databases and object storage.
- **At rest:** platform databases and object storage are encrypted at rest by the underlying storage providers. Backup buckets use server-side encryption.

## Backups and recovery

| What               | Frequency           | Retention | Where                                 |
| ------------------ | ------------------- | --------- | ------------------------------------- |
| Platform databases | Hourly              | 30 days   | Encrypted object storage, `eu-west-3` |
| Persistent volumes | Scheduled snapshots | Rolling   | Encrypted object storage, `eu-west-3` |

Backups are compressed, encrypted in transit, and stored in a separate account from the running cluster, so losing the cluster does not lose the backups.

**Backups protect the platform, not your archival strategy.** They exist so we can restore Faable after an infrastructure failure. If your application holds data you cannot afford to lose, keep your own exports — this is also what the [Terms of Service](terms-of-service.md#9-warranties-and-disclaimers) say.

## Change management and internal access

- **All infrastructure is GitOps-managed.** Cluster state is declared in Git and reconciled automatically. Every infrastructure change is a reviewable, revertible commit with an author and a timestamp — there is no untracked manual change in production.
- **Internal platform configuration is admin-only.** Security-relevant resources such as WAF profiles are restricted to platform administrators and service accounts; tenant tokens receive `403` on both read and write.
- **Least privilege internally.** Staff access is limited to what a role requires, and access to customer data happens only to provide support you requested, to investigate a security incident, or where the law requires it.
- **Automated tests gate deployments.** Changes to the platform go through automated test suites in CI before release.

## Product security features

| Feature                                                     | Where                                                | Available on |
| ----------------------------------------------------------- | ---------------------------------------------------- | ------------ |
| OAuth 2.0 / OIDC standard flows, RS256-signed tokens        | [Faable Auth](../auth/get-started.md)                | All plans    |
| Email verification, password policies, passwordless sign-in | Faable Auth                                          | All plans    |
| Authentication and delivery event logs                      | [Auth logs](../auth/logs.md)                         | All plans    |
| Audit logs                                                  | Faable Auth                                          | Pro          |
| Managed WAF                                                 | [Faable Deploy](../deploy/security-waf.md)           | All plans    |
| Automatic TLS certificates on custom domains                | [Custom domains](../deploy/domains/custom-domain.md) | All plans    |
| Per-app secrets, injected at runtime                        | Faable Deploy                                        | All plans    |

## Compliance

### GDPR

Faable is built for GDPR compliance rather than retrofitted to it: European company, European infrastructure, European supervisory authority. Concretely, we:

- process customer data as a **processor** on your documented instructions, under the DPA in [section 10 of the Privacy Policy](privacy-policy.md#10-data-you-process-through-faable-our-processor-role);
- publish a [sub-processor list](privacy-policy.md#7-sub-processors) and the safeguards for any transfer outside the EEA;
- notify you **without undue delay** of a personal data breach affecting your data;
- assist you with access, erasure, and portability requests from your own users;
- apply the technical and organisational measures described on this page.

### Payment card data

**We never see or store your card details.** Payments run through the hosted checkout of a PCI DSS Level 1 certified payment provider; card data goes directly to them.

### Certifications we do _not_ hold

We would rather lose a deal than claim an audit we have not passed.

**Faable is not currently SOC 2 or ISO 27001 certified**, and we have not completed a third-party penetration test. What we have is described on this page: European infrastructure under our control, tenant isolation, GitOps-audited change management, managed edge filtering, encrypted backups, and a GDPR posture we can document.

If your procurement requires a formal certification, tell us at [support@faable.com](mailto:support@faable.com) — knowing which customers are blocked by it is how it gets prioritised. In the meantime we are happy to complete a security questionnaire, sign a DPA, and answer architecture questions directly.

## Reporting a vulnerability

If you find a security issue in the platform, report it to [support@faable.com](mailto:support@faable.com) with enough detail to reproduce it. We will acknowledge it, keep you informed while we fix it, and credit you if you want. Please do not run intrusive tests against production or against other customers' applications — ask us first and we will find a way to test safely.

We do not currently run a paid bug bounty programme.

## Incident response

If an incident affects the confidentiality, integrity, or availability of your data, we investigate, contain, and notify affected customers without undue delay, with what we know, what we are doing, and what you need to do. Personal data breaches are reported to the supervisory authority within the deadlines set by the GDPR.

## Related

- [Privacy Policy](privacy-policy.md) — what we collect, why, and for how long
- [Terms of Service](terms-of-service.md) — acceptable use, liability, termination
- [Web Application Firewall](../deploy/security-waf.md) — how edge filtering works and how to tune it
