---
title: Runtime
description: Understand the Faable Deploy runtime environment. Learn about supported Node.js versions, environment variables, gunicorn and uvicorn workers and memory, and our automatic app manager.
---

# Runtime

This page describes how your app runs on Faable Deploy — the Node.js versions we support, how to set environment variables, and how we keep your app running.

## Node.js

Node versions adhere to Semver, the semantic versioning convention popularized by GitHub. Semver uses a version scheme in the form `MAJOR.MINOR.PATCH`.

Faable currently supports **Node.js 20, 22 and 24**. The version you request in `engines.node` is resolved to the latest release of that major at deploy time, and your app runs on Faable's runtime image for that major. Requesting a major outside the supported list fails the deploy.

## Specifying a Node.js Version

Always specify a Node.js version that matches the runtime that you’re developing and testing with. To find your version locally:

```bash
node --version
v20.9.0
```

To specify the version of Node.js to use on Faable, use the engines section of the `package.json`. Drop the v to save only the version number.

```json
{
  "name": "example-app",
  "description": "a really cool app",
  "version": "1.0.0",
  "engines": {
    "node": "20.x"
  }
}
```

> If a Node version isn't specified in the engines section, Faable uses the Node version wherever the deploy runs. Pin `engines.node` so every deploy uses the same version — see [What the Builder Expects in Your Repo](build-requirements.md).

## Environment variables

You can set environment variables for your App in the [Dashboard](https://dashboard.faable.com)

## Workers and memory

Python apps run a single gunicorn or uvicorn worker by default, and that is the right setting: leave the worker count to the start command Faable generates rather than adding `--workers`.

Every worker is a separate process that loads your whole app and its libraries. A Flask app that imports pandas, numpy and an AI SDK uses around 200 MB per worker, so two workers need twice that, and an app that outgrows its instance's memory is killed and restarted. For concurrency, use threads, which share memory (gunicorn `--threads`), or an async server such as uvicorn, where one process serves many requests at once.

On the Free plan instance (`bi.xs`, 512 MB) an app runs **at most one worker**. If the start command asks for more — `--workers 2`, `-w 4` or `WEB_CONCURRENCY` — Faable reduces it to one when the app starts and moves gunicorn's concurrency to threads, so `--workers 2 --threads 4` runs as `--workers 1 --threads 8`. The app's runtime log says so in a line that starts with `Faable:`.

To run more workers, upgrade to a paid plan and move the app to a larger instance from the [compute catalog](pricing.md#compute-catalog).

## App Manager

The app manager keeps apps running automatically; so operating your app is maintenance-free. The Runtime instantiates one app per region unless it is specified in redundancy options. In the case one app container craashes, make sure there's at least two app instances running. Otherwise app will be unresponsive for the restart period.

## Restarting

Faable Deploy Runtime implements an incremental restart policy for crashing apps.

- When an app crashes it will be continuously restarted.
- If an app keeps restarting for 5 minutes, it will be stopped and marked as crashed. Crashed apps must be restarted manually.

After an app exits, the App Manager restarts them with an exponential back-off delay (10s, 20s, 40s, …), that is capped at five minutes. Once an app has executed for 10 minutes without any problems, the manager resets the restart backoff timer for that app. In case the app keeps incrementing the back-off delay up to five minutes, it will be marked as crashed and needs to be restarted manually.
