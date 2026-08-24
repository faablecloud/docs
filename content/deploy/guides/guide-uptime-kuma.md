---
schema: faq
title: Deploy Uptime Kuma
description: Self-host Uptime Kuma on Faable Deploy by forking the repo — no Dockerfile, no config. Why you must pick MariaDB over SQLite, what scale-to-zero means for a monitor, and how to run it 24/7. 100% European hosting.
---

# Deploy Uptime Kuma 📈

**[Uptime Kuma](https://github.com/louislam/uptime-kuma) is a self-hosted status and uptime monitor, and it deploys on Faable straight from a fork — no Dockerfile, no YAML, nothing to edit.** Fork the repository, point an app at it, and the managed Node buildpack does the rest.

Two things about this particular app are worth deciding _before_ you deploy, because both are easier to get right now than to fix later: **where its data lives**, and **whether it is allowed to fall asleep**. This guide is honest about both.

## Fork it and deploy it

Deploying somebody else's open-source project, unmodified, is a supported and ordinary thing to do here:

1. Fork [`louislam/uptime-kuma`](https://github.com/louislam/uptime-kuma) to your own GitHub account.
2. In the [dashboard](https://dashboard.faable.com), create an app and connect it to your fork — the repository is chosen in the first step of the create form.
3. Deploy.

That is the whole build. Uptime Kuma ships a `package.json` with a `start` script, which is exactly what [detection](../build-requirements.mdx) looks for, so it builds with the managed Node buildpack and needs **no paid plan** to build.

You do not have to change a single file for it to boot, either. Uptime Kuma reads its port from `PORT` when it is set — `server/config.js` checks `UPTIME_KUMA_PORT`, then `PORT`, then falls back to 3001 — and Faable sets `PORT` for you. The [`$PORT` contract](../runtime.md) is satisfied out of the box.

## Decision 1: MariaDB, not SQLite

On first run Uptime Kuma asks you which database to use. **Choose MariaDB/MySQL and point it at a database outside the app. Do not choose SQLite.**

SQLite would put your entire monitor history in a file on the instance's disk, and that disk [does not survive](databases.md) a redeploy, a restart, or waking from sleep. The app would work perfectly and then quietly lose every monitor, every notification setting, and every minute of history the first time it restarts — including your admin account.

Uptime Kuma bundles the `mysql2` driver, so MariaDB and MySQL work natively with no code changes. Any managed MySQL-compatible database with an EU region will do; the setup screen asks for host, port, database name, username and password.

> This is not an Uptime Kuma quirk — it is how the platform works for every app. [Databases & SQLite](databases.md) covers the general rule and the free EU-hosted options.

## Decision 2: a sleeping monitor is not monitoring

This is the one that surprises people, so be clear-eyed about it.

On the **Free** plan an app sleeps after **two hours without inbound traffic** and wakes on the next real request. For most apps that is ideal — it costs nothing while idle. For a monitor it is a genuine limitation: **a sleeping Uptime Kuma is not running its checks.** It cannot poll your services, evaluate uptime, or send you a notification about an outage, because nothing of it is running to do so.

So pick the plan that matches what you actually want:

| You want                                                                | Plan             | What happens                                                             |
| :---------------------------------------------------------------------- | :--------------- | :----------------------------------------------------------------------- |
| A dashboard you open occasionally, checks running only while you use it | Free             | Sleeps after 2h idle; checks run only while awake                        |
| A monitor that actually watches your services around the clock          | **Hobby or Pro** | The app [runs 24/7 and never sleeps](../pricing.mdx) — checks never stop |

If continuous monitoring is the point, Hobby or Pro is the supported way to get it. Pinging your own app from somewhere else to keep it awake does not turn a Free app into a reliable monitor: the checks still only run when something happens to be poking it, you are paying for it in wake time either way, and you have built a monitor whose reliability depends on a second thing you also have to monitor.

## Sizing

Uptime Kuma is comfortable in a small instance, but it is a real Node server with a database connection and a scheduler. The free `bi.xs` (0.5 CPU · 1 GB) runs it; if you add a lot of monitors with short intervals, move up the [instance catalog](../pricing.mdx#instances).

## First run

The first request lands on `/setup-database`, where you pick MariaDB and enter the connection details. After that Uptime Kuma asks you to create the admin account — do this promptly, since until you do, whoever reaches the URL first can claim it.

Your app is served at `https://<app>.faable.link` with a valid certificate from the first deploy, behind the [WAF](../security-waf.md). You can add a [custom domain](../domains/custom-domain.md) whenever you like.

## Keeping your fork current

Uptime Kuma releases regularly. Because you deployed a fork, updating is a GitHub operation, not a Faable one: sync your fork with upstream, and the push triggers a new deploy automatically. Your data is untouched — it lives in the database, not in the app.

## Related

- [Databases & SQLite](databases.md) — why the filesystem is ephemeral, and where to put your data
- [Pricing and plans](../pricing.mdx) — sleep behaviour, instance sizes, what each plan includes
- [Build requirements](../build-requirements.mdx) — how detection picks the Node buildpack
- [Runtime and secrets](../runtime.md) — the `$PORT` contract and environment variables
