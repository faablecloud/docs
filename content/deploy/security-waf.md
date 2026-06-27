---
title: Web Application Firewall (WAF)
description: Protect your applications with Faable's built-in Web Application Firewall (WAF). Detect and block malicious traffic using OWASP Core Rule Set policies, run in monitor or block mode, read WAF logs, and tune false positives.
---

# Web Application Firewall

**A Web Application Firewall (WAF) inspects incoming HTTP traffic and blocks malicious requests — such as SQL injection, cross-site scripting (XSS), and other OWASP Top 10 attacks — before they reach your app.** It sits between the internet and your service: every request must pass the WAF policy before Faable routes it to your application. Faable Deploy includes a managed WAF powered by the [OWASP Core Rule Set (CRS)](https://owasp.org/www-project-modsecurity-core-rule-set/), kept up to date by the platform.

## How Faable's WAF works

Faable's WAF analyzes each HTTP request (method, headers, query string, body) against a **policy** — a collection of rules — and decides whether to allow, log, or block it. The default policy is the **OWASP Core Rule Set**, which protects against the OWASP Top 10: injection, XSS, path traversal, remote file inclusion, protocol violations, and more. Faable reviews and updates the rule set as new vulnerabilities and CRS releases appear, so your protection stays current without action from you.

To enable the WAF on your app, contact the team at [sales@faable.com](mailto:sales@faable.com); the policy is deployed alongside your Faable App in our European datacenters.

## Monitor mode vs block mode

A WAF policy can run in two modes:

- **Monitor (detection only):** suspicious requests are **logged but still served**. Use this when first enabling the WAF to observe what *would* be blocked without affecting real users.
- **Block (prevention):** matching requests are **logged and rejected** (typically `403 Forbidden`) before reaching your app.

The recommended rollout is: enable in **monitor mode**, review the logs for a representative period (including peak traffic and any batch/integration jobs), tune any false positives, then switch to **block mode**.

## Reading WAF logs

WAF events are available in the [Faable Dashboard](https://dashboard.faable.com). Each event records the matched rule(s), the request attributes that triggered it, the client IP, and the action taken (logged vs blocked). Use these logs to:

- Confirm real attacks are being stopped.
- Identify **false positives** — legitimate requests that match a rule (common with rich form payloads, file uploads, or API clients sending unusual headers).
- Spot traffic patterns worth rate-limiting upstream.

## Tuning false positives

The OWASP CRS is intentionally strict, so some legitimate traffic can match a rule. To reduce false positives without weakening protection:

1. **Run in monitor mode first** and collect a baseline of flagged requests.
2. **Identify the offending rule ID** from the WAF log for each false positive.
3. **Scope an exclusion narrowly** — for a specific path, parameter, or rule — rather than disabling whole rule categories. Contact the team with the rule IDs and endpoints to adjust the policy.
4. **Re-test** the affected flows, then promote the policy to block mode.

Prefer the **most specific exclusion possible**: disabling a broad category to fix one endpoint removes protection everywhere.

## Troubleshooting

- **Legitimate requests return `403`:** the WAF is blocking a false positive. Find the matched rule ID in the logs and request a scoped exclusion (see above), or temporarily switch to monitor mode while you tune.
- **Attacks not appearing in logs:** confirm the WAF policy is enabled on the correct app and that traffic is reaching Faable (not cached or served elsewhere).
- **API clients failing after enabling block mode:** machine clients often send payloads that trip generic rules; capture the rule IDs and add path/parameter-scoped exclusions for those endpoints.

## Related

- [Get Started with Faable Deploy](get-started.md)
- [Custom domains](domains/custom-domain.md) · [SSL certificates](domains/ssl-certificates.md)
- [Faable Deploy vs Vercel, Render & Railway](compare.mdx) — the WAF is included, not an add-on
