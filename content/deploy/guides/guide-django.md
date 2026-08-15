---
schema: faq
title: Deploy a Django App
description: Deploy a Django application to Faable Deploy from GitHub. Zero-config gunicorn start command, static files with WhiteNoise, environment variables, migrations, and 100% European hosting with a built-in WAF.
---

# Deploy a Django App 🐍

**Push your Django project to GitHub and Faable builds and runs it — no Dockerfile, no YAML, no `gunicorn` command to write.** The builder detects Django from your repo, installs your dependencies, and starts your app behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)). For a Django project the builder needs two things:

| It looks for                                        | Which gives it                                  |
| :-------------------------------------------------- | :---------------------------------------------- |
| `requirements.txt`, `pyproject.toml` or `Pipfile`   | Your dependencies — installed into a virtualenv |
| `manage.py` **plus** a package containing `wsgi.py` | Django itself → the start command below         |

When both are present the builder runs, with no configuration from you:

```bash
gunicorn <your_project>.wsgi:application --bind 0.0.0.0:$PORT
```

`gunicorn` is installed automatically if it isn't in your dependencies — though pinning it in `requirements.txt` is good practice.

## The one thing to get right: `$PORT`

Faable assigns your app a port at runtime and passes it as the `PORT` environment variable. The auto-detected start command already binds `0.0.0.0:$PORT`, so **a standard Django project needs no change at all**. You only have to think about it if you override the start command — in which case bind `0.0.0.0` and `$PORT`, never a hardcoded port.

## Prepare your project

### 1. Dependencies

```txt
# requirements.txt
Django>=5.0
gunicorn
whitenoise
psycopg[binary]   # if you use PostgreSQL
```

### 2. Allowed hosts and CSRF

Django refuses requests whose `Host` header isn't in `ALLOWED_HOSTS`. Read it from the environment so the same code works locally and on Faable:

```python
# settings.py
import os

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",") or []

# Django 4+ also checks the origin on unsafe requests
CSRF_TRUSTED_ORIGINS = [
    o for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o
]
```

Then set them as [environment variables](../environment.mdx) on the app:

```bash
faable deploy secrets set \
  ALLOWED_HOSTS=myapp.faable.link \
  CSRF_TRUSTED_ORIGINS=https://myapp.faable.link
```

Add your [custom domain](../domains/custom-domain.md) to both values when you attach one.

### 3. Static files

`gunicorn` serves your application, not your static assets. The standard solution is [WhiteNoise](https://whitenoise.readthedocs.io/), which serves them from the app process itself:

```python
# settings.py
import os

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # right after SecurityMiddleware
    # … the rest of your middleware
]

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
```

Collect them at build time with a `buildCommand` in `faable.json`:

```json
{
  "buildCommand": "python manage.py collectstatic --noinput"
}
```

### 4. Secrets and debug

Never ship `DEBUG = True` or a hardcoded `SECRET_KEY`:

```python
SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.environ.get("DEBUG", "0") == "1"
```

```bash
faable deploy secrets set SECRET_KEY=$(python -c "import secrets;print(secrets.token_urlsafe(50))")
```

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your Django repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop, for an ad-hoc deploy:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your app is live at `https://<app>.faable.link` with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## Database migrations

Migrations are **not** run automatically — an automatic migration on every deploy is a good way to lose data. Run them explicitly when a release needs them, from your machine against the production database:

```bash
DATABASE_URL=<your production url> python manage.py migrate
```

Faable Deploy does not provide a managed database; point `DATABASE_URL` at your own PostgreSQL (any EU provider) and set it as a secret.

## Choosing the Python version

The default is Python 3.11. Supported minors are **3.11 and 3.12** — pin one with a `runtime.txt`:

```txt
python-3.12
```

Or with `.python-version`, or `requires-python` in `pyproject.toml`. First match wins, in that order.

## Troubleshooting

- **Build fails resolving Django with a `Requires-Python` error** — Django 6.x requires Python ≥3.12, and the default on Faable is 3.11. Pin the version: add a `.python-version` file containing `3.12` (or `runtime.txt` with `python-3.12`) and push again.
- **`DisallowedHost` in the logs** — `ALLOWED_HOSTS` doesn't include the domain you're visiting. Add `<app>.faable.link` and your custom domain.
- **CSS and images 404** — static files weren't collected or WhiteNoise isn't in the middleware. Check both steps above.
- **Build fails with "no start command"** — the builder found your dependencies but not `manage.py` + a `wsgi.py` package. Either fix the layout or declare `startCommand` in `faable.json`.
- **`CSRF verification failed` on forms** — add your full origin (with `https://`) to `CSRF_TRUSTED_ORIGINS`.
- **The app boots then exits** — you overrode the start command with a hardcoded port. Bind `0.0.0.0:$PORT`.

## FAQ

### Do I need a Dockerfile to deploy Django on Faable?

No. Faable detects Django from `manage.py` plus a `wsgi.py` package and generates the `gunicorn` start command for you. A `Dockerfile` is only the escape hatch for stacks the buildpacks don't recognise — and note that if your repo has a `package.json`, that wins over the Dockerfile.

### How do I run `collectstatic` on Faable?

Set it as the `buildCommand` in `faable.json` so it runs at build time: `{"buildCommand": "python manage.py collectstatic --noinput"}`. Serve the result with WhiteNoise.

### Which Python versions does Faable support for Django?

3.11 and 3.12. The default is 3.11; pin the one you want with `runtime.txt` (`python-3.12`), `.python-version`, or `requires-python` in `pyproject.toml`. Note that Django 6.x requires Python ≥3.12, so on the latest Django you must pin `3.12` explicitly.

### Does Faable run my Django migrations automatically?

No, by design — automatic migrations on every deploy risk irreversible schema changes. Run `python manage.py migrate` explicitly against your production `DATABASE_URL` when a release needs it.

### Can I use Celery or background workers?

Faable Deploy runs **web services** — a process that serves HTTP on `$PORT`. A separate worker process type isn't supported today, so background jobs need an external runner or an in-process scheduler.

## Related

- [What the Builder Expects](../build-requirements.mdx) — full detection and start-command rules
- [Deploy Next.js](guide-next.md) · [Deploy FastAPI](guide-fastapi.md) · [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md)
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
