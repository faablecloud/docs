---
schema: faq
title: Deploy a Discord Bot
description: Host a Discord bot on Faable Deploy from GitHub, in Node.js or Python. HTTP interactions with Ed25519 signature verification, slash command registration, deferred replies for the 3-second deadline, the $PORT contract and secrets — and why the gateway does not fit a scale-to-zero platform. 100% European hosting.
---

# Deploy a Discord Bot 🎮

**Run your Discord bot on HTTP interactions and Faable Deploy is all the infrastructure it needs.** Push a repo with a small web server in it and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and puts a [WAF](../security-waf.md) in front of it. Discord requires a public HTTPS endpoint with a trusted certificate to deliver interactions; you have one from the first deploy.

This guide covers **Node.js** and **Python** with the plain HTTP API — no framework required.

## HTTP interactions, not the gateway

Make this decision first, because it decides whether your bot works at all — and it is the one most Discord tutorials get wrong for a platform like this one.

Discord offers your bot two completely different ways to hear from users, and they are not interchangeable:

- **HTTP interactions.** You give Discord a URL, and it `POST`s an interaction to it every time somebody runs one of your slash commands. Traffic is **inbound**, so the request itself wakes your app.
- **The gateway.** Your bot opens a persistent WebSocket _out_ to Discord and keeps it alive. This is what `discord.js` and `discord.py` do by default, and what almost every tutorial shows.

Faable Deploy scales an app to zero once no HTTP request has arrived for a while — **30 minutes on the Free plan, 2 hours on Hobby and Pro** — and wakes it on the next one. HTTP interactions fit that exactly: somebody runs a command, the request wakes your app, your app answers. Idle time is free, and a bot people actually use never sleeps at all.

A gateway bot does the opposite. Its connection is outbound, so **no inbound request ever arrives** — nothing keeps it awake, and it sleeps as soon as that window elapses **on any plan**, dropping the socket.

|                        | HTTP interactions                      | Gateway (WebSocket)                                             |
| :--------------------- | :------------------------------------- | :-------------------------------------------------------------- |
| How events arrive      | Inbound HTTPS POST from Discord        | Outbound socket your app holds open                             |
| Survives scale-to-zero | Yes — the interaction wakes the app    | No — nothing keeps the app awake                                |
| Cost while idle        | Nothing                                | Constantly running                                              |
| Covers                 | Slash commands, buttons, menus, modals | Everything, plus message content, presence, reactions and voice |

**Slash commands, buttons, select menus and modals all work over HTTP interactions**, which is the whole surface most bots need. If your bot genuinely has to read every message in a channel, track presence or join voice, it needs the gateway — and it needs a host that keeps a process alive with no inbound traffic, which is not what this platform does today.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

- **Node.js** — a `package.json` with a `start` script. Supported versions: 20, 22 and 24.
- **Python** — a `requirements.txt`, `pyproject.toml` or `Pipfile`, plus a module defining your app object. Supported versions: 3.10, 3.11, 3.12 and 3.13.

## Serve on `$PORT`

Faable assigns your app a port and passes it as the `PORT` environment variable. Bind `0.0.0.0` and read it — a hardcoded port means Discord's deliveries time out and it disables your endpoint.

## Verify the signature, on the raw body

This is the part that trips people up, so it is worth being precise before the code.

Every interaction carries `X-Signature-Ed25519` and `X-Signature-Timestamp`. You verify the signature over **`timestamp` concatenated with the exact request body bytes**, using your app's **public key** from the Developer Portal. Two consequences:

- **You need the raw body, not the parsed JSON.** Re-serialising the parsed object produces different bytes and every signature fails. Capture the buffer before parsing.
- **An invalid signature must get a `401`.** This is not just good hygiene: when you save an Interactions Endpoint URL, Discord deliberately sends requests with **bad** signatures and refuses the URL if you answer them with anything but `401`.

Discord also sends a `PING` (`type: 1`) which you answer with a `PONG` (`type: 1`). Until that works, the URL cannot be saved at all.

## Node.js

`package.json`:

```json
{
  "name": "discord-bot",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "tweetnacl": "^1.0.3"
  }
}
```

`server.js`:

```js
import express from 'express'
import nacl from 'tweetnacl'

const { PORT, DISCORD_PUBLIC_KEY } = process.env

const app = express()

// Keep the raw bytes: the signature is over the body exactly as it arrived.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf
    }
  })
)

function isFromDiscord(req) {
  const signature = req.get('x-signature-ed25519')
  const timestamp = req.get('x-signature-timestamp')
  if (!signature || !timestamp) return false

  return nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(timestamp), req.rawBody]),
    Buffer.from(signature, 'hex'),
    Buffer.from(DISCORD_PUBLIC_KEY, 'hex')
  )
}

app.post('/discord/interactions', (req, res) => {
  // Discord validates your endpoint by sending deliberately bad signatures.
  // Anything other than 401 here and it refuses to save the URL.
  if (!isFromDiscord(req))
    return res.status(401).send('invalid request signature')

  const interaction = req.body

  // 1 = PING. Discord sends this to check the endpoint is alive.
  if (interaction.type === 1) return res.json({ type: 1 })

  // 2 = APPLICATION_COMMAND (a slash command).
  if (interaction.type === 2) {
    const name = interaction.data.name

    // 4 = CHANNEL_MESSAGE_WITH_SOURCE — reply immediately.
    return res.json({
      type: 4,
      data: { content: `You ran /${name}` }
    })
  }

  res.sendStatus(400)
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))
```

## Python

`requirements.txt`:

```txt
Flask>=3.0
PyNaCl>=1.5
requests>=2.32
gunicorn
```

`app.py` — the builder finds `app = Flask(...)` and starts it with `gunicorn app:app --bind 0.0.0.0:$PORT`:

```python
import os

from flask import Flask, jsonify, request
from nacl.exceptions import BadSignatureError
from nacl.signing import VerifyKey

app = Flask(__name__)

verify_key = VerifyKey(bytes.fromhex(os.environ["DISCORD_PUBLIC_KEY"]))


def is_from_discord() -> bool:
    signature = request.headers.get("X-Signature-Ed25519")
    timestamp = request.headers.get("X-Signature-Timestamp")
    if not signature or not timestamp:
        return False

    try:
        # request.data is the raw body — do not rebuild it from the parsed JSON.
        verify_key.verify(timestamp.encode() + request.data, bytes.fromhex(signature))
    except (BadSignatureError, ValueError):
        return False
    return True


@app.post("/discord/interactions")
def interactions():
    # Discord probes with bad signatures on setup; it expects a 401.
    if not is_from_discord():
        return "invalid request signature", 401

    interaction = request.get_json(silent=True) or {}

    # 1 = PING
    if interaction.get("type") == 1:
        return jsonify(type=1)

    # 2 = APPLICATION_COMMAND
    if interaction.get("type") == 2:
        name = interaction["data"]["name"]
        # 4 = CHANNEL_MESSAGE_WITH_SOURCE
        return jsonify(type=4, data={"content": f"You ran /{name}"})

    return "", 400


@app.get("/healthz")
def healthz():
    return {"ok": True}
```

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your bot's repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

## Set your secrets

Never commit your bot token — anyone holding it controls your bot:

```bash
faable deploy secrets set \
  DISCORD_PUBLIC_KEY=<public key> \
  DISCORD_APP_ID=<application id> \
  DISCORD_BOT_TOKEN=<bot token>
```

All three come from the [Discord Developer Portal](https://discord.com/developers/applications): the **public key** and **application id** from _General Information_, the **bot token** from _Bot_. The public key is what verifies incoming interactions; the bot token is what authenticates you when you call Discord's API. See [Environment & Releases](../environment.mdx) for the variables Faable injects for you.

## Register your commands

Discord only sends interactions for commands it knows about, so register them once. This is a one-off `curl`:

```bash
# Guild-scoped: appears instantly. Use this while developing.
curl -X PUT \
  "https://discord.com/api/v10/applications/$DISCORD_APP_ID/guilds/$GUILD_ID/commands" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H 'content-type: application/json' \
  -d '[{"name":"ping","description":"Check the bot is alive","type":1}]'
```

Drop `/guilds/$GUILD_ID` for a global command, available in every server your app is in — those can take up to an hour to propagate, which is why guild commands are the sane choice while you iterate.

## Point Discord at your app

In the Developer Portal, under _General Information_, set **Interactions Endpoint URL** to your route:

```
https://<app>.faable.link/discord/interactions
```

Saving it triggers the validation described above: a `PING` that must get a `PONG`, and bogus-signature requests that must get `401`. If it saves, you are live. A [custom domain](../domains/custom-domain.md) works identically — use that URL instead.

Invite the app to a server with the `applications.commands` scope (add `bot` too if it also needs a bot user), from _OAuth2 → URL Generator_.

## The 3-second rule, and how cold starts fit in it

**Discord expects your first response within 3 seconds** or it shows the user "The application did not respond" and discards the interaction. That is a hard deadline, and it is the one thing worth designing around on a platform that scales to zero.

The tool for it is a **deferred response**: answer `type: 5` immediately, which makes Discord show a "thinking…" state, and then edit the real reply in within the next 15 minutes.

```js
// Answer instantly, then take your time.
res.json({ type: 5 }) // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

const url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${interaction.token}/messages/@original`
await fetch(url, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ content: await somethingSlow() })
})
```

Defer anything that calls another API, queries a database or asks an LLM. It costs you one extra line and removes the deadline from the equation entirely — including on the first request after a sleep, when the container is still starting.

## What sleeping does and doesn't break

After 30 minutes with no requests on the Free plan — 2 hours on Hobby and Pro — your bot scales to zero. The next interaction wakes it. What that means in practice:

- **The first interaction after a sleep is slower** — the container starts up. This is precisely what deferred replies absorb; keep boot work light too, and open database connections lazily rather than at import time.
- **In-memory state is gone.** Anything held in a module-level dictionary disappears on sleep and on every deploy. Persist it — see [Databases](databases.md).
- **Timers don't fire while asleep.** A bot that posts a daily announcement needs an external trigger hitting an endpoint, not an in-process `setInterval`.

## Troubleshooting

- **"Interactions Endpoint URL could not be verified"** — the three usual causes, in order: you answered a bad-signature request with something other than `401`; you verified against the parsed JSON instead of the raw body; or you used the bot token where the public key belongs.
- **Every signature fails, and the code looks right** — a body parser ran before you captured the buffer. `express.json()` without the `verify` hook leaves you nothing to check against.
- **"The application did not respond"** — you took longer than 3 seconds. Defer with `type: 5`.
- **Commands don't appear in Discord** — they were never registered, or you registered them globally and are still inside the propagation window. Register guild-scoped while developing.
- **Requests time out** — the server binds a hardcoded port instead of `$PORT`, or listens on `127.0.0.1` instead of `0.0.0.0`.
- **The app exits right at boot** — a missing secret. `os.environ["…"]` throws at import time; the logs name it.

## FAQ

### Can I host a Discord bot on Faable Deploy?

Yes. Build it on HTTP interactions and it is an ordinary web server. Faable Deploy gives every app a public HTTPS URL with a valid certificate on the first deploy, which is exactly what Discord's Interactions Endpoint URL requires. Push a Node.js or Python repo — no Dockerfile, no YAML.

### Should my Discord bot use HTTP interactions or the gateway on Faable?

HTTP interactions. Faable scales an app to zero after 30 minutes without an inbound request on the Free plan, or 2 hours on Hobby and Pro. A gateway bot holds an outbound WebSocket and receives no inbound traffic at all, so nothing keeps it awake and it sleeps on every plan. An interactions bot is woken by each command, costs nothing while idle, and stays up continuously once it has real traffic.

### Can I use discord.js or discord.py on Faable Deploy?

Only in their HTTP-interactions mode. Their default entry points — `client.login()` and `bot.run()` — open a gateway connection, which is the pattern that does not survive scale-to-zero. Slash commands, buttons, select menus and modals are all available over HTTP; message content, presence, reactions and voice are not.

### How do I verify that an interaction really came from Discord?

Verify the `X-Signature-Ed25519` header against `X-Signature-Timestamp` plus the raw request body, using your application's public key. Reject anything that fails with a `401` — Discord tests exactly that when you save your endpoint URL.

### Why does my Discord bot say "The application did not respond"?

Discord requires a response within 3 seconds. If your handler does anything slow, reply with a deferred response (`type: 5`) straight away and edit the message afterwards through the interaction webhook.

### Which port should my Discord bot listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it and routes public HTTPS traffic to it.

## Related

- [Deploy a Slack App](guide-slack-bot.md) · [Deploy a Telegram Bot](guide-telegram-bot.md) · [Deploy a WhatsApp Bot](guide-whatsapp-bot.md) — the same shape, on other platforms
- [Deploy a Stripe Webhook Endpoint](guide-stripe-webhooks.md) — the same verify-and-acknowledge shape, plus idempotency
- [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md) · [Deploy FastAPI](guide-fastapi.md)
- [Databases & SQLite](databases.md) — where to keep state between interactions
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules and the `$PORT` contract
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
