---
schema: faq
title: Install n8n
description: Self-host n8n on Faable Deploy from the catalogue, hosted in Europe. Always on for your schedules and webhooks, its data on a persistent volume and a managed Postgres with daily backups, and you as its owner from the first minute. From the dashboard, the CLI or your AI agent.
rank: high
---

# Install n8n 🔁

**n8n is an app of the Faable catalogue: you pick it, give it a name, and Faable installs and runs it for you.** It is not deployed from a repository. A few minutes later your n8n is live at `https://<name>.faable.link`, hosted in Europe, and you build workflows in its editor like in any self-hosted n8n.

## What you get

- **Always on.** Schedules and webhooks need n8n awake, so it never sleeps, even with no visits.
- **A managed Postgres** with TLS and daily backups, where n8n keeps your workflows, executions and credentials. You never handle its password.
- **A persistent volume** for n8n's own folder, 5 GB, backed up every night. It holds the key that encrypts your stored credentials, so the key and the data are backed up together.
- **You are the owner from the start.** Faable creates n8n's owner account with your email and a generated password before n8n is reachable, so nobody else can claim it from the setup page.
- **Webhooks on its own address.** Webhook and editor URLs point at your n8n's address.

## What it costs

n8n needs a **Hobby or Pro** project, because the Free plan has no volumes and no databases. On top of the plan:

- **Its database**: a `db-s` Postgres, **10 €/month** (15 connections, 7 days of backups).
- **Its compute hours.** An app that never sleeps uses the project's [compute hours](../always-on-and-workers.md), measured in GiB-hours: the memory it actually uses × the hours it runs. An idle n8n uses about 400–500 MB, so about **300–365 GiB-hours a month**, more while workflows run. Hobby includes 365 and Pro 1,460, shared with the project's other always-on apps and workers. Above them, each GiB-hour is billed at **0.02 €** with the next invoice.

On Hobby, an n8n alone in its project usually fits in the included hours; next to other always-on apps, expect a few euros a month on top. **The installer shows the estimate for your project** before you install: what n8n typically uses, what the project already uses this month, and what would go above the plan, in euros. The project's owners get an email at 80 % and 100 % of the included hours. See [pricing](../pricing.mdx).

## Install it

### From the dashboard

Open your project, go to **Deploy › Installations** and click **Install an app**. Pick **n8n**, give it a name and click install. The database tier is preselected.

You don't enter an email: **you are n8n's owner**, with the email of your Faable account, which has to be verified. The installation's page follows the install, which takes a few minutes.

### From the CLI

```bash
# What you can install, and what each app asks for
faable deploy install

faable deploy install n8n --name automations --wait
```

You are the owner, by the verified email of the account you logged in with. To make someone else the owner, add `--input admin_email=them@example.com`. `--wait` returns when n8n is ready, with its URL. See [the CLI](../../cli.md).

### From Claude, Cursor or any MCP client

With the [Faable MCP server](../../cli.md#mcp-server) connected and writes allowed, ask:

> Install n8n in my project and call it automations.

The agent uses `list_blueprints` to see what n8n asks for and `install_blueprint` to install it.

## After the install

1. Open the installation in the dashboard (**Deploy › Installations**) and click **Show initial password**.
2. Open your n8n's address and sign in with your Faable account's email and that password.
3. Change the password in n8n (**Settings › Personal**). From then on it is yours: Faable never sets it again.

Invite your team from n8n's own **Settings › Users**. n8n sends no email from Faable: copy the invitation link it shows and send it yourself.

## FAQ

### Can I deploy n8n from my own repository or Docker image?

Install it from the catalogue instead: a regular app has no persistent folder for n8n's encryption key and no database beside it, and it sleeps when idle, so schedules would not run.

### Which version of n8n do I get, and who updates it?

A stable n8n release, pinned and tested by Faable. Faable moves it to newer releases; you don't manage updates.

### Does anything happen during an update?

The new version starts before the old one stops, so for a few seconds both run. A schedule that fires in those seconds can run twice. Make workflows that must not run twice idempotent, or schedule them away from the hour mark.

### Can I bring back an n8n I uninstalled?

Not on your own yet. When you uninstall it, its volume and its database are kept for 30 days, so nothing is lost if it was a mistake: write to [support](../../platform/support.md) within those 30 days and we bring it back. To delete the database and its backups at once, choose so in the uninstall dialog.

### Is it hosted in Europe?

Yes. n8n, its volume, its database and its backups stay in the EU.

## Related

- [Databases](databases.md)
- [Always on and background workers](../always-on-and-workers.md)
- [Install WordPress](guide-wordpress.md)
