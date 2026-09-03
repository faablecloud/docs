---
schema: faq
title: Deploy an LLM App with Streaming
description: Host an LLM-powered app or AI chatbot on Faable Deploy from GitHub, in Node.js or Python. Server-Sent Events from the Claude API to the browser, why streaming is required rather than optional, the 60-second time-to-first-byte limit, heartbeats, concurrency, the $PORT contract and API keys. 100% European hosting.
---

# Deploy an LLM App with Streaming 🤖

**An app that talks to an LLM is an ordinary web server with one slow dependency — and the way you handle that slowness is what decides whether it works here.** Push a repo and Faable builds it, gives it a public HTTPS URL with a valid certificate at `https://<app>.faable.link`, and puts a [WAF](../security-waf.md) in front of it.

This guide covers **Node.js** and **Python**, streaming from the [Claude API](https://docs.claude.com/en/api/overview) to the browser over Server-Sent Events.

## Stream, or you will get a 504

Make this decision first, because it is the difference between an app that works and one that fails on exactly the requests you care about.

Faable Deploy waits **60 seconds for your app's response headers**. Past that, the request is cut with a `504`. What it does _not_ limit is how long the response takes after those headers: we measured a response streaming for **96 seconds**, with 12-second gaps between chunks, arriving complete and unbuffered.

That gives one rule:

> **Send the headers immediately and stream the tokens as they arrive.** The 60-second limit is on time-to-first-byte, not on the length of the response.

The failure mode is the obvious implementation:

```js
// ❌ Headers only go out once the model has finished.
const message = await client.messages.create({ ... })
res.json({ text: message.content[0].text })
```

That works while answers are short, and starts returning `504` the moment a generation runs long — a bigger prompt, a harder question, a reasoning model taking its time. It looks like a platform timeout and it is really a design choice in the app.

```js
// ✅ Headers now, tokens as they come.
res.writeHead(200, { 'content-type': 'text/event-stream' })
```

**So on this platform `stream: true` is not a UX improvement, it is what keeps the request alive.** Which is fortunate, because it is also what users prefer.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

- **Node.js** — a `package.json` with a `start` script. Supported versions: 20, 22 and 24.
- **Python** — a `requirements.txt`, `pyproject.toml` or `Pipfile`, plus a module defining your app object. Supported versions: 3.10, 3.11, 3.12 and 3.13.

## Serve on `$PORT`

Faable assigns your app a port and passes it as the `PORT` environment variable. Bind `0.0.0.0` and read it — a hardcoded port means every request times out.

## Node.js

`package.json`:

```json
{
  "name": "llm-app",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.0",
    "express": "^4.19.2"
  }
}
```

`server.js`:

```js
import Anthropic from '@anthropic-ai/sdk'
import express from 'express'

const { PORT } = process.env
const client = new Anthropic() // reads ANTHROPIC_API_KEY

const app = express()
app.use(express.json())
app.use(express.static('public'))

app.post('/api/chat', async (req, res) => {
  // Headers first, before a single token exists. This is the whole trick.
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive'
  })

  // A comment line every 15s keeps proxies and browsers from giving up on a
  // quiet stream while the model is still thinking.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000)

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 64000,
      messages: [{ role: 'user', content: req.body.message }]
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
  } catch (err) {
    console.error(err)
    // The status is long gone — report the failure inside the stream.
    res.write(`data: ${JSON.stringify({ error: 'generation failed' })}\n\n`)
  } finally {
    clearInterval(heartbeat)
    res.end()
  }
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`))
```

And the browser side, which is smaller than people expect:

```js
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ message })
})

const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  for (const line of value.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6)
    if (payload === '[DONE]') break
    output.textContent += JSON.parse(payload).text ?? ''
  }
}
```

## Python

Use **FastAPI** here rather than Flask. Streaming responses are exactly the case where an async server earns its keep, and FastAPI is detected and started with `uvicorn` automatically.

`requirements.txt`:

```txt
fastapi>=0.115
uvicorn[standard]>=0.32
anthropic>=0.71
```

`main.py` — detection finds `app` and starts it with `uvicorn main:app --host 0.0.0.0 --port $PORT`:

```python
import json

from anthropic import AsyncAnthropic
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()
client = AsyncAnthropic()  # reads ANTHROPIC_API_KEY


class Prompt(BaseModel):
    message: str


@app.post("/api/chat")
async def chat(prompt: Prompt):
    async def events():
        try:
            async with client.messages.stream(
                model="claude-opus-5",
                max_tokens=64000,
                messages=[{"role": "user", "content": prompt.message}],
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception:
            # The status line is already sent — report failures in-band.
            yield f"data: {json.dumps({'error': 'generation failed'})}\n\n"

    # StreamingResponse sends the headers before the generator produces
    # anything, which is precisely what keeps us inside the 60-second window.
    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"cache-control": "no-cache"},
    )


@app.get("/healthz")
async def healthz():
    return {"ok": True}
```

> **If you must use Flask**, remember that the default `gunicorn` worker is synchronous: one worker holds one streaming response for its whole duration, and a second visitor waits. Give it threads with a `startCommand` in [`faable.json`](../build-requirements.mdx) — `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 8` — or use FastAPI as above.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

## Set your API key

Never commit it — an LLM key is a key to your bill:

```bash
faable deploy secrets set ANTHROPIC_API_KEY=sk-ant-…
```

Both SDKs read `ANTHROPIC_API_KEY` from the environment, so a bare `new Anthropic()` / `AsyncAnthropic()` picks it up with no wiring. See [Environment & Releases](../environment.mdx) for the variables Faable injects for you.

Put a rate limit in front of any endpoint that spends tokens, and authenticate it if it is not meant to be public — an open chat endpoint on the internet is somebody else's free model access, billed to you. [Faable Auth](../../auth/get-started.md) is included in the same subscription, and the [WAF](../security-waf.md) is already in front of your app.

## Things that surprise people

**A thinking model looks like a stall.** On Claude Opus 5 extended thinking is on by default and its content is _omitted_ from the stream, so nothing arrives until the reasoning finishes. Users read that as a hang. Either show a spinner from the moment you send the request, or opt into a readable summary:

```js
thinking: { type: 'adaptive', display: 'summarized' }
```

...and render those `thinking_delta` events differently from the answer.

**Keep a quiet stream warm.** Nothing in our stack cut a 12-second gap in testing, but browsers, corporate proxies and mobile networks are less patient. The `: ping\n\n` comment line in the Node example above costs nothing and removes the whole class of problem.

**Errors arrive after a `200`.** Once the headers are out, you cannot change the status code. Decide upfront how a failure is represented _inside_ the stream and handle it in the client — both examples above send an `error` event.

**Buffering is not a problem here, but it is elsewhere.** Faable delivers chunks as your app writes them; we verified SSE and plain chunked responses arriving ~0.13 s after the write. If you later put another CDN or proxy in front of the app, that is the layer to check first.

## What sleeping does and doesn't break

After 30 minutes with no requests on the Free plan — 2 hours on Hobby and Pro — your app scales to zero. The next request wakes it. What that means in practice:

- **The first request after a sleep is slower.** The container start is added to your time-to-first-byte, so it eats into the same 60-second window — one more reason to send the headers before calling the model rather than after.
- **Conversation history is gone.** Anything held in a module-level variable disappears on sleep and on every deploy. Persist it — see [Databases](databases.md).
- **Timers don't fire while asleep.** A nightly summarisation job needs an external trigger hitting an endpoint, not an in-process `setInterval`.

## Troubleshooting

- **`504` after exactly 60 seconds** — the app is waiting for the whole completion before answering. Stream, and write the headers before you call the model.
- **The response arrives all at once at the end** — something between your code and the browser is buffering. Check the client first: `fetch` with a reader streams, `await res.json()` does not.
- **Nothing happens for 20 seconds, then everything appears** — that is thinking with the default `display: "omitted"`. Show a spinner or switch to `"summarized"`.
- **The second visitor waits for the first** — a synchronous worker holding a stream. Use FastAPI, or add threads to `gunicorn`.
- **`401` from the API on the deployed app but not locally** — `ANTHROPIC_API_KEY` was never set as a secret; your laptop had it in the shell.
- **The app exits right at boot** — a missing secret. `os.environ["…"]` throws at import time; the logs name it.

## FAQ

### Can I host an AI chatbot or LLM app on Faable Deploy?

Yes. It is an ordinary web server that calls a model API. Push a Node.js or Python repo — no Dockerfile, no YAML — and it gets a public HTTPS URL with a valid certificate on the first deploy. The one design requirement is that it streams its responses.

### Does Faable Deploy support Server-Sent Events and streaming responses?

Yes, unbuffered. Chunks reach the client as your app writes them — measured at about 0.13 seconds from write to arrival, with a response streaming for over 90 seconds and 12-second gaps between chunks delivered intact.

### Why does my LLM app return a 504 on long generations?

Because it waits for the complete answer before sending any response headers. Faable allows 60 seconds for headers; after that the request is cut. Stream instead: send the headers first, then the tokens. There is no limit on how long the response body then takes.

### How long can a request take on Faable Deploy?

The 60-second limit applies to time-to-first-byte only. Once your app has sent its response headers, it can keep streaming for as long as it needs.

### Where do I put my Anthropic API key?

Set it as a secret — `faable deploy secrets set ANTHROPIC_API_KEY=…` — and let the SDK read it from the environment. Secrets are injected at runtime and never enter your git history or the build image.

### Which port should my LLM app listen on?

Read the `PORT` environment variable and bind `0.0.0.0`. Faable sets it and routes public HTTPS traffic to it.

## Related

- [Deploy FastAPI](guide-fastapi.md) · [Deploy Node.js Express](guide-express.md) · [Deploy Flask](guide-flask.md)
- [Deploy a Telegram Bot](guide-telegram-bot.md) · [Deploy a Discord Bot](guide-discord-bot.md) · [Deploy a Slack App](guide-slack-bot.md) — put a model behind a chat platform
- [Databases & SQLite](databases.md) — where conversation history belongs
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [What the Builder Expects](../build-requirements.mdx) — detection rules, the `$PORT` contract and `startCommand`
- [Add authentication to your app](../../auth/get-started.md) — put your chat endpoint behind a login
