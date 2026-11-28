---
schema: faq
title: Install Home Assistant
description: Run Home Assistant in the cloud on Faable Deploy, hosted in Europe. Always on for your automations, its history in a managed MariaDB with daily backups, its configuration on a persistent volume, and you as its owner from the first minute.
rank: high
---

# Install Home Assistant 🏠

**[Home Assistant](https://www.home-assistant.io) is an app of the Faable catalogue: you pick it, give it a name, and Faable installs and runs it for you.** A few minutes later it is live at `https://<name>.faable.link`, hosted in Europe, and you set it up from its own interface like any Home Assistant.

## Is it for you?

Home Assistant on Faable runs in the cloud, not in your home. **It works with integrations that reach their devices and services over the internet**: cloud integrations (Google Nest, Netatmo, tado°, ecobee, Tuya, Spotify and many more), webhooks, MQTT brokers reachable from the internet, the Home Assistant mobile app, calendars and weather.

It **cannot** reach what only lives on your home network:

- USB radios (Zigbee, Z-Wave, Thread), Bluetooth;
- local discovery (mDNS, SSDP, DHCP) of devices in your home;
- devices addressed by a local IP, unless you expose them to the internet yourself.

If most of your devices are local, run Home Assistant on a machine at home instead.

## What you get

- **Always on.** Automations, schedules and notifications run whether or not anyone has it open.
- **A managed MariaDB** with TLS and daily backups for its history (the recorder). You never handle its password.
- **A persistent volume** for `configuration.yaml`, your dashboards and settings, backups and the packages integrations install, 5 GB, backed up every night.
- **You are the owner from the start.** A new Home Assistant gives its owner account to whoever completes its onboarding first. Faable creates that account with your email and a generated password before Home Assistant is reachable, so nobody else can claim it. The rest of the onboarding (your home's location, units, analytics) is yours.
- **Ready behind the edge**: its web server trusts Faable's proxies, so it sees real visitor IPs, and its external URL is its own address, for the mobile app and notifications.

## What it costs

Home Assistant needs a **Hobby or Pro** project, because the Free plan has no volumes and no databases. On top of the plan:

- **Its database**: a `db-s` MariaDB, **10 €/month** (15 connections, 7 days of backups).
- **Its compute hours.** An app that never sleeps uses the project's [compute hours](../always-on-and-workers.md#compute-hours): the memory it actually uses × the hours it runs. An idle Home Assistant uses about 450–500 MB, so about **320–365 GiB-hours a month**, more with many integrations. Hobby includes 365 and Pro 1,460, shared with the project's other always-on apps. Above them each GiB-hour is 0.02 €. **The installer shows the estimate for your project** before you install.

## Install it

### From the dashboard

Open your project, go to **Deploy › Installations** and click **Install an app**. Pick **Home Assistant**, give it a name and click install. The database tier is preselected.

You don't enter an email: **you are the owner**, with the email of your Faable account, which has to be verified. The installation's page follows the install, which takes a few minutes.

### From the CLI

```bash
faable deploy install home-assistant --name home --wait
```

You are the owner, by the verified email of the account you logged in with. To make someone else the owner, add `--input admin_email=them@example.com`. See [the CLI](../../cli.md).

### From Claude, Cursor or any MCP client

With the [Faable MCP server](../../cli.md#mcp-server) connected and writes allowed, ask:

> Install Home Assistant in my project and call it home.

## After the install

1. Open the installation in the dashboard (**Deploy › Installations**) and click **Show initial password**.
2. Open your Home Assistant's address and sign in with your Faable account's email as the username and that password.
3. Finish the onboarding: your home's location, units and analytics.
4. Change the password in your **profile › Security**.

Add people from **Settings › People**. For the mobile app, use your Home Assistant's address as the server.

## Your configuration

`configuration.yaml` is yours. It starts with Home Assistant's defaults plus two lines that load the platform's settings: keep them.

```yaml
homeassistant:
  packages: !include_dir_named faable
```

They load `faable/platform.yaml`, which Faable rewrites on every start and points the history at the managed database. Don't edit that file, and don't add your own `recorder:` connection.

Home Assistant runs here without the Supervisor, so there are no add-ons (no File editor). Most settings live in the interface; for a change that needs YAML, write to [support](../../platform/support.md).

## FAQ

### Can I use my own domain?

Yes: add it to the app like any other ([custom domains](../domains/custom-domain.md)), then set it as the external URL in **Settings › System › Network**.

### Who updates Home Assistant?

Faable does. You get a stable release, pinned and tested, and Faable moves it to newer releases.

### Can I bring back a Home Assistant I uninstalled?

Yes, within 30 days, if you did not delete its database with it. Open the installation in the dashboard and click **Restore**, or run `faable deploy install restore`. It comes back with its configuration, its history and its users: sign in with the password you had.

### Is it hosted in Europe?

Yes. Home Assistant, its volume, its database and its backups stay in the EU.

## Related

- [Always on and background workers](../always-on-and-workers.md)
- [Install Uptime Kuma](guide-uptime-kuma.md)
- [Install n8n](guide-n8n.md)
