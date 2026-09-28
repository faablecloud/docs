---
title: Deploy a Vite App
description: Deploy a Vite app (React, Vue, Svelte, Solid, Preact) to Faable Deploy from GitHub. Zero-config static builds, SPA routing, VITE_ environment variables, and 100% European hosting with a built-in WAF.
rank: high
---

# Deploy a Vite App

**Push your Vite project to GitHub and Faable builds and serves it — no Dockerfile, no YAML, no server.** The builder detects Vite from your `package.json`, installs your dependencies, runs `npm run build`, and serves the contents of `dist/` directly, with no container, behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

It works the same whether your Vite app is React, Vue, Svelte, Solid or Preact — detection keys on the `vite` dependency, not on the UI framework.

## What Faable does with a Vite repo

Nothing to configure. The builder:

1. Detects `vite` in your `dependencies` **or** `devDependencies`.
2. Installs your dependencies (including dev ones — `vite` itself lives there).
3. Runs your `build` script.
4. Serves **only `dist/`**, directly and with no container: no Node.js process boots, there is no cold start, files are compressed, and fingerprinted assets are cached for a year.
5. Turns on **SPA fallback** — a page route that isn't a file (`/settings/profile`) returns `index.html`, so React Router, Vue Router and friends work on a hard refresh. A missing file (`/assets/old.js`) still returns 404.

## You don't need a server

A Vite app is a folder of files once it is built, and serving that folder — with the SPA fallback — is what Faable does for you. So:

- **Don't write an Express server to serve `dist/`.** A `server.js` with `express.static('dist')` and a catch-all that sends `index.html` does exactly what Faable already does, and turns your site into a Node.js process that has to start before it answers.
- **You don't need a `start` script either.** Without one, Faable serves `dist/` statically. A `start` that only serves the build output — `vite preview`, `serve -s dist` — is recognized and served statically anyway.

A `start` script that runs your own code is a different thing: Faable runs it in a Node.js container, which is what you want when the app has a real backend next to the frontend (an Express API in the same repo, server-side rendering). If the backend is a separate app, keep the frontend static and call the API from the browser.

See [Start command precedence](../build-requirements.mdx#-nodejs-projects) for the full rule.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your Vite repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop, for an ad-hoc deploy:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your app is ready at `https://<app>.faable.link`, with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## Environment variables

Vite variables are **compiled into your bundle at build time**, not read at runtime, and only the ones prefixed `VITE_` are exposed to your code. Two consequences:

- Set them **before** you build, with the [CLI](../../cli.md#secrets) or the dashboard, then redeploy — changing a variable does not affect an already-built app.
- Anything in a `VITE_` variable is **public**. It ships inside the JavaScript your visitors download. Never put an API secret there; call a backend instead.

```bash
faable deploy secrets set VITE_API_URL=https://api.example.com
```

See [Environment & Releases](../environment.mdx).

## A different output directory

Faable expects the Vite default, `dist/`. If your `vite.config.js` sets `build.outDir` to something else, the build fails the post-build check with `Static build output 'dist' not found after the build`.

Either drop the override, or force the static buildpack and point it at your directory in `faable.json`:

```json
{ "buildpack": "static", "static": { "spa": true } }
```

## Monorepos

If the Vite app lives in a subdirectory, point `rootDir` at it in `faable.json` at the repository root:

```json
{ "rootDir": "apps/web" }
```

The builder installs from the workspace root (so hoisted dependencies resolve) and builds in your subdirectory. See [Monorepos](../build-requirements.mdx#monorepos-root-directory).

## Troubleshooting

- **The deployment fails as a startup crash right after a green build** — you have a `start` script. See [above](#do-not-add-a-start-script).
- **`Static build output 'dist' not found`** — your `build.outDir` is not `dist/`, or the build wrote nothing.
- **Every route except `/` 404s** — this should not happen on Vite (SPA fallback is on by default). If you forced the `static` buildpack, add `{ "static": { "spa": true } }`.
- **A `VITE_` variable is empty in the browser** — it was set after the build. Redeploy.
- **`npm ci` fails** — `package-lock.json` is out of sync with `package.json`. Commit an updated lockfile.

## Related

- [What the Builder Expects](../build-requirements.mdx) — detection rules, static frontends, the `$PORT` contract
- [Deploy Astro](guide-astro.md) — the static sibling, without SPA fallback
- [Deploy Next.js](guide-next.md) · [Deploy Node.js Express](guide-express.md)
- [Migrate from Vercel](migrate-from-vercel.mdx) · [Migrate from Netlify](migrate-from-netlify.mdx)
- [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
