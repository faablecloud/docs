---
schema: faq
title: Install Uptime Kuma
description: Self-host Uptime Kuma on Faable Deploy from the catalogue, hosted in Europe. Always on so its checks never stop, its data in a managed MariaDB with daily backups, and you as its owner from the first minute. From the dashboard, the CLI or your AI agent.
rank: high
---

# Install Uptime Kuma 📈

**[Uptime Kuma](https://github.com/louislam/uptime-kuma) is an app of the Faable catalogue: you pick it, give it a name, and Faable installs and runs it for you.** A few minutes later your monitor is live at `https://<name>.faable.link`, hosted in Europe, and you add monitors and status pages in its dashboard like in any self-hosted Uptime Kuma.

## What you get

- **Always on.** A monitor has to run its checks whether or not anyone opens it, so Uptime Kuma never sleeps.
- **A managed MariaDB** with TLS and daily backups, where Uptime Kuma keeps your monitors, their history, your notifications and status pages. You never handle its password, and there is no database setup screen.
- **You are the owner from the start.** A new Uptime Kuma gives its admin account to whoever opens it first. Faable creates that account with your email and a generated password before Uptime Kuma is reachable, so nobody else can claim it.
- **Ready behind the edge.** Real visitor IPs in its logs and login protection, and links in notifications that point at its own address.
- **A small persistent volume** for uploaded status-page logos, backed up every night.

Uptime Kuma 2 runs on the `slim` image, so browser-engine monitors (Chromium) are not available. HTTP, keyword, JSON query, TCP port, DNS and push monitors all work.

## What it costs

Uptime Kuma needs a **Hobby or Pro** project, because the Free plan has no databases and its apps sleep. On top of the plan:

- **Its database**: a `db-s` MariaDB, **10 €/month** (15 connections, 7 days of backups).
- **Its compute hours.** An app that never sleeps uses the project's [compute hours](../always-on-and-workers.md#compute-hours): the memory it actually uses × the hours it runs. Uptime Kuma is light, about 130 MB with a handful of monitors, so about **90 GiB-hours a month**. Hobby includes 365 and Pro 1,460, shared with the project's other always-on apps. **The installer shows the estimate for your project** before you install.

## Install it

### From the dashboard

Open your project, go to **Deploy › Installations** and click **Install an app**. Pick **Uptime Kuma**, give it a name and click install. The database tier is preselected.

You don't enter an email: **you are the owner**, with the email of your Faable account, which has to be verified. The installation's page follows the install, which takes a few minutes.

### From the CLI

```bash
faable deploy install uptime-kuma --name status --wait
```

You are the owner, by the verified email of the account you logged in with. To make someone else the owner, add `--input admin_email=them@example.com`. `--wait` returns when Uptime Kuma is ready, with its URL. See [the CLI](../../cli.md).

### From Claude, Cursor or any MCP client

With the [Faable MCP server](../../cli.md#mcp-server) connected and writes allowed, ask:

> Install Uptime Kuma in my project and call it status.

## After the install

1. Open the installation in the dashboard (**Deploy › Installations**) and click **Show initial password**.
2. Open your Uptime Kuma's address and sign in with your Faable account's email as the username and that password.
3. Change the password in **Settings › Security**, and turn on two-factor authentication there if you want it.

Then add your monitors and, if you want one, a status page. To publish a status page on your own domain, add the domain to the app like any other ([custom domains](../domains/custom-domain.md)).

## FAQ

### Do the checks keep running when nobody has the dashboard open?

Yes. Uptime Kuma is installed always on: it never sleeps, so its checks and notifications run around the clock.

### Who updates Uptime Kuma?

Faable does. You get a stable Uptime Kuma 2 release, pinned and tested, and Faable moves it to newer releases.

### I deployed Uptime Kuma from a fork before. Should I move?

Install it from the catalogue: it comes with its database, never sleeps and is updated for you. Your fork's database is yours, so you can keep both running while you recreate your monitors in the new one.

### Can I bring back an Uptime Kuma I uninstalled?

Yes, within 30 days, if you did not delete its database with it. Open the installation in the dashboard and click **Restore**, or run `faable deploy install restore`. It comes back with its monitors, its history and its users: sign in with the password you had.

### Is it hosted in Europe?

Yes. Uptime Kuma, its database and its backups stay in the EU. Its checks run from the EU too.

## Related

- [Always on and background workers](../always-on-and-workers.md)
- [Install n8n](guide-n8n.md)
- [Databases](databases.md)
