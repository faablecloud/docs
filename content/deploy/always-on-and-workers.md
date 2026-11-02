---
title: Always on and background workers
description: Keep a Faable Deploy app from sleeping with Always on, or run a process with no web server — a queue consumer, a gateway bot, a poller — as a background worker that never sleeps. Set up from the dashboard, on Hobby and Pro.
---

# Always on and background workers

An app on Faable Deploy sleeps when no HTTP request has reached it for a while — **30 minutes on Free, 2 hours on Hobby and Pro** — and wakes on the next request. That is ideal for most web apps, and wrong for two kinds of work:

- an app that must answer **instantly, every time**, even the first request after a quiet night: use **[Always on](#always-on)**;
- a process that **receives no HTTP at all** — a queue consumer, a Discord or Telegram bot on a persistent connection, a poller, an in-process scheduler: run it as a **[worker](#workers)**.

Both are available on the **Hobby and Pro** plans, from the **Runs as** row of the app page.

## Always on

An always-on app keeps one instance running with or without traffic: it never sleeps, so no request ever waits for a cold start. It is still a web app, with its URL and domains.

To turn it on:

1. Open your app in the [dashboard](https://dashboard.faable.com). On the **Details** tab, find the **Runs as** row.
2. Switch on **Always on**.

The line under the row changes from _"Sleeps after 2 hours without requests"_ to _"Never sleeps"_. Switch it off to let the app sleep when idle again.

### Webhooks don't need it

A webhook — Stripe, GitHub, a mail provider forwarding replies — is an inbound HTTP request, so it **wakes a sleeping app by itself**. Turn on Always on only if the sender expects an answer faster than a cold start of a few seconds; otherwise acknowledge the request first and do the work after, as in the [Stripe webhooks guide](guides/guide-stripe-webhooks.md).

## Workers

A worker is an app that runs a process with **no web server**. It has no URL and never sleeps: Faable keeps **one instance** running at all times and restarts it if it crashes.

Use it for anything that works without being called: a consumer that reads a queue, a bot that holds a gateway connection (Discord, Slack Socket Mode, Telegram long polling), a scraper or a poller, `node-cron` or APScheduler inside the process.

### Run an app as a worker

1. Open your app in the [dashboard](https://dashboard.faable.com). On the **Details** tab, find the **Runs as** row.
2. Click **Worker**, and confirm.

The app keeps its code, variables, volumes and logs. What changes:

- **It stops serving HTTP**: its `*.faable.link` URL and its custom domains no longer answer. Click **Web app** in the same row to switch back at any time.
- **Its start command runs as is.** It does not have to listen on `$PORT`.
- **A new version replaces the old one by stopping it first**, so two copies never run at once — what a bot with one token needs. If your worker can safely run twice for a few seconds, switch on **Start the new version before stopping the old one** under the row, and a deploy will not stop it until the new version is up.
- A version is live once its process has been **running for 30 seconds without restarting**. A process that crashes in a loop is never promoted, and the previous version is started again.

If the build finds no web server — a `Procfile` with only a `worker:` line, or a chat bot — the app page says **This app looks like a worker** and offers **Run as a worker**.

### A web app and a worker from one repository

A worker is a whole app, with one start command. If your project has both — an API and the consumer of its queue — run them as **two apps**: the web one as it is, and a second one switched to **Worker** whose start command runs the worker. Since [`faable.json`](build-requirements.mdx) lives at the repository root, give the worker its own start command in one of two ways:

- a **separate repository** for the worker, or
- the same repository with the worker in a subdirectory that has its own `package.json` (its `start` script runs the worker), set as the worker app's **Root Directory** from the repository menu of its app page (**Change root directory**, which overrides a `rootDir` in `faable.json` for that app only) — and no `startCommand` in a root `faable.json`, which would apply to both apps.

Set the variables each app needs on each of them.

## Compute hours

What never sleeps — always-on apps and workers — uses the project's **compute hours**, measured in **GiB-hours**: the memory of the app's instance × the hours it runs. A project includes **365 GiB-hours a month on Hobby** (about 512 MB running all month) and **1,460 on Pro** (about 2 GB). Apps that sleep don't count.

## On the Free plan

Always on and Worker show in the **Runs as** row, switched off, with a link to the plan page. If a project goes back to Free, its always-on apps sleep again when idle and its workers are **paused** — nothing is deleted — and they run again by themselves when the project is on a paid plan.

## Related

- [Scheduled tasks and cron jobs](scheduled-tasks.md) — run a command on a schedule instead of keeping a process up
- [Runtime](runtime.md) — the start command and what the platform expects from your process
- [Deploy pricing](pricing.mdx) — what each plan includes
