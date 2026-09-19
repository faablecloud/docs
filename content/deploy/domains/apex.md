---
title: Apex Domains
description: Serve your Faable app on a bare domain like example.com. Why DNS forbids a CNAME at the zone root, which providers offer ALIAS or CNAME flattening, when to use an A record instead, and the trade-off between the two.
---

# Apex domains

**An apex domain is the bare name — `example.com`, with nothing in front of it.** The DNS standard does not allow a `CNAME` record at the root of a zone, so the `CNAME` instruction shown in your Faable dashboard cannot be used there. This page covers the three ways round it and how to choose.

If your hostname has something in front of it — `www.example.com`, `app.example.com` — none of this applies. Follow [Custom Domain](custom-domain.md) and use the `CNAME`.

## Why the CNAME does not work at the root

A `CNAME` means "this name is an alias for that one", and the standard ([RFC 1034 §3.6.2](https://datatracker.ietf.org/doc/html/rfc1034#section-3.6.2)) says a name with a `CNAME` **cannot hold any other record**. The zone root has to hold `NS` and `SOA` records to exist at all, so a `CNAME` there would contradict them. Most DNS providers simply refuse to save it.

This is a property of DNS, not a Faable limitation — you will hit the same wall with any host.

## Option 1 — `ALIAS` / `ANAME` (best, if your provider has it)

Some providers offer a synthetic record that behaves like a `CNAME` at the apex: they resolve the target for you and answer with its addresses. It is variously called `ALIAS`, `ANAME` or **CNAME flattening**.

Create it pointing at the same target the dashboard shows for the `CNAME`:

```txt
.    IN    ALIAS    <domain_id>.faable.link.
```

Providers that support it include **Cloudflare** (automatic CNAME flattening at the root), **Route 53** (alias records), **DNSimple** and **Namecheap**. See [Cloudflare](cloudflare.md) and [Namecheap](namecheap.md).

This is the option to prefer: the target is a hostname, so if Faable's addresses ever change your domain follows automatically.

## Option 2 — an `A` record

If your provider has no `ALIAS` — **GoDaddy** is the common case, see [GoDaddy](godaddy.md) — point the root at Faable's address with a plain `A` record.

Resolve the address your domain should use:

```sh
dig <domain_id>.faable.link A +short | tail -1
```

Take `<domain_id>.faable.link` from your Faable dashboard. Then create:

```txt
.    IN    A    <the address you just resolved>
```

Faable accepts this and verifies the domain normally.

<Callout type="warning">
  An `A` record writes a **literal IP address** into your zone. An `ALIAS` or `CNAME` follows
  Faable's address automatically; an `A` record does not. If our addresses ever change, an apex
  on an `A` record stops resolving until you edit it by hand. Prefer Option 1, or Option 3.
</Callout>

## Option 3 — serve on `www` and redirect the root

Often the simplest answer: put the app on `www.example.com` with a normal `CNAME`, and have your DNS provider redirect the bare domain to it.

Most providers offer this as **Domain Forwarding**, **URL Redirect** or a redirect rule. Use a **permanent (301)** redirect to `https://www.example.com`.

Nothing to maintain, nothing pinned to an address, and visitors typing `example.com` still land on your app.

<Callout type="info">
  Apply the redirect **only** to the bare domain. A redirect on the hostname you gave to Faable
  is an HTTP redirect rather than a DNS record, so Faable cannot verify it and no certificate
  will be issued.
</Callout>

## Which to choose

| Your provider                              | Use                             |
| ------------------------------------------ | ------------------------------- |
| Cloudflare, Route 53, DNSimple, Namecheap  | Option 1 — `ALIAS` / flattening |
| GoDaddy, or anything without `ALIAS`       | Option 3 — `www` plus a 301     |
| You need the bare domain to serve directly | Option 2 — `A` record           |

## Verify

```sh
dig example.com A +short
```

The address should match the one you resolved from `<domain_id>.faable.link`. Faable re-checks every domain automatically; once the record resolves, the domain verifies and the [SSL certificate](ssl-certificates.md) is issued shortly after.

Remember that both the apex and `www` are separate names. If you want both to work, configure both.

## Related

- [Custom Domain](custom-domain.md)
- [Cloudflare](cloudflare.md)
- [GoDaddy](godaddy.md)
- [Namecheap](namecheap.md)
- [SSL Certificates](ssl-certificates.md)
