---
title: Deploy from your own CI (GitHub Actions)
description: Faable deploys every push automatically — no GitHub Action needed. Use this guide only if you want to run the deploy from your own CI pipeline with custom steps.
---

# Deploy from your own CI

**You don't need a GitHub Actions workflow to deploy on Faable.** When you link
a repository to an app, push-to-deploy is enabled server-side: every push to
your deploy branch builds and deploys automatically, with build feedback posted
as a `faable/deploy` check on the commit. There is nothing to configure and no
CI minutes are spent.

This page is for teams that **want** to run the deploy from their own CI
instead — for example to run custom steps before deploying, or to control
exactly when a deploy happens.

> [!TIP]
> If all you want is "run my tests before deploying", you don't need your own
> deploy workflow either: keep push-to-deploy and ask us to enable the
> **wait-for-CI gate** for your app — the platform then deploys a commit only
> after all your CI checks pass, like Heroku's CI integration.

## How it works

The Faable CLI authenticates from GitHub Actions via **OIDC** and resolves the
app from the linked repository, so you **don't need an `app_id`, an API key, or
any secret**.

> [!IMPORTANT]
> Before your first deploy, **link the repository to your app** — once, from
> the [dashboard](https://dashboard.faable.com) (**Link repository**) or by
> running `faable deploy link` in your repo. If the repo isn't linked, `deploy`
> fails with `Request failed with status code 404`.
>
> An app deploys through **one** trigger: if your repo carries its own deploy
> workflow, make sure the app's push-to-deploy is not also active (linking a
> repo that already contains a Faable workflow keeps the workflow as the
> trigger automatically) — otherwise every push would deploy twice.

## Example workflow

Create a file inside `.github/workflows` (for example `deploy.yaml`):

```yaml
name: Deploy to Faable
on:
  push:
    branches:
      - main
permissions:
  id-token: write
  contents: write
  pull-requests: write
  issues: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
      # Your own steps go here: tests, lint, codegen…
      - run: npx @faable/faable@latest deploy
```

The same workflow works for every runtime — Node, Python, or Docker. `faable
deploy` detects your project type and, for Node projects, installs dependencies
automatically when `node_modules` is missing (`npm ci` with a lockfile,
`npm install` otherwise; `yarn` and `pnpm` lockfiles are honored when the tool
is available).

## Build script

If your app has a `build` step (TypeScript, Next.js, …) it is handled
automatically when a `build` script is present in `package.json`:

```json
{
  "name": "app_name",
  "scripts": {
    "build": "<your build script here>"
  }
}
```

If your build script has a different name, pass `--npm_build_command` to the
CLI to specify it.

## Deploy multiple environments

To test features or preview changes before releasing to production, deploy the
same repository to multiple **Faable apps** with different configurations
(`staging`, `beta`, `preprod`…): create one workflow file per environment and
point each one to a different app with `faable deploy <app_slug>`.

In a monorepo you can also filter which pushes deploy which app — for example
with [`turbo-ignore`](https://turbo.build/repo/docs/reference/turbo-ignore):

```yaml
- run: |
    if npx --yes turbo-ignore my-app; then
      echo "No changes affecting my-app — skipping deploy"
    else
      npx @faable/faable@latest deploy my-app
    fi
```
