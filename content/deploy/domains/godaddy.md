---
title: GoDaddy
description: Point a GoDaddy domain at Faable. Step-by-step DNS Records setup, why GoDaddy cannot CNAME an apex domain and what to do instead, removing the parked record, and avoiding Domain Forwarding.
---

# Using GoDaddy with Faable

**To serve your Faable app on a GoDaddy domain, delete the parked record and add a `CNAME` on `www` pointing at the target shown in your Faable dashboard.** GoDaddy's DNS has one significant limitation — it cannot point an apex domain at a hostname — so if you want `example.com` without the `www`, read the [apex section](#apex-domains-example-com) before you start.

## Check your domain is using GoDaddy's DNS

GoDaddy is your **registrar**, but the records are only read from whoever your nameservers point to. If you moved the domain to Cloudflare or Route 53, edit it there instead.

```sh
dig NS example.com +short
```

GoDaddy's own DNS answers with a pair like `ns09.domaincontrol.com` and `ns10.domaincontrol.com`. If you see something else — `*.ns.cloudflare.com`, `*.awsdns-*.net` — go and edit the records there. For Cloudflare, see [Cloudflare](cloudflare.md).

## Subdomains (CNAME)

This is the straightforward case, and the one to prefer on GoDaddy.

1. Open your [GoDaddy domain portfolio](https://dcc.godaddy.com/control/portfolio) and select the domain.
2. Go to **DNS** → **DNS Records**.
3. Delete the parked record GoDaddy added when you registered the domain — an `A` record on `@` whose value GoDaddy shows as **Parked**, and the `CNAME` on `www` pointing at `@`.
4. **Add** a new record:

| Field | Value                      |
| ----- | -------------------------- |
| Type  | `CNAME`                    |
| Name  | `www`                      |
| Value | `<domain_id>.faable.link.` |
| TTL   | `1 Hour`                   |

Take the exact `<domain_id>.faable.link` value from your Faable dashboard. GoDaddy's **Name** field is the subdomain on its own — enter `www`, not `www.example.com`.

<Callout type="warning">
  Do not use **Domain Forwarding** for the hostname you gave to Faable. Forwarding is an HTTP
  redirect served by GoDaddy, not a DNS record, so Faable cannot verify the hostname and no
  certificate will be issued. Forwarding on the *apex* is fine — see below.
</Callout>

## Apex domains (`example.com`)

The DNS standard does not allow a `CNAME` at the zone apex. Some providers work around this with an `ALIAS`/`ANAME` record or CNAME flattening. **GoDaddy does not offer any of them**, so the `CNAME` instruction in the Faable dashboard cannot be followed at the apex. You have two options — see [Apex domains](apex.md) for the full picture.

### Recommended: `www` plus forwarding

Point `www` at Faable with the `CNAME` above, then send the apex to it:

1. **DNS** → **Forwarding** → **Domain**.
2. Forward `example.com` to `https://www.example.com`, **Permanent (301)**, forward only.

Your site lives on `https://www.example.com` and the bare domain redirects to it. Nothing needs maintaining.

### Alternative: an `A` record at the apex

GoDaddy will accept an `A` record on `@` pointing at Faable's address, and Faable verifies it. Find the address your domain should use:

```sh
dig <domain_id>.faable.link A +short | tail -1
```

```txt
188.166.63.6
```

Then add:

| Field | Value                           |
| ----- | ------------------------------- |
| Type  | `A`                             |
| Name  | `@`                             |
| Value | _the address you just resolved_ |
| TTL   | `1 Hour`                        |

<Callout type="warning">
  An `A` record pins a **literal IP address** into your zone. If Faable's address ever changes,
  a `CNAME` follows it automatically but an `A` record does not — your apex would stop resolving
  until you edited it by hand. Prefer `www` plus forwarding unless you specifically need the bare
  domain to serve the app directly.
</Callout>

## Verify

GoDaddy's default TTL is 1 hour, so allow up to an hour for the change to be visible everywhere.

```sh
dig www.example.com CNAME +short
```

```txt
domain_abc123.faable.link.
```

For an apex `A` record, check the address instead:

```sh
dig example.com A +short
```

Faable re-checks every domain automatically. Once the record resolves, the domain verifies and the [SSL certificate](ssl-certificates.md) is issued shortly after.

## Troubleshooting

- **GoDaddy rejects a `CNAME` on `@`:** that is the apex limitation, not a mistake on your part. Use one of the two options above.
- **Domain still resolves to a GoDaddy address** (for example `198.202.211.1`): the parked `A` record on `@` is still there. Delete it under **DNS Records**.
- **The site redirects instead of loading:** you left **Domain Forwarding** on the hostname you gave to Faable. Remove it — forwarding overrides the DNS record.
- **Nothing you change has any effect:** the domain is not on GoDaddy's nameservers. Check with `dig NS example.com +short`.
- **"Websites + Marketing" or a GoDaddy site builder is attached:** it manages the records itself and will put them back. Disconnect it from the domain before pointing it at Faable.
- **Old site still showing:** cached DNS. Wait for the previous TTL to expire and check again with `dig`.

## Related

- [Custom Domain](custom-domain.md)
- [Apex Domains](apex.md)
- [Cloudflare](cloudflare.md)
- [Namecheap](namecheap.md)
- [SSL Certificates](ssl-certificates.md)
