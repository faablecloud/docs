---
title: Scheduled tasks and cron jobs
description: Run a command of your app on a cron schedule on Faable Deploy — follow-up emails, reports, cleanups — even while the app sleeps. Set it up from the dashboard's Tasks tab or the CLI, on Hobby and Pro.
---

# Scheduled tasks and cron jobs

A **task** runs one command of your app — `node scripts/followups.js`, `python manage.py send_digest`, `npm run report` — with the code, variables and volumes of its live deployment, and stops when the command ends. A **schedule** runs a task on a cron expression.

Tasks do not need your app to be awake. A task runs in its own instance, so a schedule keeps firing while the app sleeps and nobody has it open: it is the way to send follow-up emails, process a queue every few minutes, or build a nightly report.

Tasks and schedules are available on the **Hobby and Pro** plans.

## From the dashboard

1. Open your app in the [dashboard](https://dashboard.faable.com) and go to the **Tasks** tab.
2. Under **Scheduled tasks**, fill in:
   - **Schedule (cron, UTC)** — for example `*/15 * * * *` for every 15 minutes. The form says it back in words before you save it.
   - **Command** — what to run, for example `node scripts/followups.js`.
   - **Name (optional)** — how the schedule shows in the list.
3. Click **Add schedule**.

The list shows each schedule in words, its next run, and why a run was skipped if one was. **Turn off** pauses a schedule without deleting it; **Delete** removes it. Under **Recent runs** you see the last 20 tasks of the app — scheduled and one-off — with their status. Open one to read its output: the last 32 KB are kept, shown from the end, and can be copied or downloaded.

## From the CLI

From your project directory (or with `-a <app>`), with the [Faable CLI](../cli.md):

```bash
# Every 15 minutes
faable deploy schedule add --cron "*/15 * * * *" -- node scripts/followups.js

# Weekdays at 07:00 UTC, with a name
faable deploy schedule add --cron "0 7 * * 1-5" -n digest -- npm run digest

faable deploy schedule list
faable deploy schedule disable <id>
faable deploy schedule enable <id>
faable deploy schedule rm <id>
```

Everything after `--` is the command, exactly as typed.

To run a command **once**, without a schedule — a migration, a backfill — use `faable deploy run`:

```bash
faable deploy run -- node scripts/migrate.js
```

It waits for the task and prints its output; `--no-wait` only queues it.

## How schedules run

- **Cron, in UTC**: five fields (minute, hour, day of month, month, day of week). Names such as `MON` and macros such as `@daily` are not accepted.
- **At most every 5 minutes.** For anything more frequent, run the loop inside a [worker](always-on-and-workers.md#workers).
- **No shell**: the command is split like a shell would split it, but pipes, `&&` and `$VARIABLES` are not expanded. To run several steps, put them in a script or an `npm run` script.
- **One run at a time per schedule.** If the previous run is still going when the next slot comes, that slot is skipped. Missed slots are not replayed later.
- **Up to 1 hour** per task (15 minutes by default, set with `--timeout` in seconds).
- **10 schedules per app on Hobby, 50 on Pro.**

## Task minutes

Each task counts its duration rounded up to the minute: a task of 5 seconds is one minute. A project includes **500 task minutes a month on Hobby** and **2,000 on Pro**, one-off and scheduled tasks together — including what an installed app runs, such as its setup and the WordPress cron below. The Tasks tab shows the minutes used this month.

## Deleting an app

Deleting an app — or the installation it belongs to — deletes its schedules and its task history with it. The minutes those tasks used this month still count.

## WordPress cron

A WordPress site runs its scheduled events (scheduled posts, plugin jobs such as backups or mail queues) on page views, so a site that sleeps would never run them. Faable keeps a schedule on every WordPress app that runs `wp cron event run --due-now` every 15 minutes. It shows in the Tasks tab as **Managed by Faable** and counts toward your task minutes like any task (each run is usually under a minute). It can't be changed or deleted on its own: deleting the installation deletes the app, and with it this schedule and the history of its runs.

## On the Free plan

The Tasks tab explains what tasks are and links to the plan page; schedules can't be created. If a project goes back to Free, its schedules stop running but are kept, and they resume by themselves when the project is on a paid plan again.

## Related

- [Always on and background workers](always-on-and-workers.md) — keep a process running instead of waking it on a schedule
- [Runtime](runtime.md) — the start command and what the platform expects from your process
- [Deploy pricing](pricing.mdx) — what each plan includes
