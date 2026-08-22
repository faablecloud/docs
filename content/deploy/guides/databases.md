---
schema: faq
title: Databases & SQLite
description: Where to store your app's data on Faable Deploy. Why the filesystem is ephemeral, what that means for SQLite, and how to connect a free EU-hosted database like Neon or Turso in minutes.
---

# Databases & SQLite 💾

**The short version: your app's filesystem on Faable is writable but ephemeral — anything written to disk is gone the next time your app is redeployed, restarted, or wakes from sleep. Keep your data in a database that lives outside the app.** This guide shows you how, with free EU-hosted options that take minutes to set up.

## Why files don't survive

Every deploy runs your app in a fresh instance, built from your latest artifact. The instance's disk is real and writable — temp files, caches and uploads all work — but it belongs to that instance, and instances are replaced:

- **On every deploy.** A new release means a new instance with a clean disk.
- **When your app sleeps.** After a couple of hours without traffic your app is put to sleep to free resources, and wakes automatically on the next request. Waking starts a fresh instance.
- **On restarts.** A crash or an out-of-memory kill restarts the app on a clean disk.

This is the same model as Heroku, Vercel and most modern platforms, and it is what makes deploys fast and rollbacks safe. But it means the disk is a scratchpad, not storage.

## What this means for SQLite

SQLite stores everything in a single file next to your code — `database.db`, `db.sqlite3`, `dev.db`. That's perfect for local development, and it's what many frameworks and AI code assistants reach for by default:

- Flask/Python: `sqlite3.connect("database.db")`
- Django: the default `DATABASES` setting points at `db.sqlite3`
- Node.js: `better-sqlite3`, `sqlite3`
- Prisma: `provider = "sqlite"` with a `file:./dev.db` URL

On Faable, that file lives on the ephemeral disk. **The app will deploy and run fine — and then silently lose every row when the instance is replaced.** If your app registers users, takes orders, or stores anything you'd miss, move that data out of the instance before you share the URL.

> We're exploring first-class persistence for SQLite apps. Today, the options below are the supported path — and they're genuinely good: both have free tiers and EU regions, matching your app's 100% European hosting.

## Option 1: Neon — serverless Postgres (recommended)

[Neon](https://neon.tech) is managed PostgreSQL with a generous free tier and EU regions (Frankfurt, and others). Postgres is the boring, correct choice for members, orders, and anything relational — and every framework speaks it.

1. Create a project in an EU region at [neon.tech](https://neon.tech) and copy the connection string.
2. Add it to your app as a [secret](../runtime.md) named `DATABASE_URL`.
3. Point your app at it.

**Flask / SQLAlchemy:**

```python
import os
from sqlalchemy import create_engine

engine = create_engine(os.environ["DATABASE_URL"])
```

```txt
# requirements.txt — add:
sqlalchemy
psycopg2-binary
```

**Django** — replace the default SQLite `DATABASES` block:

```python
import os
import dj_database_url

DATABASES = {"default": dj_database_url.config(default=os.environ["DATABASE_URL"])}
```

**Node.js:**

```js
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
```

**Prisma** — set `provider = "postgresql"` in `schema.prisma` and keep `url = env("DATABASE_URL")`.

## Option 2: Turso — keep SQLite, hosted

If your app is already written against SQLite and you'd rather not switch engines, [Turso](https://turso.tech) hosts your database as [libSQL](https://github.com/tursodatabase/libsql) — SQLite's dialect and semantics, served over the network. Free tier, EU regions available.

1. Create a database in an EU region and copy the database URL and auth token.
2. Add them as [secrets](../runtime.md): `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. Swap the local SQLite driver for the libSQL client:

**Node.js:**

```js
import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

await db.execute('SELECT * FROM orders')
```

**Python** — Turso's `libsql` package is a drop-in for the standard `sqlite3` module; see [Turso's Python quickstart](https://docs.turso.tech/sdk/python/quickstart) for the current connect call.

Your SQL, schema and queries stay exactly as they are — only the connection changes.

## What the disk IS good for

Ephemeral doesn't mean useless. The instance disk is the right place for:

- **Caches** — rendered pages, compiled templates, resized images you can regenerate.
- **Temp files** — an upload being processed before it's stored elsewhere.
- **Unpacked assets** — anything your build or boot step derives from the artifact.

The rule of thumb: if losing it would only cost you a recomputation, the disk is fine. If losing it would cost you data, it goes in a database.

## Troubleshooting

- **"My users/orders disappeared overnight"** — your app went to sleep and woke on a fresh instance. The data was in a file on the old instance's disk. Move it to a database; the data already lost is unfortunately not recoverable.
- **"It worked for days, then reset after I pushed a fix"** — same cause: the deploy replaced the instance. Data written to disk never survives a deploy.
- **SQLite file committed to the repo** — a `.db` file in your repository ships _inside_ the artifact, so every deploy resets the database to whatever state is committed. Remove it from the repo once you've moved to a hosted database.

## FAQ

### Can I use SQLite on Faable Deploy?

Yes — the file is created and works normally — but only for data you can afford to lose, like caches. The filesystem is ephemeral: the database file is deleted whenever your app is redeployed, restarted, or wakes from sleep. For real data, use a hosted database such as Neon (Postgres) or Turso (hosted SQLite).

### Why did my SQLite data disappear?

Your app's instance was replaced — by a deploy, a restart, or by sleeping after inactivity — and the new instance starts with a clean disk. Any file your app wrote, including its SQLite database, is gone. This is by design on Faable, as on Heroku and Vercel.

### Does Faable Deploy offer persistent disks or volumes?

Not today. The filesystem is ephemeral by design, which keeps deploys fast and rollbacks safe. We're exploring first-class persistence for SQLite apps; until then, connect a hosted database — the EU-hosted free tiers of Neon and Turso cover most projects.

### Which database providers work with Faable?

Any database reachable over the network: managed Postgres or MySQL, hosted SQLite/libSQL, MongoDB Atlas, Redis providers. For European hosting end to end, pick a provider with EU regions — Neon and Turso both offer them — and put the connection string in a [secret](../runtime.md).

### Do I need to change my code to use Turso instead of local SQLite?

Only the connection. Turso serves libSQL — SQLite's dialect — so your schema and queries stay the same. In Node.js you replace `better-sqlite3`/`sqlite3` with `@libsql/client`; in Python, Turso's `libsql` package is a drop-in for the `sqlite3` module.

## Related

- [Runtime](../runtime.md) — how your app runs, restarts, and secrets
- [Environment & Releases](../environment.mdx) — platform variables and release lifecycle
- [Deploy Flask](guide-flask.md) · [Deploy Django](guide-django.md) · [Deploy Node.js Express](guide-express.md)
- [Pricing](../pricing.md) — instance sizes and plans
