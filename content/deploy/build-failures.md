---
title: Why a deployment failed
description: Every failed deployment on Faable carries a short failure code — detect_monorepo, static_output_missing, runtime_crashloop… This page says what each one means, whether it is something in your repository or something on our side, and how to fix it.
---

# Why a deployment failed

When a deployment fails, the dashboard shows a short code next to it — `detect_monorepo`, `static_output_missing`, `runtime_crashloop`. The code names **what failed**; **Why did this fail?** next to it shows the full message, and the build output is one click away under **View build logs**, or from your terminal:

```bash
faable deploy logs --build -d <deployment_id> -a <app_id>
```

Each code below says what it means, how to fix it, and whose it is. Most are something in the repository only you can change. The ones marked **On our side** are not: there is nothing to fix in your code — redeploy, and write to support@faable.com if it keeps happening.

These codes describe a deployment that **started and failed**. A request the API refuses outright — a domain already taken, a plan limit on create — answers with an [API error code](errors.md) instead.

## Detecting your project

The builder decides how to build your app from the files in your repository. [What the Builder Expects](build-requirements.mdx#how-detection-works) lists exactly which files it looks for.

### `detect_monorepo`

Nothing at the root of your repository tells the builder how to build it, **but a subdirectory would build** — a `backend/` with a `requirements.txt`, a `frontend/` with a `package.json`. The failure message lists the subdirectories it found.

**Fix:** set the app's **Root Directory** to the folder you want to deploy, and redeploy:

- In the dashboard: on the app page, the **⋮** menu of the **Repository** section → **Change root directory**.
- From the CLI: `faable deploy apps set --root-dir backend`.
- Or in the repository: `{ "rootDir": "backend" }` in a `faable.json` at the repository root.

One app deploys one folder. To deploy both a frontend and a backend from the same repository, create two apps linked to it, each with its own Root Directory. See [Monorepos](build-requirements.mdx#monorepos-root-directory).

### `detect_no_buildpack`

Nothing in the repository tells the builder how to build it: no `package.json`, no `requirements.txt` / `pyproject.toml` / `Pipfile`, no `composer.json` or `.php` files, no `index.html`, and no `Dockerfile`. The failure message lists the files it did find.

**Fix:** add the manifest of your stack at the root of the repository (or at the Root Directory, if you set one) and push. If your app lives in a subfolder, set the [Root Directory](#detect_monorepo).

### `detect_nothing_to_build`

The repository holds only what GitHub or GitLab creates with a new repository — a `README.md`, a `LICENSE`, a `.gitignore` — so there is no code to build yet.

**Fix:** push your code. The next push deploys it.

### `detect_entrypoint`

The builder recognised your stack and installed your dependencies, but could not work out **how to start your app**: a Python project with no FastAPI, Flask or Django app it could find, or a PHP project with no web entrypoint.

**Fix:** declare the start command, either as `"startCommand"` in `faable.json` or as a `web:` line in a `Procfile`. The command must listen on `0.0.0.0:$PORT` — see [The Port Contract](build-requirements.mdx#the-port-contract).

## Your source

### `source_empty`

The commit being deployed has no files at all — usually a repository that was just emptied, or a first commit with nothing in it.

**Fix:** push a commit with your code.

### `source_rejected`

The build could not get every file the repository references. Today this is **Git LFS**: GitHub would not hand over one or more LFS objects (missing, over quota, or refused). The message names the files.

**Fix:** check those files are actually stored in LFS on GitHub (`git lfs push --all origin`) and that the repository's LFS quota is not exhausted, then redeploy.

<a id="source_truncated"></a><a id="source_layout"></a>

### `source_truncated` · `source_layout`

**On our side.** The archive of your source arrived cut short, or in a shape the builder did not expect. Nothing in your repository causes this. Redeploy.

## The build

### `static_output_missing`

Your project was detected as a static site (Vite, Create React App, Vue, Angular, Astro, Gatsby) and the build ran, but **the output folder is not there** — no `dist/` (or `build/`, `public/`…) after `npm run build`.

**Fix:** check that your `build` script writes to the folder your framework normally uses. A custom `outDir` in your Vite or Astro config, or a build script that does something else, moves it. See [Static Frontends](build-requirements.mdx#static-frontends).

### `static_output_is_server`

The build produced a **server**, not a static site — for example Astro with `output: 'server'` or an SSR adapter. A server build has nothing for the static runtime to serve.

**Fix:** either build a static site (remove the SSR adapter or set `output: 'static'`), or keep the server build and add a `start` script to `package.json` that runs it, so it deploys as a Node.js server. The failure message gives the exact `start` line for your build.

### `runtime_version_incompatible`

A dependency does not support the Python version the build used — its `Requires-Python` excludes it, or it has no ready-made build for it and building it from source failed. Common on a Python release that is only a few months old.

When the version was Faable's default (you did not pin one), the build is **retried automatically on the previous minor**, and you only see this code if that retry fails too.

**Fix:** pin a version your dependencies support — `python-3.13` in `runtime.txt`, or `3.13` in `.python-version` — or upgrade the dependency. See [Runtime Versions](build-requirements.mdx#runtime-versions).

### `artifact_too_large`

The built app is larger than your plan allows. The message names the size it reached and the limit. See [Build artifact size](pricing.mdx#build-artifact-size) for the limits and what usually makes a build large.

### `builder_timeout`

**On our side**, as a rule. The build ran longer than a build is allowed to. Redeploy. If it times out again at the same step — the build output shows the last one that ran — a dependency being compiled from source or a build step waiting on something that never answers is the usual reason; write to support@faable.com with the deployment id.

### `registry_rate_limited`

**On our side.** A container registry (usually Docker Hub) refused to serve a base image because of its rate limit. Nothing in your `Dockerfile` causes this. Redeploy in a few minutes.

## Starting your app

The build succeeded and the container was started, but it never served a request.

### `runtime_crashloop`

The app **exits as soon as it starts**, again and again. **Why did this fail?** shows the last lines your process printed before it died — that is where the cause is. The usual ones:

- a dependency that is imported but not in `package.json` / `requirements.txt` (`Cannot find module`, `ModuleNotFoundError`),
- a required environment variable that is not set — add it under **Variables**,
- a start command that runs and finishes instead of serving.

**Fix:** correct it in the repository or in the app's variables and redeploy. To reproduce it, run the same start command locally with the same variables.

### `ready_timeout`

The container started but **never became ready** within the time allowed. Almost always the app is not listening where the platform expects it.

**Fix:** listen on `0.0.0.0` at the port in `$PORT` — not `localhost`, and not a fixed port like `3000` or `8000`. See [The Port Contract](build-requirements.mdx#the-port-contract). If it does listen there, the runtime logs show what it was doing instead.

<a id="status_timeout"></a><a id="runtime_lost"></a>

### `status_timeout` · `runtime_lost`

**On our side.** The deployment never reported a status, or what was running it went away before it became ready. Redeploy.

## Related

- **[What the Builder Expects](build-requirements.mdx)** — the files detection looks for, per stack, and `faable.json`.
- **[API error codes](errors.md)** — the errors the Deploy API answers with.
- **[Runtime](runtime.md)** — how your app runs once it is deployed.
