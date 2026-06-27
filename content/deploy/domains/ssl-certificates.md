---
title: SSL Certificates
description: Secure your custom domains with SSL certificates on Faable. Learn about automatic managed SSL, uploading custom enterprise certificates, wildcard support, renewal, and troubleshooting HTTPS issues.
---

# SSL Certificates

**Every Faable domain gets a free, automatically managed SSL certificate, so your app is served over HTTPS without any setup.** Faable issues and **renews certificates automatically** for your `*.faable.link` URLs and your [custom domains](custom-domain.md) once their DNS is verified. Enterprise teams can optionally upload their own certificate instead.

## Automatic (managed) certificates

For most teams there is nothing to do: when you add a [custom domain](custom-domain.md) and the DNS record is correct, Faable provisions a certificate and keeps it renewed before expiry. Managed certificates cover both subdomains and apex domains.

## Uploading a custom certificate (Enterprise)

Enterprise teams can serve their own certificate on a custom domain rather than the one Faable generates. Upload it from the [domains](https://dashboard.faable.com/domains) configuration page in the [Faable Dashboard](https://dashboard.faable.com).

To upload a custom certificate, provide three pieces:

1. The **private key** for the certificate.
2. The **certificate** itself.
3. The **Certificate Authority (CA) root/chain certificate** — provided by your certificate issuer, separate from the domain's core certificate. It may be part of their download or available on their site.

Paste the contents of each file directly into the corresponding input. The certificate and private key are extracted from the [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files your issuer provides, in this format:

`certificate.pem`:

```
-----BEGIN CERTIFICATE-----
<Certificate body will be here>
-----END CERTIFICATE-----
```

`private-key.pem`:

```
-----BEGIN PRIVATE KEY-----
<Private key body will be here>
-----END PRIVATE KEY-----
```

## SSL best practices

- **Wildcard certificates** can be uploaded to cover multiple subdomains at once.
- You can include **additional Common Names (CNs)** for subdomains that are not managed by the Faable platform.
- A certificate with an **explicitly defined subdomain** is prioritized over a wildcard certificate when both are valid for a given subdomain.
- Include the **full chain** (leaf + intermediates) so all clients can validate the certificate.

## Troubleshooting

- **"Not secure" / certificate not provisioned:** the domain must be verified first. Confirm the [custom domain](custom-domain.md) DNS record is correct — SSL can't be issued until verification succeeds.
- **Browser certificate warning after upload:** the chain is incomplete. Re-upload including the CA root/intermediate certificate.
- **Wildcard not matching a host:** a more specific certificate takes precedence; check whether an explicit-subdomain certificate is also installed.
- **Certificate "expired":** managed certificates renew automatically; for uploaded custom certificates, you are responsible for replacing them before expiry.

## Related

- [Custom Domain](custom-domain.md)
- [Get Started with Faable Deploy](../get-started.md)
