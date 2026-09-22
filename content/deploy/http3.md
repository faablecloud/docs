---
title: HTTP/3
description: Faable Deploy serves your app over HTTP/3 (QUIC) by default. Learn how to verify it, what changes for your app, and how to turn the advertisement off per app.
---

# HTTP/3

Every app on Faable Deploy is served over **HTTP/3** as well as HTTP/2 and HTTP/1.1. It is on by default and there is nothing to configure.

HTTP/3 runs on QUIC, which merges the transport handshake with the TLS handshake. A new connection needs one round trip instead of two, so the first byte of a response arrives sooner — on our own API the median time to first byte dropped from 287 ms to 188 ms. It also removes head-of-line blocking between streams: a lost packet stalls its own stream instead of the whole page, which matters most on mobile and congested Wi-Fi.

## How clients pick it

Your app's responses carry an `Alt-Svc` header advertising HTTP/3 on port 443. Browsers that support it remember the advertisement and use HTTP/3 on subsequent connections; everything else keeps using HTTP/2 or HTTP/1.1 exactly as before.

This means HTTP/3 is an **alternative**, never a replacement. A client that cannot use it — an old browser, a network that blocks UDP, a server-to-server call, our own CLI — is not affected in any way.

## Verifying it

With `curl` built with HTTP/3 support:

```bash
curl -sI https://your-app.faable.link/ | grep -i alt-svc
# alt-svc: h3=":443"; ma=2592000

curl -o /dev/null --http3-only -w '%{http_version}\n' https://your-app.faable.link/
# 3
```

In a browser, open DevTools → Network and add the **Protocol** column; HTTP/3 requests show as `h3`. The first page load of a session usually still uses HTTP/2 — the browser only learns about HTTP/3 from the `Alt-Svc` header of that first response.

## What does not change

- **Your application code.** Faable terminates HTTP/3 at the edge and talks to your app over HTTP/1.1, exactly as before. Your framework does not need HTTP/3 support.
- **WebSockets.** Browsers open WebSocket connections over TCP even when the page itself was served over HTTP/3. Upgrades keep working unchanged.
- **Streaming responses.** Server-Sent Events and chunked responses are delivered incrementally over HTTP/3, with the same timeouts as before.
- **Apps that scale to zero.** A request that wakes a sleeping app completes normally over HTTP/3.
- **Custom domains** get HTTP/3 too, with no extra setup.

## Turning it off for an app

If you would rather an app was not served over HTTP/3, set `http3` to `false` on the app:

```bash
curl -X POST https://api.faable.com/app/<app_id> \
  -H "Authorization: Bearer $FAABLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"http3": false}'
```

Set it back to `null` to return to the platform default:

```bash
-d '{"http3": null}'
```

Two things worth knowing before you use it:

- It controls the **advertisement**, not the listener. Your app stops telling clients that HTTP/3 is available, so new clients use HTTP/2. It does not refuse an HTTP/3 connection from a client that already knows the route.
- It is **not retroactive**. A browser that already cached the advertisement may keep using HTTP/3 until that cache expires. New visitors are unaffected from the moment you change the setting.

Unless you have a specific reason, leaving it on is the better default: it is faster, and clients that cannot use it were never affected in the first place.
