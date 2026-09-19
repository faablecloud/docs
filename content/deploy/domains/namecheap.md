---
title: Namecheap
description: Point a Namecheap domain at Faable. Step-by-step Advanced DNS setup, removing the default parking records, apex domains with ALIAS, and how to check your domain is actually using Namecheap's nameservers.
---

# Using Namecheap with Faable

**To serve your Faable app on a Namecheap domain, remove the default parking records and add a `CNAME` pointing at the target shown in your Faable dashboard.** A freshly registered Namecheap domain does not point anywhere useful yet — it points at Namecheap's own parking page, and that record has to go before Faable can verify the domain.

## First: check which nameservers your domain uses

This is the step that costs people the most time. Namecheap is your **registrar**, but your domain may not be using Namecheap's **DNS**. If you moved the domain to Cloudflare, Route 53 or anywhere else, editing records in Namecheap changes nothing — the records are read from whoever the nameservers point to.

1. Open the [Namecheap dashboard](https://ap.www.namecheap.com/domains/list/) and click **Manage** next to your domain.
2. On the **Domain** tab, look at **Nameservers**.

- If it reads **Namecheap BasicDNS** (or PremiumDNS), continue with this guide.
- If it lists something else — for example `mitch.ns.cloudflare.com` — go and edit the records **there** instead. For Cloudflare, see [Cloudflare](cloudflare.md).

You can confirm from a terminal:

```sh
dig NS example.com +short
```

Namecheap's own DNS answers with `dns1.registrar-servers.com` and `dns2.registrar-servers.com`.

## Remove the parking records

A new Namecheap domain ships with records that serve Namecheap's parking page. Leave them in place and they will either conflict with your Faable record or keep answering with a Namecheap address, and the domain will never verify.

1. Click **Manage** next to your domain, then open the **Advanced DNS** tab.
2. Under **Host Records**, delete:
   - the `CNAME Record` on host `@` pointing at `parkingpage.namecheap.com`
   - any `URL Redirect Record` on `@` or `www`

<Callout type="warning">
  A **URL Redirect Record** is not a normal DNS record — it is an HTTP redirect served by
  Namecheap. Faable cannot verify a hostname that redirects instead of resolving, so remove it
  rather than editing it.
</Callout>

## Subdomains (CNAME)

For `www.example.com`, add a record under **Host Records → Add New Record**:

| Field | Value                      |
| ----- | -------------------------- |
| Type  | `CNAME Record`             |
| Host  | `www`                      |
| Value | `<domain_id>.faable.link.` |
| TTL   | `Automatic`                |

Take the exact `<domain_id>.faable.link` value from your Faable dashboard. In Namecheap the **Host** field is the subdomain on its own — enter `www`, not `www.example.com`.

## Apex domains (ALIAS)

The DNS standard does not allow a `CNAME` at the zone apex, so for `example.com` with no subdomain use Namecheap's `ALIAS Record` type:

| Field | Value                      |
| ----- | -------------------------- |
| Type  | `ALIAS Record`             |
| Host  | `@`                        |
| Value | `<domain_id>.faable.link.` |
| TTL   | `Automatic`                |

If the `ALIAS Record` type is not offered on your plan, point `www` at Faable with a `CNAME` as above and send the apex to it with a **URL Redirect Record** from `@` to `https://www.example.com`. Add the redirect only on the apex — never on the hostname you gave to Faable.

## Verify

Namecheap's default TTL is `Automatic` (30 minutes), so allow up to half an hour before the change is visible everywhere. Check what the rest of the world sees:

```sh
dig www.example.com CNAME +short
```

You should get your Faable target back:

```txt
domain_abc123.faable.link.
```

Faable re-checks every domain automatically. Once the record resolves, the domain verifies and the [SSL certificate](ssl-certificates.md) is issued shortly after.

## Troubleshooting

- **Domain still resolves to a Namecheap address** (something in `162.255.116.0/22`, or `parkingpage.namecheap.com`): the parking record is still there. Delete it in **Advanced DNS → Host Records**.
- **Nothing you change has any effect:** the domain is almost certainly not on Namecheap's nameservers. Re-read the first section and check with `dig NS example.com +short`.
- **`@` and `www` behave differently:** they are separate records. Adding the `CNAME` on `www` does nothing for the apex, and vice versa.
- **Trailing dot:** enter the target exactly as the dashboard shows it. Namecheap accepts the value with or without the trailing dot, but a typo in the `<domain_id>` part will not verify.
- **Old site still showing:** cached DNS. Wait for the previous TTL to expire and check again with `dig`.

## Related

- [Custom Domain](custom-domain.md)
- [Apex Domains](apex.md)
- [Cloudflare](cloudflare.md)
- [GoDaddy](godaddy.md)
- [SSL Certificates](ssl-certificates.md)
