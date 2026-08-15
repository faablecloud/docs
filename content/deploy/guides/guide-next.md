---
schema: faq
title: Deploy a Next.js App
description: Deploy a Next.js application to Faable Deploy from GitHub. Zero-config build and start, automatic standalone output (~150 MB images), environment variables, monorepo support, and 100% European hosting with a built-in WAF.
---

# Deploy a Next.js App ▲

**Push your Next.js project to GitHub and Faable builds and runs it — no Dockerfile, no YAML, no server config.** The builder detects Next.js from your repo, runs `next build`, and serves it behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

## What Faable detects

Detection is file-based ([full rules](../build-requirements.mdx)). For a Next.js project the builder needs:

| It looks for                                   | Which gives it                             |
| :--------------------------------------------- | :----------------------------------------- |
| `package.json` with `next` in the dependencies | The framework → build and start commands   |
| A `build` script (the standard `next build`)   | Run at build time, with your env available |

With both present the builder runs `npm run build` and starts the app with the standard `next start` — no configuration from you. Repeat builds reuse a persistent build cache, so they are significantly faster than the first one.

## The one thing to get right: `$PORT`

Faable assigns your app a port at runtime and passes it as the `PORT` environment variable. **`next start` honors `PORT` out of the box, so a standard Next.js project needs no change at all.** It only matters if you run a custom server — bind `0.0.0.0` and `process.env.PORT`, never a hardcoded port.

## Standalone output — automatic

Faable builds your app with Next.js [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output): instead of shipping the full `.next` + `node_modules` (often over 1 GB), the deployed artifact contains `server.js` plus only the modules your app actually imports — typically **~150 MB**. Smaller artifacts mean faster deploys and faster cold starts.

This is applied automatically and falls back to the full output when your config isn't compatible (a custom `distDir`, your own `output` setting…). To opt out explicitly:

```json
// faable.json
{
  "next": { "standalone": false }
}
```

Declaring your own `startCommand` also disables it — you took control of how the container starts.

## Environment variables

Two kinds, and the difference matters in Next.js:

- **`NEXT_PUBLIC_*`** are inlined into the client bundle **at build time**. Set them as [environment variables](../environment.mdx) **before** pushing — a variable added after the build won't appear in the browser until the next deploy.
- **Server-side variables** (database URLs, API keys) are read at runtime and picked up on the next restart.

```bash
faable deploy secrets set NEXT_PUBLIC_API_URL=https://api.example.com DATABASE_URL=postgres://…
```

## Monorepos (Turborepo, npm workspaces)

If your Next.js app lives in a subdirectory (`apps/web`), set the **Root Directory** on the app — in the dashboard app settings, or in `faable.json`:

```json
{
  "rootDir": "apps/web"
}
```

Faable installs at the workspace root (so hoisted dependencies resolve) and builds the app in its subdirectory, with file tracing rooted correctly for standalone output.

## Choosing the Node.js version

The default is the platform's current Node LTS. Pin one with `engines` in `package.json`:

```json
{
  "engines": { "node": "22.x" }
}
```

Any valid semver range works; the builder resolves it to a concrete release.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your Next.js repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop, for an ad-hoc deploy:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your app is live at `https://<app>.faable.link` with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## Troubleshooting

- **A `NEXT_PUBLIC_*` variable is `undefined` in the browser** — it was set after the build. Set it and push again (build-time inlining is how Next.js works, not a Faable limitation).
- **The app boots then receives no traffic** — a custom server hardcodes its port. Bind `0.0.0.0` and `process.env.PORT`.
- **Build fails on a missing dependency that exists at the repo root** — set the Root Directory (see monorepos above) so the workspace install runs at the root.
- **Standalone didn't apply** — a custom `distDir` or `output` in `next.config.*` makes the builder fall back to the full profile. The app still deploys; the artifact is just larger.
- **Build succeeds locally but fails on Faable** — check the Node version: pin your local major with `engines.node`.

## FAQ

### Do I need a Dockerfile to deploy Next.js on Faable?

No. Faable detects Next.js from the `next` dependency in `package.json`, runs `next build`, and starts it with `next start` — with standalone output applied automatically. A Dockerfile is only the escape hatch for stacks the buildpacks don't recognise.

### How does Faable set the Next.js standalone output?

Automatically, for platform builds: the builder enables `output: "standalone"` and packages `server.js` with the traced module subset (~150 MB vs 1 GB+). Opt out with `{"next": {"standalone": false}}` in `faable.json`.

### Why is my NEXT_PUBLIC_ variable not showing up?

`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle when `next build` runs. Set them before deploying; changing one requires a new deploy to take effect in the browser.

### Can I deploy a Next.js app from a Turborepo monorepo?

Yes. Set the Root Directory to the app's subdirectory (dashboard setting or `rootDir` in `faable.json`). Faable installs at the workspace root and builds the app in its subdirectory.

### Which Node.js versions does Faable support for Next.js?

The default is the platform's current Node LTS. Pin any version with `engines.node` in `package.json` (e.g. `"22.x"`); the builder resolves it to a concrete release.

## Related

- [What the Builder Expects](../build-requirements.mdx) — full detection and start-command rules
- [Deploy Django](guide-django.md) · [Deploy FastAPI](guide-fastapi.md) · [Deploy Flask](guide-flask.md) · [Deploy Node.js Express](guide-express.md)
- [Environment & Releases](../environment.mdx) · [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
