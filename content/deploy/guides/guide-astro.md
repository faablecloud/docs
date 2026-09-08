---
title: Deploy an Astro Site
description: Deploy an Astro site to Faable Deploy from GitHub. Zero-config static builds, the SSR adapter path, PUBLIC_ environment variables, and 100% European hosting with a built-in WAF.
---

# Deploy an Astro Site

**Push your Astro project to GitHub and Faable builds and serves it — no Dockerfile, no YAML.** The builder detects Astro from your `package.json`, installs your dependencies, runs `npm run build`, and serves the contents of `dist/` from Faable's shared static runtime behind automatic SSL at `https://<app>.faable.link`, hosted 100% in Europe.

Astro has two output modes, and **they deploy differently**. Which one you are on decides everything below, so check `astro.config.mjs` first.

## Static Astro — the default

If your config has no `output` (or `output: 'static'`), `astro build` writes real HTML files per page into `dist/`. That is the zero-config path:

1. The builder detects `astro` in your `dependencies` or `devDependencies`.
2. It installs, runs your `build` script, and ships **only `dist/`** to the static runtime — no Node.js process boots.
3. **SPA fallback stays off.** Astro builds a real file per route, so an unknown path 404s instead of rewriting to `index.html`. That is the correct behaviour for a multi-page site; it is not a bug.

Nothing else to do. Push and it is live.

## Server-rendered Astro — add a `start` script

If your config sets `output: 'server'` or `output: 'hybrid'` with an adapter such as [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/), `astro build` writes something else entirely:

```
dist/
├── client/           ← assets
└── server/
    └── entry.mjs     ← your server
```

**There is no `index.html` at the root of `dist/`.** If you deploy this with no `start` script, the build goes green, Faable serves `dist/` as a static directory, and every route — the homepage included — 404s. It looks like a successful deploy that serves nothing.

Add a `start` script so the builder runs your server instead of serving files:

```json
{
  "scripts": {
    "build": "astro build",
    "start": "node ./dist/server/entry.mjs"
  }
}
```

A `start` script switches the app to a Node.js container and disables static serving — which is exactly what you want here.

### Bind to `0.0.0.0`

The `@astrojs/node` standalone server reads `HOST` and `PORT` from the environment. Faable injects `PORT`; it does **not** set `HOST`, and the adapter's default is localhost, which nothing outside the container can reach. Set it once:

```bash
faable deploy secrets set HOST=0.0.0.0
```

Or configure it in the adapter and skip the variable. Either way, the rule is the [`$PORT` contract](../build-requirements.mdx#-the-port-contract): listen on `0.0.0.0` at `process.env.PORT`.

## Deploy

From the dashboard — the normal path:

1. Create a **Project** and an **App** in the [Faable Dashboard](https://dashboard.faable.com).
2. Click **Link repository** and pick your Astro repo.
3. Push to your release branch. Faable builds and takes it live.

Or from your laptop, for an ad-hoc deploy:

```bash
npm i -g @faable/faable
faable login
faable deploy
```

Your site is ready at `https://<app>.faable.link`, with automatic SSL and the [WAF](../security-waf.md) already inspecting traffic.

## Environment variables

Astro exposes variables prefixed `PUBLIC_` to client-side code, **compiled into the bundle at build time**. So:

- Set them **before** the build, with the [CLI](../../cli.md#secrets) or the dashboard, then redeploy.
- A `PUBLIC_` variable is **public** — it ships inside the JavaScript your visitors download. Never put a secret there.

```bash
faable deploy secrets set PUBLIC_SITE_URL=https://example.com
```

On a **static** site there is no server, so non-`PUBLIC_` variables only exist during the build. On a **server-rendered** site they are also readable at runtime through `import.meta.env` / `process.env`.

See [Environment & Releases](../environment.mdx).

## A different output directory

Faable expects the Astro default, `dist/`. If `astro.config.mjs` sets `outDir` elsewhere, the build fails the post-build check with `Static build output 'dist' not found after the build`. Drop the override, or force the static buildpack in `faable.json`:

```json
{ "buildpack": "static" }
```

## Monorepos

If the Astro site lives in a subdirectory, point `rootDir` at it in `faable.json` at the repository root:

```json
{ "rootDir": "apps/site" }
```

See [Monorepos](../build-requirements.mdx#monorepos-root-directory).

## Troubleshooting

- **The build is green but every route 404s** — you are on `output: 'server'` with no `start` script, so a server build is being served as static files. See [above](#server-rendered-astro--add-a-start-script).
- **A sub-page 404s on a static site** — that page was not built. Check your routes and any `getStaticPaths`. Astro deliberately does not rewrite unknown paths to `index.html`.
- **Requests time out on a server-rendered site** — the adapter is bound to localhost. Set `HOST=0.0.0.0`.
- **`Static build output 'dist' not found`** — `outDir` is not `dist/`, or the build wrote nothing.
- **A `PUBLIC_` variable is empty** — it was set after the build. Redeploy.

## Related

- [What the Builder Expects](../build-requirements.mdx) — detection rules, static frontends, the `$PORT` contract
- [Deploy Vite](guide-vite.md) — the SPA sibling, with rewrite-to-index on
- [Deploy Next.js](guide-next.md) · [Deploy Node.js Express](guide-express.md)
- [Migrate from Vercel](migrate-from-vercel.mdx) · [Migrate from Netlify](migrate-from-netlify.mdx)
- [Custom domains](../domains/custom-domain.md) · [WAF](../security-waf.md)
- [Add authentication to your app](../../auth/get-started.md) — Faable Auth is included in the same subscription
