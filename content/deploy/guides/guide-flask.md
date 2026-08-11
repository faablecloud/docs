---
schema: faq
title: Deploy a Flask App
description: Deploy a Flask application to Faable Deploy from GitHub. Zero-config gunicorn start command, environment variables, static files, and 100% European hosting with a built-in WAF.
---

# Deploy a Flask App 🌶️

**Push your Flask project to GitHub and Faable builds and runs it — no Dockerfile, no YAML, no `gunicorn` command to write.** The builder detects Flask from your repo, installs your dependencies, and serves it behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)). For Flask the builder needs:

| It looks for                                      | Which gives it                                  |
| :------------------------------------------------ | :---------------------------------------------- |
| `requirements.txt`, `pyproject.toml` or `Pipfile` | Your dependencies — installed into a virtualenv |
| A module defining `app = Flask(...)`              | The WSGI entrypoint → the start command below   |

It searches for that module in this order, preferring the file that actually defines `app`:

`main.py` → `app.py` → `asgi.py` → `wsgi.py` → `application.py` → `server.py` → `app/main.py` → `app/app.py` → `src/main.py`

Then it runs, with no configuration from you:

```bash
gunicorn <module>:app --bind 0.0.0.0:$PORT
```

`gunicorn` is installed automatically if it isn't in your dependencies — though pinning it is good practice.

## The one thing to get right: `$PORT`

Faable assigns your app a port at runtime and passes it as the `PORT` environment variable. The auto-detected command already binds `0.0.0.0:$PORT`, so a standard project needs no change.

Note that `app.run()` is Flask's **development** server — Faable never calls it, and you shouldn't either in production. Keep it guarded for local use:

```python
import os

if __name__ == "__main__":
    # Local development only. On Faable, gunicorn serves the app.
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
```

## A minimal deployable app

```python
# app.py
import os
from flask import Flask

app = Flask(__name__)


@app.get("/")
def index():
    return {"status": "ok"}


@app.get("/healthz")
def healthz():
    return {"ok": True}
```

```txt
# requirements.txt
Flask>=3.0
gunicorn
```

That is a complete, deployable repo — two files.

## Configuration and secrets

Read configuration from the environment, never from committed files:

```python
import os

app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
```

Set them with the [CLI](../../cli.md#secrets) or the dashboard:

```bash
faable deploy secrets set SECRET_KEY=… DATABASE_URL=postgres://…
```

Faable also injects `PORT`, `FAABLE_APP_ID`, `FAABLE_RELEASE` and `FAABLE_GIT_COMMIT`. See [Environment & Releases](../environment.mdx).

## Static files and templates

Flask serves its own `static/` folder and Jinja templates from the app process, so both work unchanged — no extra configuration. For a heavier asset pipeline (a bundled frontend), build it at deploy time with a `buildCommand` in `faable.json`:

```json
{
  "buildCommand": "npm ci && npm run build"
}
```

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your Flask repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your app is live at `https://<app>.faable.link` with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## The application factory pattern

If you use `create_app()` instead of a module-level `app`, the builder can't detect an entrypoint — it looks for an assigned `app` object. Either expose one:

```python
# wsgi.py
from myapp import create_app

app = create_app()
```

…or declare the start command yourself in `faable.json`:

```json
{
  "startCommand": "gunicorn 'myapp:create_app()' --bind 0.0.0.0:$PORT"
}
```

## Workers

The default is a single gunicorn worker. Flask is synchronous, so a CPU-bound or slow-I/O app benefits from more:

```json
{
  "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT --workers 4"
}
```

Size the worker count to the [instance](../pricing.md#compute-catalog) you picked — more workers on a small instance will make things worse, not better.

## Choosing the Python version

The default is Python 3.11. Supported minors are **3.11 and 3.12** — pin one with a `runtime.txt`:

```txt
python-3.12
```

Or with `.python-version`, or `requires-python` in `pyproject.toml`. First match wins, in that order.

## Troubleshooting

- **Build fails with "no start command"** — no module in the search list defines `app = Flask(...)`. Use the factory pattern above or set `startCommand`.
- **The app runs locally but 502s on Faable** — you're relying on `app.run()`. Production is served by gunicorn; make sure the app object is importable at module level.
- **`Working outside of application context`** — code touching `current_app` or the database runs at import time. Move it inside a request handler or an app-context block.
- **`ModuleNotFoundError` at boot** — the dependency isn't in `requirements.txt`.
- **Requests time out** — the start command binds a hardcoded port instead of `$PORT`.

## FAQ

### Do I need a Dockerfile to deploy Flask on Faable?

No. Faable finds the module that defines `app = Flask(...)` and generates the `gunicorn` command for you. A `Dockerfile` is the escape hatch for stacks the buildpacks don't detect natively.

### How do I deploy a Flask app that uses an application factory?

Expose a module-level `app` (for example in `wsgi.py` with `app = create_app()`), or set `startCommand` in `faable.json` to `gunicorn 'myapp:create_app()' --bind 0.0.0.0:$PORT`.

### Does Faable use `app.run()` to start my Flask app?

No — `app.run()` is the development server. Faable starts your app with gunicorn bound to `0.0.0.0:$PORT`. Keep `app.run()` behind an `if __name__ == "__main__"` guard for local development.

### How many gunicorn workers should I run?

One by default. Increase it with `startCommand` only if your workload is CPU-bound or blocking, and size the count to the instance you picked from the [catalog](../pricing.md#compute-catalog).

### Which Python versions does Faable support for Flask?

3.11 and 3.12. The default is 3.11; pin your choice with `runtime.txt` (`python-3.12`), `.python-version`, or `requires-python` in `pyproject.toml`.

## Related

- [What the Builder Expects](../build-requirements.mdx) — full detection and start-command rules
- [Deploy Django](guide-django.md) · [Deploy FastAPI](guide-fastapi.md) · [Deploy Node.js Express](guide-express.md)
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
