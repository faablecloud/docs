---
schema: faq
title: Deploy a PHP App
description: Deploy PHP and Laravel to Faable Deploy from GitHub. Apache with mod_php and working .htaccess, composer install, PHP 8.2-8.4, a complete Laravel walkthrough with APP_KEY and a managed database, and 100% European hosting.
---

# Deploy a PHP App 🐘

**Push your PHP project to GitHub and Faable builds and runs it — no Dockerfile, no YAML, no start command to write.** Your app is served by **Apache with mod_php**, so the `.htaccess` you already have keeps working, behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

Two shapes are supported and both are zero-config: a **plain PHP** project (the `index.html` + `login.php` layout you'd drop into `htdocs`) and a **composer** project such as **Laravel** or **Symfony**, with its front controller in `public/`.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)):

| It looks for                                | Which gives it                                      |
| :------------------------------------------ | :-------------------------------------------------- |
| `composer.json`                             | A PHP project → `composer install` before packaging |
| Any `.php` in the repo root or in `public/` | A PHP project with nothing to install (plain PHP)   |

Then Apache is pointed at the first of these that holds an `index.php`, falling back to the repository root:

| Your layout                                 | Document root       |
| :------------------------------------------ | :------------------ |
| `public/index.php` — Laravel, Symfony, Slim | `public/`           |
| `public_html/index.php`                     | `public_html/`      |
| `web/index.php`                             | `web/`              |
| `.php` files in the repository root         | the repository root |

> [!NOTE]
> A `Dockerfile` beside your PHP project wins: the app keeps building from your own image. That is deliberate — PHP repositories that already ship one are running on it, and detection never re-platforms them. Force `"buildpack": "php"` in `faable.json` to take the managed runtime instead.

## The `$PORT` contract: nothing to do

Faable passes the port as the `PORT` environment variable, and the PHP runtime already binds Apache to it. Unlike Node or Python, there is no start command for you to write and nothing to change in your code.

## A minimal deployable app

```
my-site/
├── index.php
├── login.php
└── css/style.css
```

```php
<?php
// index.php — that's the whole configuration.
echo "Hello from PHP " . PHP_VERSION;
```

Push it and it's live. Sessions, `$_POST`, file uploads and `.htaccess` rewrites all work exactly as they do locally.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your PHP repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your app is live at `https://<app>.faable.link` with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## Laravel, end to end

A stock Laravel repository deploys with no changes to your code — but Laravel's own defaults assume a database is sitting next to the app, and on Faable it isn't. That's the whole of the work.

### What the builder does for you

```bash
composer install --no-dev --optimize-autoloader --no-interaction --no-progress
```

Your composer scripts run, so `artisan package:discover` executes and `vendor/` ships with the app. The document root is `public/`, which means `.env`, `storage/` and `vendor/` sit **outside** the web root where they belong.

### The environment it needs

A fresh Laravel ships `APP_KEY=` empty and points sessions, cache and queues at a database it expects to find locally:

```ini
APP_KEY=
APP_DEBUG=true
DB_CONNECTION=sqlite
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

Set them as [secrets](../runtime.md) before your first deploy. Generate a key locally with `php artisan key:generate --show`:

```bash
faable deploy secrets set \
  "APP_KEY=base64:…" \
  APP_ENV=production \
  APP_DEBUG=false
```

Then pick one of two paths:

**Without a database yet** — good enough to get the app up and see it working:

```bash
faable deploy secrets set SESSION_DRIVER=cookie CACHE_STORE=file QUEUE_CONNECTION=sync
```

**With a database** — the real setup. Point Laravel at a managed database and keep its defaults:

```bash
faable deploy secrets set \
  DB_CONNECTION=pgsql \
  DB_HOST=… DB_PORT=5432 DB_DATABASE=… DB_USERNAME=… DB_PASSWORD=…
```

Both `pgsql` and `mysql` work — the runtime ships `pdo_pgsql`, `pdo_mysql` and `mysqli`. See [Databases & SQLite](databases.md) for EU-hosted providers with free tiers.

### Migrations

There is no shell on the running app, so run migrations from your machine against the same managed database:

```bash
php artisan migrate --force
```

### What to leave alone

- **`APP_DEBUG=false`.** With debug on, a stack trace — including your environment — is served to whoever triggers the error.
- **`storage/`** is writable, but per-instance and temporary: logs and compiled views live there happily, user uploads do not (see below).
- Don't commit `.env`. It is never served, but a repository is not a secret store.

## Choosing the PHP version

Supported: **8.2, 8.3 and 8.4**. Resolution order, first match wins:

1. `.php-version`
2. `config.platform.php` in `composer.json`
3. `require.php` in `composer.json`
4. Default: `8.3`

Your **`composer.lock` also has a vote**: `composer install` obeys the lock, so if a locked package needs a newer PHP than your `composer.json` asks for, Faable resolves the higher version for you. A brand-new Laravel is exactly that case — it declares `"php": "^8.3"` while locking packages that require `>= 8.4.1`, and deploys on 8.4 without you doing anything.

To pin explicitly, add a `.php-version` file:

```
8.4
```

## What's in the runtime

On top of what the official PHP image includes (`curl`, `mbstring`, `openssl`, `session`, `sqlite3`/`pdo_sqlite`, `xml`…), the runtime ships:

`bcmath` · `exif` · `gd` · `intl` · `mysqli` · `opcache` · `pdo_mysql` · `pdo_pgsql` · `zip`

`mod_rewrite`, `mod_headers` and `mod_expires` are enabled, so `.htaccess` works as written. Defaults worth knowing: `memory_limit` 256M, `max_execution_time` 60s, `upload_max_filesize` and `post_max_size` 32M.

**`display_errors` is off.** Errors never reach your visitors; they go to the deploy logs with file and line:

```bash
faable deploy logs
```

An app that needs an extension outside that list ships its own `Dockerfile` (Hobby or Pro).

## Files that are never served

When the repository root is your document root, everything beside your PHP would otherwise be downloadable. The runtime denies dotfiles (`.env` first of all), `.sql`/`.sqlite`/`.db`/`.log`/`.ini`/`.sh`/`.yml` files, `composer.json`/`composer.lock`, `package.json`, `faable.json`, `Dockerfile`, `Procfile`, and the `vendor/`, `node_modules/` and `.git/` directories. Directory listings are off.

It is still better to keep non-public files out of the document root entirely — which is what a `public/` layout gives you for free.

## Data and files: what does not survive

Two things trip up PHP projects more than anything else, and neither shows up as a build error — the deploy succeeds and the app misbehaves later:

**There is no database next to your app.** `new mysqli("localhost", "root", "", "my_db")` — the XAMPP/WAMP default — has nothing to connect to. Use a managed database and read the credentials from the environment:

```php
$db = new mysqli(
    getenv('DB_HOST'),
    getenv('DB_USER'),
    getenv('DB_PASSWORD'),
    getenv('DB_NAME')
);
```

The build log warns you when it spots a localhost connection in your sources, so you find out at deploy time instead of from a blank page.

**The filesystem is ephemeral.** Conventional write targets (`uploads/`, `storage/`, `writable/`, `var/`, `bootstrap/cache/`…) are made writable when the app starts, which is what caches and temporary work need. But those writes live in the running instance only: they are lost on restart, on sleep/wake and on every deploy, and two instances never see each other's files. Anything a user uploads belongs in object storage (S3-compatible) or a database — never on disk.

## Troubleshooting

**A blank 500 on every page.** That's PHP failing with `display_errors` off, which is the correct production posture. `faable deploy logs` has the fatal with its file and line.

**"Database connection failed".** The app is trying to reach a database on `localhost`. Point it at a managed one (above).

**The build fails with "Problem 1… Problem 17" from composer.** Your `composer.lock` needs a PHP version the app isn't getting. Pin it with `.php-version`, or re-resolve the lock on the version you want with `composer update`.

**"This app would run on PHP X, but its installed dependencies require PHP Y".** The same thing, caught before shipping: the artifact would have run on a PHP its own `vendor/` cannot boot. The message names the package that raised the bar.

**WordPress.** Not supported, and the deploy says so rather than shipping a broken site: WordPress needs a MySQL database beside the app and a persistent filesystem for `wp-content/uploads`, and Faable gives an app neither.

## FAQ

### Do I need a Dockerfile to deploy PHP on Faable?

No. PHP is a managed buildpack like Node and Python: push a repository with a `composer.json` or with `.php` files and Faable detects it, installs your dependencies and serves it with Apache. Dockerfiles remain available on Hobby and Pro for apps that need an extension or a stack we don't ship.

### Which PHP versions does Faable support?

8.2, 8.3 and 8.4, with 8.3 as the default. Pin one in `.php-version` or in `composer.json`. Faable also reads your `composer.lock`, so a project whose locked dependencies need a newer PHP gets it automatically.

### Does `.htaccess` work on Faable?

Yes. The runtime is Apache with mod_php and `AllowOverride All`, with `mod_rewrite`, `mod_headers` and `mod_expires` enabled — the rewrite rules in Laravel's `public/.htaccess`, or in a hand-written LAMP app, are honoured as written.

### Can I deploy Laravel on Faable?

Yes, with no changes to your code. Set `APP_KEY`, `APP_ENV=production` and `APP_DEBUG=false` as secrets, and either connect a managed database or switch sessions, cache and queues off the database driver — Laravel's defaults expect a database that Faable does not run beside your app. The walkthrough is [above](#laravel-end-to-end).

### Why does my Laravel app say "Composer detected issues in your platform"?

Your `vendor/` was resolved for a newer PHP than the app is running. Faable now reads `composer.lock` when picking the version, so this resolves itself on a fresh deploy; if you pinned a version explicitly in `.php-version`, either raise the pin or re-resolve the lock with `composer update`.

### Can I use MySQL with a PHP app on Faable?

Yes — any database reachable over the network. The runtime ships `mysqli`, `pdo_mysql` and `pdo_pgsql`. What it does not do is run a database next to your app, so a connection to `localhost` will fail. See [Databases & SQLite](databases.md).

### Where do file uploads go?

Into the running instance's filesystem, which is temporary: uploads are lost on restart, on sleep/wake and on every deploy. For anything users expect to find later, upload to S3-compatible object storage or store it in your database.

## Related

- **[What the Builder Expects](../build-requirements.mdx)** — the detection rules in full, for every stack.
- **[Databases & SQLite](databases.md)** — where your data should live, with EU-hosted free tiers.
- **[Runtime](../runtime.md)** — environment variables, secrets, restarts and logs.
- **[Security & WAF](../security-waf.md)** — what Faable blocks at the edge before it reaches your app.
