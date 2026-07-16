---
title: Custom Domain
description: Learn how to configure a custom domain for your Faable application. Step-by-step guide to setting up CNAME and ALIAS records, apex domains, propagation, and troubleshooting DNS for your Faable app.
---

# Custom Domain

**To serve your Faable app on your own domain, add the domain in the dashboard and point a DNS record at Faable.** Go to [Faable Dashboard > Projects > Domains](https://dashboard.faable.com), create a Domain entry, and link it to your deployed Faable App. Faable then issues an [SSL certificate](ssl-certificates.md) automatically, so your site is served over HTTPS.

## Subdomains (CNAME)

For a subdomain such as `www.example.com`, create a `CNAME` record pointing to the target shown in the dashboard:

```txt
www    IN      CNAME      <domain_id>.domains.faable.link.
```

🚀 Your site is ready at: `https://www.example.com`

## Apex domains (ALIAS)

If your domain is an apex (root) domain such as `example.com`, create an `ALIAS` record instead of a `CNAME`, because the DNS standard does not allow `CNAME` at the zone apex:

```txt
.    IN      ALIAS      <domain_id>.domains.faable.link.
```

Check with your DNS provider that it supports `ALIAS` (sometimes called `ANAME` or "CNAME flattening") at the apex — it is not universally available. Providers that support it include Cloudflare, Route 53, and DNSimple, among others. If yours does not, use the `www` subdomain with a redirect from the apex.

## Verification and propagation

- After creating the record, Faable verifies the domain and provisions the certificate. This usually completes within minutes once DNS is correct.
- **DNS propagation** can take anywhere from a few minutes up to the record's **TTL** (time to live). Lowering the TTL _before_ you migrate makes later changes propagate faster.
- You can check the live record with `dig www.example.com CNAME +short` or `dig example.com ALIAS +short`.

## Troubleshooting

- **Domain stuck "unverified":** the DNS record is missing or points to the wrong target. Re-check the exact `<domain_id>.domains.faable.link.` value in the dashboard (note the trailing dot) and that you edited the right zone.
- **Certificate not issued yet:** verification must succeed first; a misconfigured record blocks SSL. See [SSL certificates](ssl-certificates.md).
- **Apex `CNAME` rejected by provider:** use an `ALIAS`/`ANAME` record, or point `www` to Faable and redirect the apex to `www`.
- **Old site still showing:** you're seeing cached DNS. Wait for the previous TTL to expire, then re-check with `dig`.
- **Conflicting records:** remove any existing `A`/`AAAA`/`CNAME` on the same name that point elsewhere, since they override or conflict with the Faable record.

## Related

- [SSL Certificates](ssl-certificates.md)
- [Get Started with Faable Deploy](../get-started.md)
