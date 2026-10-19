---
title: Deploy from GitLab CI or Bitbucket Pipelines
description: Deploy to Faable from a GitLab or Bitbucket repository by running the Faable CLI in your own pipeline, authenticated with a project API key.
---

# Deploy from GitLab CI or Bitbucket Pipelines

Faable's push-to-deploy integration is built for GitHub today. If your code lives
on **GitLab** or **Bitbucket**, you can still deploy every push: run the Faable CLI
as a step of your own pipeline. The CLI uploads your source, Faable builds it
remotely, and the deployment shows the commit and branch it came from.

## Before you start

1. **Create the app** in the [dashboard](https://dashboard.faable.com) and copy its
   **App ID** (`app_…`) from the app's page. Your repository isn't linked to the app, so
   the pipeline names it with `--app`.
2. **Create an API key**: in the dashboard, go to project settings → **API Keys**.
   A key only works in the project it was created in.
3. **Store the key as a secret variable** named `FAABLE_API_KEY` in your CI (see
   below). The CLI reads it from the environment. Never commit it to the repository.

> [!WARNING]
> Anyone with the key can act on the project. Make the variable **masked** and
> **protected** (GitLab) or **secured** (Bitbucket) so it's hidden from logs and
> only reaches pipelines on protected branches. If it leaks, revoke it in the
> dashboard: it stops working within 30 seconds.

## GitLab CI

In your project, go to **Settings → CI/CD → Variables** and add `FAABLE_API_KEY`
with **Mask variable** and **Protect variable** checked. Then add a job to
`.gitlab-ci.yml`:

```yaml
deploy:
  stage: deploy
  image: node:22
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  script:
    # Your own steps go here: tests, lint, codegen…
    - npx @faable/faable@latest deploy --app app_xxxxxxxx
```

The `rules` line deploys only pushes to your default branch, and `$FAABLE_API_KEY`
is available to the job because that branch is protected.

## Bitbucket Pipelines

In your repository, go to **Repository settings → Pipelines → Repository variables**
and add `FAABLE_API_KEY` with **Secured** checked. Pipelines must be enabled for the
repository. Then add a branch pipeline to `bitbucket-pipelines.yml`:

```yaml
image: node:22

pipelines:
  branches:
    main:
      - step:
          name: Deploy to Faable
          script:
            # Your own steps go here: tests, lint, codegen…
            - npx @faable/faable@latest deploy --app app_xxxxxxxx
```

## What the deployment records

The CLI reads the commit and branch from GitLab's and Bitbucket's pipeline
variables, so each deployment in the dashboard shows the exact commit and branch
it was built from, along with the commit message. It needs `@faable/faable`
4.18.5 or later, which the `@latest` tag already gives you.

## Build and runtime

It is the same remote build as every other Faable deploy. You don't need Docker
in the pipeline or a `node_modules` directory, and the Node image above is there
only to run `npx`. Python and Docker projects deploy the same way. See
[What the Builder Expects](build-requirements.mdx) for how your project is detected,
and [Deploy from your own CI](github-actions.md) for build scripts, multiple
environments and monorepos. Those sections apply to any CI.
