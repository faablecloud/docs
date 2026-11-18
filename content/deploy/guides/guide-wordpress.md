---
schema: faq
title: Install WordPress
description: Install WordPress on Faable Deploy from the catalogue in a few minutes, hosted in Europe. Its files on a persistent volume, a managed MariaDB with daily backups, sign-in through Faable Auth, a WordPress firewall and its cron managed for you. From the dashboard, the CLI or your AI agent.
rank: high
---

# Install WordPress 📝

**WordPress is an app of the Faable catalogue: you pick it, give it a name and a title, and Faable installs and runs it for you.** It is not deployed from a repository. A few minutes later your site is live at `https://<name>.faable.link`, hosted in Europe, and you manage it from `wp-admin` like any WordPress.

## What you get

Every installation comes with what WordPress needs to keep its data, which a regular Faable app does not have:

- **A persistent volume** for the site's files (`wp-content`, uploads, plugins, themes), 10 GB per site, backed up every night.
- **A managed MariaDB** with TLS and daily backups. You never handle the password: WordPress receives the connection from the platform.
- **Sign-in through Faable Auth.** `wp-login.php` shows **Log in with Faable**, and the roles your users have in your Auth tenant decide what they can do in WordPress. See [WordPress sign-in with Faable Auth](../../auth/integrations/wordpress.md).
- **A WordPress firewall** at the edge, on top of the [platform's](../security-waf.md): XML-RPC, `wp-config.php` and its backups, debug logs, PHP in `uploads/` and user enumeration are blocked before they reach your site. XML-RPC is also turned off inside WordPress.
- **Its cron, managed.** WordPress runs scheduled posts and plugin jobs on page views, so a site that sleeps would never run them. Faable runs them every hour. See [WordPress cron](../scheduled-tasks.md#wordpress-cron).

## What it costs

WordPress needs a **Hobby or Pro** project, because the Free plan has no volumes and no databases. On top of the plan, its database is billed per month:

| Database tier | Price      | Connections | Backups kept |
| :------------ | :--------- | :---------- | :----------- |
| `db-s`        | 10 €/month | 15          | 7 days       |
| `db-m`        | 20 €/month | 40          | 30 days      |

A WordPress on Hobby is the Hobby plan (15 €/month) plus 10 € for a `db-s`. See [pricing](../../platform/pricing.mdx).

## Install it

### From the dashboard

Open your project, go to **Deploy › Installations** and click **Install an app**. Pick **WordPress**, then fill in:

- **Site title**. The site's app is named after it, and gets the address `https://<name>-xxxxx.faable.link`.
- **Language** (optional). Type to search it, by its own name, its English name or its code (`es_ES`).
- **Your domain** (optional): where the site lives in production, for example `www.example.com`. See [your own domain](#your-own-domain).
- **Database tier**: the one recommended for your plan is preselected.

You don't enter an admin email. **You are the site's first administrator**, with the email of your Faable account, which has to be verified. The **Sign-in with Faable Auth** card shows which Auth tenant of your project the site signs in with (a new one, named after the project, if it has none) and your email.

Click **Install WordPress**. The installation's page follows the install, which takes a few minutes.

### From the CLI

```bash
# What you can install, and what each app asks for
faable deploy install

faable deploy install wordpress \
  --input title="My blog" \
  --input locale=es_ES \
  --wait
```

The app is named after the title (`my-blog`); give it another name with `--name`. To install it on your own domain, add `--domain www.example.com`: the command prints the DNS record to create (see [your own domain](#your-own-domain)).

You are the administrator, by the verified email of the account you logged in with. To make someone else the administrator, add `--input admin_email=them@example.com`.

`--wait` returns when the site is ready and its address answers, with the URL. Add `--tier db-m` for the larger database and `--json` for scripts. See [the CLI](../../cli.md).

### From Claude, Cursor or any MCP client

With the [Faable MCP server](../../cli.md#mcp-server) connected and writes allowed, ask:

> Install WordPress in my project, titled "My blog", on www.example.com.

The agent uses `list_blueprints` to see what WordPress asks for and `install_blueprint` to install it. With a domain, it tells you the DNS record to create.

## After the install

- **Sign in**: open `https://<your-site>/wp-admin` and sign in with **Log in with Faable**, with your Faable account's email. If that email was new in the project's Auth tenant, you get an email there to set its password first.
- **Your domain**: if you didn't give one at install, add it to the app like any other. See [custom domains](../domains/custom-domain.md).
- **Plugins and themes**: install them from `wp-admin` as usual. They live on the volume and survive restarts and deploys.
- **WP-CLI**: run a command once with [`faable deploy run`](../scheduled-tasks.md#from-the-cli), for example `faable deploy run --app my-blog -- wp plugin list`.
- **Backups**: the volume and the database are backed up every night, and you can back them up, restore, export and import from their pages in the dashboard, or with `faable deploy volumes`.

## Your own domain

Give the domain at install and the site is born on it: WordPress's address, its links and its sign-in all use it. Its `faable.link` address keeps answering, and its links and `wp-admin` take you to your domain. Faable adds the domain to the app and issues its certificate.

**You have to configure the domain's DNS.** After installing, the installation's page shows the DNS record to create at your DNS provider (a `CNAME` to Faable, or the records for a bare domain). Until the domain points at Faable and its certificate is issued, the site does not load. The page follows the DNS on its own and says when the site is live. See [custom domains](../domains/custom-domain.md).

## Sleeping and waking

Like every Faable app, a WordPress with no visits for 2 hours scales to zero, and the next visit wakes it in a few seconds. Nothing is lost while it sleeps: its files are on the volume and its data in the database. The managed cron still runs every hour.

## FAQ

### Can I deploy WordPress from my own repository?

No. A repository deploy is refused with an explanation, because a regular app has neither a database beside it nor a persistent filesystem. Install it from the catalogue instead: it brings both.

### What happens when the volume fills up?

Each site has a 10 GB volume. From 80 % the dashboard warns you on the volume's page, and again when it goes over. Nothing stops and nothing is deleted: free space (old uploads, unused plugins) or move the project to a plan with more storage.

### Can I move an existing WordPress site to Faable?

Not on your own yet: importing a site is not part of the install. Write to [support](../../platform/support.md) and we help you move it, files to the volume and the database dump imported.

### What happens when I uninstall it?

The app is deleted. Its volume and its database are kept for 30 days, so the data is not lost if it was a mistake, and are then deleted with their backups. To delete the database and its backups at once, choose so in the uninstall dialog.

### Is it hosted in Europe?

Yes. The site, its files, its database and its backups stay in the EU.

## Related

- [WordPress sign-in with Faable Auth](../../auth/integrations/wordpress.md)
- [Web Application Firewall](../security-waf.md)
- [Scheduled tasks and WordPress cron](../scheduled-tasks.md)
- [Custom domains](../domains/custom-domain.md)
- [Deploy a PHP app](guide-php.md) (for PHP projects in your own repository)
