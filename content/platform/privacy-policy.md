---
title: Privacy Policy
description: How Faable Cloud collects, uses, stores, and protects personal data. Controller and processor roles, legal bases, retention periods, sub-processors, international transfers, and your GDPR rights.
---

# Privacy Policy

**Last updated:** 13 August 2026

This Privacy Policy explains how **Faable Cloud SLU** ("Faable", "we", "us") handles personal data when you visit our websites, create a Faable account, and use Faable Deploy and Faable Auth (together, the "Services").

We are a European company running European infrastructure. Your applications and the identities your applications manage are stored in European datacenters and governed by the EU General Data Protection Regulation (GDPR) and Spanish data protection law (LOPDGDD).

## 1. Who we are

| Role                      | Details                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| **Controller**            | Faable Cloud SLU                                                             |
| **Privacy contact**       | [privacy@faable.com](mailto:privacy@faable.com)                              |
| **General contact**       | [support@faable.com](mailto:support@faable.com)                              |
| **Supervisory authority** | Agencia Española de Protección de Datos ([www.aepd.es](https://www.aepd.es)) |

## 2. Two different roles: controller and processor

This is the most important distinction in this document, because Faable handles two very different kinds of personal data.

**We are the _controller_ of your relationship with us.** When you sign up, pay for a plan, open a support ticket, or browse our websites, we decide why and how that data is processed. Sections 3 to 9 describe this.

**We are a _processor_ for the data your application puts into the platform.** The end users who log in through Faable Auth, and the personal data your deployed app stores or transmits, belong to **you**. You are the controller; we process that data only on your documented instructions, to run the Services you asked us to run. Section 10 describes this.

## 3. What we collect and why

| Data                                | Examples                                                                                                              | Purpose                                                                                             | Legal basis                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Account data**                    | Email address, name, profile picture, identifiers from the identity provider you signed in with (e.g. GitHub, Google) | Create and authenticate your account, associate you with a team                                     | Contract                                                             |
| **Team and project data**           | Team name, membership and roles, invitations, project and app names                                                   | Operate multi-user workspaces and access control                                                    | Contract                                                             |
| **Billing data**                    | Billing name, billing address, VAT/tax ID, plan, invoices, payment status                                             | Charge for the Services, issue invoices, comply with tax and accounting law                         | Contract; legal obligation                                           |
| **Source-control integration data** | Repository and organization metadata, branch and commit references, commit author name and email, webhook events      | Build and deploy your app when you push, attribute deployments                                      | Contract                                                             |
| **Operational data**                | Build and deployment logs, runtime and platform logs, resource metrics, request metadata, IP addresses                | Run the platform, show you why a build failed, measure usage for billing, keep the service reliable | Contract; legitimate interest in operating and securing the platform |
| **Security data**                   | Authentication events, session data, IP address, user agent, rate-limit and abuse signals                             | Detect and prevent fraud, abuse, credential stuffing, and platform misuse                           | Legitimate interest; legal obligation                                |
| **Support data**                    | Emails, ticket contents, and anything you choose to send us                                                           | Answer you and resolve incidents                                                                    | Contract; legitimate interest                                        |
| **Product analytics**               | Pages viewed, features used, pseudonymous device/session identifier                                                   | Understand which parts of the product and documentation work                                        | Consent (see [Cookies](#12-cookies-and-similar-technologies))        |
| **Marketing analytics**             | Campaign source, landing page, conversion events on our public websites                                               | Measure which acquisition channels bring people to Faable                                           | Consent                                                              |

**We never receive your full card number.** Payments run through our payment provider's hosted checkout; card data goes directly to them and never touches Faable's systems (see [Security & Compliance](security-compliance.md)).

## 4. What we do _not_ do

- We do **not** sell personal data.
- We do **not** use your application's content, your source code, or your end users' data to train machine learning models.
- We do **not** use your end users' data for our own marketing.
- We do **not** access your account's private data except when it is strictly necessary to provide support you requested, to investigate a security incident, or when the law requires it — and such access is logged.

## 5. Where the data lives

Application workloads and identity data run on **infrastructure located in the European Union**. Backups are stored in Europe as well.

A limited number of support vendors listed in section 7 are established outside the EEA. Where a transfer to a third country happens, it is covered by an adequacy decision, by the EU Standard Contractual Clauses, or by both, together with the supplementary measures required by the GDPR. You can request a copy of the transfer mechanism for a specific vendor at [privacy@faable.com](mailto:privacy@faable.com).

## 6. How long we keep it

| Data                                                        | Retention                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Account and team data                                       | For as long as your account is active, then deleted or anonymised within **30 days** of account closure |
| Customer content (apps, deployments, artifacts, Auth users) | Deleted within **30 days** of account closure or on your request — see section 10                       |
| Invoices and accounting records                             | **6 years**, as required by Spanish commercial and tax law                                              |
| Build and deployment logs                                   | Up to **90 days**                                                                                       |
| Platform and security logs                                  | Up to **12 months** where needed to investigate abuse and security incidents                            |
| Backups                                                     | **30 days** rolling, after which they expire automatically                                              |
| Support correspondence                                      | **3 years** from the last message                                                                       |
| Analytics data                                              | Up to **12 months** at event level                                                                      |

When a retention period ends, data is deleted or irreversibly anonymised. Deletion from live systems is immediate; residual copies in backups disappear as those backups expire.

## 7. Sub-processors

We use a small set of specialised providers. Each is bound by a data processing agreement holding them to the same obligations we accept towards you.

| Provider                    | Purpose                                                                   | Data involved                                                         | Location |
| --------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| **Amazon Web Services**     | Container registry and build artifact storage                             | Build outputs, container images                                       | EU       |
| **PostHog (EU Cloud)**      | Product analytics on our websites and dashboard                           | Pseudonymous usage events                                             | EU       |
| **Sentry**                  | Error and performance monitoring                                          | Stack traces, request metadata, account identifier                    | EU/US    |
| **Postmark**                | Transactional email (verification, invitations, deployment notifications) | Email address, message content                                        | US       |
| **Stripe**                  | Payment processing and invoicing                                          | Billing details, payment method (card data held by Stripe, not by us) | EU/US    |
| **GitHub**                  | Source-control integration and deployment triggers                        | Repository metadata, commit and webhook data                          | US       |
| **Google (Analytics, Ads)** | Marketing measurement on our public websites only                         | Pseudonymous website analytics, conversion events                     | EU/US    |

We will update this table before adding a new sub-processor that handles personal data. Write to [privacy@faable.com](mailto:privacy@faable.com) if you want to be notified of changes.

## 8. Who else may receive data

- **Public authorities**, where a valid legal obligation applies. We assess every request, resist those that are overbroad, and notify you unless legally forbidden.
- **Professional advisors** — auditors, tax advisors, and lawyers, under confidentiality.
- **An acquirer**, in the event of a merger, acquisition, or asset sale, subject to this Policy continuing to apply.

## 9. Your rights

Under the GDPR you can ask us to:

- **Access** the personal data we hold about you and get a copy of it.
- **Rectify** data that is inaccurate or incomplete.
- **Erase** your data ("right to be forgotten"), where no legal obligation requires us to keep it.
- **Restrict** or **object to** processing based on our legitimate interests.
- **Port** your data to another provider in a structured, machine-readable format.
- **Withdraw consent** at any time, without affecting processing already carried out.

Write to [privacy@faable.com](mailto:privacy@faable.com) from the email address associated with your account, stating which right you wish to exercise. **We will not ask you for a copy of your ID document as a matter of course** — we verify your identity through your account. Only if we have reasonable doubt about who is making the request will we ask for additional proof, and we will ask for the least intrusive proof that resolves the doubt.

We respond within **one month**. If the request is complex we may extend that by two further months and will tell you why within the first month.

If you believe we have handled your data incorrectly, you can complain to the **Agencia Española de Protección de Datos** ([www.aepd.es](https://www.aepd.es)) or to the supervisory authority of your country of residence. We would appreciate the chance to resolve it first.

## 10. Data you process through Faable (our processor role)

When you use Faable Auth to authenticate your own users, or deploy an application that handles personal data, **you are the controller and Faable is your processor**.

**Scope of our processing.** We process that data only to provide the Services: storing and authenticating your end users, running your workloads, delivering the emails you configure, and keeping the platform secure and available.

**What Faable Auth stores about your end users.** Typically an email address, a hashed password where you use database connections, profile attributes returned by the identity provider, verification state, and authentication events. What exactly is stored depends on the connections and the user metadata you configure.

**Our commitments as processor:**

- We act only on your documented instructions, including for international transfers.
- Our staff are bound by confidentiality.
- We apply the technical and organisational measures described in [Security & Compliance](security-compliance.md).
- We use only the sub-processors listed in section 7, under equivalent contractual obligations.
- We assist you with end-user rights requests, with data protection impact assessments, and with breach notifications.
- We notify you **without undue delay** after becoming aware of a personal data breach affecting your data.
- On termination, we delete your data within the periods in section 6, or return it, at your choice.

**Data Processing Agreement.** The commitments above form our DPA and are incorporated into the [Terms of Service](terms-of-service.md). If your organisation requires a countersigned DPA, request one at [privacy@faable.com](mailto:privacy@faable.com).

**Your responsibility.** You are responsible for having a legal basis for the data you push into the platform, for informing your own users, and for not storing categories of data your application is not equipped to handle.

## 11. Security

We run European infrastructure under our own control, keep customer workloads on a separate cluster from the platform control plane, encrypt data in transit and at rest, take hourly database backups retained for 30 days in encrypted European storage, filter hostile traffic at the edge, and apply least-privilege access controls internally. The full description — including the certifications we do **not** hold — is in [Security & Compliance](security-compliance.md).

No system is perfectly secure. If you discover a vulnerability, report it to [support@faable.com](mailto:support@faable.com) and we will work with you on it.

## 12. Cookies and similar technologies

| Category               | What it does                                                                                  | Consent needed |
| ---------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| **Strictly necessary** | Keeps you signed in, protects against CSRF, remembers your last sign-in method, balances load | No             |
| **Preferences**        | Remembers choices such as theme and locale                                                    | No             |
| **Analytics**          | Measures product and documentation usage through PostHog                                      | Yes            |
| **Marketing**          | Measures advertising campaigns on our public marketing pages                                  | Yes            |

Analytics and marketing cookies are only set after you consent, and you can change or withdraw that choice at any time through the cookie settings on our websites or your browser. Withdrawing consent does not affect strictly necessary cookies, without which the Services cannot function.

Cookies set inside **your own deployed application** are yours, not ours — you are responsible for disclosing them to your users.

## 13. Children

The Services are intended for professional use and are not directed at children. You must be at least **18 years old** to create a Faable account. If we learn that we hold data of a minor without a valid legal basis, we delete it.

## 14. Changes to this Policy

We may update this Policy as the Services evolve. Material changes will be announced by email or in the dashboard at least **30 days** before they take effect. The date at the top always reflects the current version.

## 15. Contact

Questions about this Policy, or about how your data is handled:
**[privacy@faable.com](mailto:privacy@faable.com)**

See also: [Terms of Service](terms-of-service.md) · [Security & Compliance](security-compliance.md)
