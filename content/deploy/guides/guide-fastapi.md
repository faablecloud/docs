---
schema: faq
title: Deploy a FastAPI App
description: Deploy a FastAPI application to Faable Deploy from GitHub. Zero-config uvicorn start command, environment variables, async workers, and 100% European hosting with a built-in WAF.
---

# Deploy a FastAPI App ⚡

**Push your FastAPI project to GitHub and Faable builds and runs it — no Dockerfile, no YAML, no `uvicorn` command to write.** The builder detects FastAPI from your repo, installs your dependencies, and serves it behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)). For FastAPI the builder needs:

| It looks for                                      | Which gives it                                  |
| :------------------------------------------------ | :---------------------------------------------- |
| `requirements.txt`, `pyproject.toml` or `Pipfile` | Your dependencies — installed into a virtualenv |
| A module defining `app = FastAPI(...)`            | The ASGI entrypoint → the start command below   |

It searches for that module in this order, preferring the file that actually defines `app`:

`main.py` → `app.py` → `asgi.py` → `wsgi.py` → `application.py` → `server.py` → `app/main.py` → `app/app.py` → `src/main.py`

Then it runs, with no configuration from you:

```bash
uvicorn <module>:app --host 0.0.0.0 --port $PORT
```

`uvicorn` is installed automatically if it isn't in your dependencies — though pinning it is good practice.

## The one thing to get right: `$PORT`

Faable assigns your app a port at runtime and passes it as the `PORT` environment variable. The auto-detected command already binds `0.0.0.0` and `$PORT`, so a standard project needs no change. It matters only if you override the start command:

```python
# ✅ Correct — for local runs; on Faable the platform passes the port
import os
import uvicorn

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
```

Never hardcode `port=8000` in the command Faable runs — the app would start and receive no traffic.

## A minimal deployable app

```python
# main.py
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/healthz")
def healthz():
    return {"ok": True}
```

```txt
# requirements.txt
fastapi
uvicorn[standard]
```

That is a complete, deployable repo — two files.

## Configuration and secrets

Read configuration from the environment and set it with the [CLI](../../cli.md#secrets) or the dashboard:

```python
import os

DATABASE_URL = os.environ["DATABASE_URL"]
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",")
```

```bash
faable deploy secrets set DATABASE_URL=postgres://… ALLOWED_ORIGINS=https://myapp.faable.link
```

Faable also injects `PORT`, `FAABLE_APP_ID`, `FAABLE_RELEASE` and `FAABLE_GIT_COMMIT` — useful for `/healthz` payloads and error reports. See [Environment & Releases](../environment.mdx).

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your FastAPI repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your API is live at `https://<app>.faable.link` with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic. Interactive docs are at `/docs` if you left them enabled.

## Workers and concurrency

The auto-detected command runs a single uvicorn process, which is the right default: FastAPI is async, so one process handles many concurrent requests, and scaling up is usually a matter of picking a bigger [instance](../pricing.md#compute-catalog). If your workload is CPU-bound and you want multiple workers, declare it explicitly in `faable.json`:

```json
{
  "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4"
}
```

Only do this on an instance with enough CPU and RAM for the extra processes.

## Choosing the Python version

The default is Python 3.11. Supported minors are **3.11 and 3.12** — pin one with a `runtime.txt`:

```txt
python-3.12
```

Or with `.python-version`, or `requires-python` in `pyproject.toml`. First match wins, in that order.

## Troubleshooting

- **Build fails with "no start command"** — the builder installed dependencies but found no module defining `app = FastAPI(...)` in the search list. Rename your entrypoint to `main.py`, or set `startCommand` in `faable.json`.
- **The app starts but requests time out** — the start command binds a hardcoded port instead of `$PORT`.
- **CORS errors from your frontend** — add `CORSMiddleware` and drive its origins from an environment variable.
- **`ModuleNotFoundError` at boot** — the dependency isn't in `requirements.txt`; the build environment installs only what the manifest declares.
- **A `Dockerfile` is being used instead of the Python buildpack** — detection order puts `package.json` (Node) above Python and Python above `Dockerfile`. Force it with `{"buildpack": "python"}` in `faable.json`.

## FAQ

### Do I need a Dockerfile to deploy FastAPI on Faable?

No. Faable finds the module that defines `app = FastAPI(...)` and generates the `uvicorn` command for you. A `Dockerfile` is the escape hatch for stacks the buildpacks don't detect natively.

### How does Faable know which file my FastAPI app is in?

It checks `main.py`, `app.py`, `asgi.py`, `wsgi.py`, `application.py`, `server.py`, `app/main.py`, `app/app.py` and `src/main.py`, preferring the one that actually defines `app`. If yours lives elsewhere, set `startCommand` in `faable.json`.

### Can I run FastAPI with multiple uvicorn workers?

Yes — set `startCommand` in `faable.json` with `--workers N`. The default is a single process, which suits most async workloads; add workers only on an instance sized for them.

### Which Python versions does Faable support for FastAPI?

3.11 and 3.12. The default is 3.11; pin your choice with `runtime.txt` (`python-3.12`), `.python-version`, or `requires-python` in `pyproject.toml`.

### Does the built-in WAF interfere with API clients?

The WAF ships in monitor mode conventions described in the [WAF guide](../security-waf.md): review the logs before switching to block mode, because machine clients sometimes send payloads that trip generic OWASP rules. Exclusions are scoped per path, parameter or rule.

## Related

- [What the Builder Expects](../build-requirements.mdx) — full detection and start-command rules
- [Deploy Django](guide-django.md) · [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md)
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Secure your API with OAuth 2.0](../../auth/oauth-flows/client-credentials.mdx) — Faable Auth is included in the same subscription
