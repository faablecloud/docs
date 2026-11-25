---
title: Cookies on faable.link
description: faable.link is on the Public Suffix List, so browsers treat every app on it as a separate site. What that means for cookies shared between apps, SameSite, and a frontend and API on two faable.link URLs.
---

# Cookies on faable.link

**Browsers treat each `<app>.faable.link` as a separate site, so two apps on `faable.link` cannot share a cookie.** `faable.link` is on the [Public Suffix List](https://publicsuffix.org/), the list browsers use to decide where one site ends and another begins. This protects your app: no other app on `faable.link` can set a cookie that yours receives.

The entry was added in November 2026. Each browser picks it up with its own updates, so until then an older version may still treat `faable.link` as one site. Don't rely on either behavior: build as if every app were its own site.

## What works and what doesn't

| You want to                                                          | On `*.faable.link`                                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Set a cookie for your own app (no `Domain` attribute)                | Works                                                                                          |
| Set `Domain=.faable.link`                                            | Rejected by the browser                                                                        |
| Send a `SameSite=Lax` or `Strict` cookie on a `fetch` to another app | The cookie is not sent                                                                         |
| Send a `SameSite=None; Secure` cookie on a `fetch` to another app    | Third-party cookie: some browsers block it                                                     |
| Send an `Authorization: Bearer` token to another app                 | Works, with [CORS](https://developer.mozilla.org/docs/Web/HTTP/Guides/CORS) enabled on the API |
| Use a passkey with `faable.link` as the relying party ID             | Rejected by the browser; use your app's own host                                               |

Apps on a [custom domain](custom-domain.md) follow the rules of that domain and are not affected.

## A frontend and an API in two apps

If `web-ab12c.faable.link` calls `api-cd34e.faable.link` and the API keeps its session in a cookie, choose one of these:

1. **Put both on your own domain**, for example `www.example.com` and `api.example.com`. They are the same site, so `SameSite=Lax` cookies are sent. This is the one to use in production.
2. **Proxy the API through the frontend**, so the browser only talks to one host. The cookie belongs to the frontend's host. In Next.js, use a rewrite:

   ```js
   // next.config.mjs
   export default {
     async rewrites() {
       return [
         {
           source: '/api/:path*',
           destination: 'https://api-cd34e.faable.link/api/:path*'
         }
       ]
     }
   }
   ```

   The API must set its cookie without a `Domain` attribute.

3. **Use a token instead of a cookie**: send it in the `Authorization` header.

With option 1, `fetch` still needs `credentials: 'include'`, and the API must answer with `Access-Control-Allow-Credentials: true` and your exact frontend origin in `Access-Control-Allow-Origin` (not `*`).

## Signing in with Faable Auth

Sign-in by redirect works the same on a `faable.link` URL: the browser navigates to your Faable Auth domain and comes back with a code.

## Troubleshooting

- **The login succeeds but the next API call answers 401:** the API's cookie is not being sent across apps. Use one of the three options above.
- **The cookie never appears in the browser:** remove `Domain=.faable.link` from `Set-Cookie`.
- **It works in one browser and fails in another:** they have different versions of the list, or one blocks third-party cookies.

## Related

- [Custom Domain](custom-domain.md)
- [SSL Certificates](ssl-certificates.md)
- [Security](../../platform/security-compliance.md#tenant-isolation)
