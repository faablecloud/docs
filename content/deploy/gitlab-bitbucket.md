---
title: Deploy from GitLab or Bitbucket
description: Deploy to Faable on every push from a gitlab.com project, with no pipeline to write — or run the Faable CLI in GitLab CI or Bitbucket Pipelines, keyless with OIDC on gitlab.com or with a project API key.
---

# Deploy from GitLab or Bitbucket

Faable's push-to-deploy works with **GitHub and gitlab.com**. Link a gitlab.com
project to an app and every push to its default branch builds and goes live, with
nothing to add to your repository. For **Bitbucket**, for **self-managed GitLab**,
or when you want your own steps (tests, lint) to run before the deploy, run the
Faable CLI as a step of your pipeline instead — see
[Deploy from your pipeline](#deploy-from-your-pipeline).

## Push to deploy from gitlab.com

1. In the [dashboard](https://dashboard.faable.com), create an app and choose
   **GitLab** under _Deploy from_. To link an app you already have, open it and click
   **Link repository**, then pick **GitLab**.
2. Click **Connect GitLab** and authorize Faable on gitlab.com.
3. Pick the project. The list shows the gitlab.com projects where you are at least
   **Maintainer**: Faable needs that role to add the deploy webhook.

Faable adds a webhook to the project and starts the first deploy. From then on,
every push to the project's default branch deploys, and the commit shows Faable's
status in GitLab: pending while it builds, then **Live on Faable** or failed.

From the CLI, `faable deploy link --app <app> --gitlab <project-id>` links an
existing app the same way, with the numeric Project ID shown on the project's page.
Connect your GitLab account in the dashboard first.

> [!NOTE]
> Faable reaches the project with the GitLab account that linked it. If that account
> loses Maintainer access or revokes Faable in GitLab, pushes stop deploying until
> someone links the project again from the app page.

## Deploy from your pipeline

Run the Faable CLI as a step of your own pipeline. The CLI uploads your source,
Faable builds it remotely, and the deployment shows the commit and branch it came
from. This works for GitLab (gitlab.com and self-managed) and Bitbucket.

### Before you start

1. **Create the app** in the [dashboard](https://dashboard.faable.com) and copy its
   **App ID** (`app_…`) from the app's page. Don't link the repository to the app:
   the pipeline names the app with `--app`, and a linked project would deploy each
   push twice.
2. **Create an API key**: in the dashboard, go to project settings → **API Keys**.
   A key only works in the project it was created in.
3. **Store the key as a secret variable** named `FAABLE_API_KEY` in your CI (see
   below). The CLI reads it from the environment. Never commit it to the repository.

> [!WARNING]
> Anyone with the key can act on the project. Make the variable **masked** and
> **protected** (GitLab) or **secured** (Bitbucket) so it's hidden from logs and
> only reaches pipelines on protected branches. If it leaks, revoke it in the
> dashboard: it stops working within 30 seconds.

### GitLab CI

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

#### Keyless with OIDC (recommended)

On **gitlab.com** you can skip the API key entirely. GitLab signs a short-lived
token for the job, and Faable exchanges it for access to **that one app**, so
there is no secret to store, rotate or leak.

1. Copy your GitLab **Project ID**, the number shown on the project's overview
   page (not its path).
2. Allow that project to deploy the app. It's a one-time step from your machine,
   with the CLI logged in:

   ```sh
   npx @faable/faable@latest deploy apps set --app app_xxxxxxxx --gitlab-project 12345678
   ```

3. Request the token in the job with `id_tokens`. The audience must be
   `https://faable.com`:

   ```yaml
   deploy:
     stage: deploy
     image: node:22
     id_tokens:
       FAABLE_ID_TOKEN:
         aud: https://faable.com
     rules:
       - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
     script:
       - npx @faable/faable@latest deploy --app app_xxxxxxxx
   ```

The trust is tied to the project's numeric ID, so renaming or moving the project
doesn't break it. A pipeline from any other project gets `403` and deploys
nothing. To revoke it, run `deploy apps set --app app_xxxxxxxx --gitlab-project ""`.
It needs `@faable/faable` 4.19.0 or later. Self-managed GitLab instances aren't
supported yet: use an API key there.

### Bitbucket Pipelines

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

### What the deployment records

The CLI reads the commit and branch from GitLab's and Bitbucket's pipeline
variables, so each deployment in the dashboard shows the exact commit and branch
it was built from, along with the commit message. It needs `@faable/faable`
4.18.5 or later, which the `@latest` tag already gives you.

### Build and runtime

It is the same remote build as every other Faable deploy. You don't need Docker
in the pipeline or a `node_modules` directory, and the Node image above is there
only to run `npx`. Python and Docker projects deploy the same way. See
[What the Builder Expects](build-requirements.mdx) for how your project is detected,
and [Deploy from your own CI](github-actions.md) for build scripts, multiple
environments and monorepos. Those sections apply to any CI.
