---
title: Custom Domain
description: Configure a custom domain for Faable Auth so your users see your own branded login experience.
---

# Custom Domain

Faable Auth allows you to serve the authentication UI from your own domain (e.g. `auth.example.com`) instead of the default Faable-hosted URL. This gives your users a fully branded login experience.

## Step 1 — Add your domain in Settings

1. Open your auth project in the [Faable Dashboard](https://dashboard.faable.com).
2. Navigate to **Settings → Custom Domain**.
3. Enter the domain you want to use (e.g. `auth.example.com`) and click **Add Domain**.

Faable Auth will generate two DNS records you need to add to your registrar: a **CNAME** record to route traffic, and a **TXT** record to prove ownership of the domain.

## Step 2 — Point your DNS to Faable Auth

In your DNS registrar's control panel, create a `CNAME` record for your subdomain pointing to Faable Auth:

```txt
auth    IN    CNAME    auth.faable.com.
```

> **Note:** Replace `auth` with the subdomain you chose (e.g. `auth`, `login`, `id`). The trailing dot after `faable.com.` is intentional and may be required by some DNS providers.

DNS changes can take anywhere from a few minutes to 48 hours to propagate worldwide.

## Step 3 — Verify domain ownership

To confirm you control the domain, Faable Auth requires a `TXT` record in your DNS. The exact value is shown in **Settings → Custom Domain** after you add your domain.

Add the record as follows:

```txt
_faable-auth-verification.auth    IN    TXT    "<your-verification-token>"
```

Replace `<your-verification-token>` with the token shown in your dashboard. The prefix `_faable-auth-verification` must be prepended to the subdomain you are verifying.

Once you have added both records, click **Verify** in the dashboard. Faable Auth will query your DNS and confirm:

- The `CNAME` record points to `auth.faable.com`.
- The `TXT` record contains the expected verification token.

Verification is usually instant once DNS has propagated. If it fails, double-check the record values and wait a few more minutes before retrying.

## What happens after verification

Once your domain is verified, Faable Auth will:

- Automatically provision a TLS certificate for your domain via Let's Encrypt.
- Route all authentication traffic through your custom domain.
- Keep the certificate renewed automatically.

Your users will now see `https://auth.example.com` in their browser during sign-in, sign-up, and password reset flows.

## Troubleshooting

| Issue                      | Likely cause                   | Fix                                                             |
| -------------------------- | ------------------------------ | --------------------------------------------------------------- |
| Verification keeps failing | DNS not yet propagated         | Wait a few minutes and retry                                    |
| TXT record not found       | Wrong prefix or missing record | Ensure the record name starts with `_faable-auth-verification.` |
| CNAME not resolving        | Typo in record value           | Confirm the target is exactly `auth.faable.com.`                |
| Certificate not issued     | Domain not reachable yet       | Check that the CNAME resolves publicly before verifying         |
