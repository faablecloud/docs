---
title: Cloudflare
description: Point a Cloudflare-managed domain at Faable. Why a proxied (orange cloud) record shows "Check error", how to switch the record to DNS only so Faable can verify it and issue your SSL certificate, and how to verify the change with dig.
---

# Using Cloudflare with Faable

**If your domain is managed by Cloudflare, set its DNS record to "DNS only" (grey cloud) so Faable can verify it and issue your SSL certificate.** Cloudflare's proxy (the orange cloud) answers DNS with Cloudflare's own addresses, which hides the record you pointed at Faable. Faable then reports **Check error** on the domain, because the check genuinely cannot see your configuration from the outside.

Using Cloudflare as your DNS provider is fully supported. It is only the **proxy** that needs to be off.

## Why a proxied domain shows "Check error"

When you add a [custom domain](custom-domain.md), Faable looks up your hostname in public DNS and expects to find the target shown in the dashboard, `<domain_id>.faable.link`.

With the proxy enabled, Cloudflare terminates the connection at its edge and answers the lookup with its own anycast addresses (for example `104.21.20.137`). The `CNAME` you created still exists, but it lives inside your Cloudflare zone and is never visible from outside it. Faable sees Cloudflare, not your record.

This is why the domain is flagged **Check error** rather than _Misconfigured_: your record may well be correct — Faable simply has no way to confirm it. Re-checking will not change the result while the proxy is on.

The proxy affects certificates too. Faable issues SSL certificates through Let's Encrypt using an **HTTP-01 challenge**, which has to reach your hostname directly. Cloudflare sitting in front can interfere with issuance and with the automatic renewals that follow.

## Switch the record to DNS only

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com) and select your domain.
2. Go to **DNS → Records**.
3. Find the record for the hostname you added to Faable — for example `www`.
4. Confirm the record is a `CNAME` whose target is the value shown in your Faable dashboard:

   ```txt
   www    IN    CNAME    <domain_id>.faable.link.
   ```

5. Click the **orange cloud** in the **Proxy status** column so it turns **grey** and reads **DNS only**.
6. **Save**.

Faable re-checks every domain automatically, so there is nothing else to do. The status moves to verified once the new record propagates, and the certificate is issued shortly after.

<Callout type="info">
  Apex domains (`example.com`, with no `www`) need an `ALIAS`-style record rather than a `CNAME`.
  Cloudflare supports this through CNAME flattening — create the `CNAME` at the apex as normal and
  Cloudflare will flatten it. Set proxy status to **DNS only** there as well.
</Callout>

## Verify the change

Check what the rest of the world sees:

```sh
dig www.example.com CNAME +short
```

You should get your Faable target back:

```txt
domain_abc123.faable.link.
```

If you still see a pair of Cloudflare addresses instead, the proxy is still on for that record, or the previous answer is still cached — wait for the record's **TTL** to expire and check again.

## If you need to keep the proxy on

Some teams want Cloudflare's proxy in front of their app for caching or WAF. In that case:

- Turn the proxy **off first** and leave it off until Faable has verified the domain and issued the certificate. You can re-enable it afterwards.
- Once a domain has been verified, turning the proxy back on **does not** un-verify it: Faable keeps the domain verified and keeps serving it, and simply reports that it can no longer check the record.
- Set Cloudflare's SSL/TLS mode to **Full (strict)** so the connection from Cloudflare to Faable stays encrypted and validated. **Flexible** sends unencrypted traffic to your app and should not be used.
- Keep in mind that certificate **renewal** also uses an HTTP-01 challenge. If a renewal fails with the proxy on, switch the record back to **DNS only** until it completes.

## Troubleshooting

- **Still "Check error" after switching to DNS only:** the old answer is cached. Confirm with `dig` from a different network or use `dig @1.1.1.1 www.example.com CNAME +short`.
- **"Check error" on a domain you never proxied:** confirm the record's target matches the dashboard exactly, including the trailing dot.
- **Certificate not issued:** verification has to succeed first. See [SSL certificates](ssl-certificates.md).
- **Wrong hostname:** a custom domain has to be a hostname you own and control in your own DNS zone. Adding a domain registered by somebody else will never verify.

## Related

- [Custom Domain](custom-domain.md)
- [Apex Domains](apex.md)
- [GoDaddy](godaddy.md)
- [Namecheap](namecheap.md)
- [SSL Certificates](ssl-certificates.md)
