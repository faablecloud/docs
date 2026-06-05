---
title: Faable CLI
description: Master the Faable CLI to manage and deploy your applications from the terminal. Learn about installation, authentication, and deployment workflows.
---

# Faable CLI

The Faable CLI (`@faable/faable`) is your command-line interface for managing and deploying applications on the Faable platform. Whether you are building with Node.js or Docker, the CLI streamlines your development workflow from initialization to production.

> [!NOTE]
> While the Faable CLI is designed to support both **Faable Auth** and **Faable Deploy**, current functionality is primarily focused on deployment features.

## Installation

Install the Faable CLI globally using npm:

```bash
npm install -g @faable/faable@latest
```

Once installed, you can verify it by running:

```bash
faable --version
```

## Authentication

Before interacting with your projects, you need to authenticate your CLI session.

### Login

The `login` command opens your default browser to complete the authentication process. It uses a secure device flow.

```bash
faable login
```

> [!NOTE]
> For CI/CD, you don't need to log in at all — GitHub Actions authenticates via **OIDC** automatically.

### Whoami

Check which account is currently logged in:

```bash
faable whoami
```

### Logout

Clear your local credentials and end the session:

```bash
faable logout
```

## Project Setup

To link your local code with a Faable application, you can either initialize a new configuration or link an existing app.

### Init

Initialize a new Faable project in the current directory. This command can also help you set up GitHub Actions for automated deployment.

```bash
faable init
```

### Link

Link your current repository to one of your Faable apps. The CLI **auto-detects your Git remote origin** and prompts you to select the app from a list — you never need to look up an `app_id`.

```bash
faable link
```

This mirrors the dashboard's **Link repository** action. Linking requires the **Faable GitHub App** to be installed on the repository; if it isn't, the CLI tells you how to install it. Once linked, `faable deploy` and GitHub Actions resolve the app automatically.

## Deployment

Deploying your application is the core feature of the Faable CLI. It handles runtime detection (Node.js or Docker) and manages the build and upload process.

### Deploy

Deploy the current project to Faable.

```bash
faable deploy
```

The app is resolved automatically — no `app_id` required:

- **In GitHub Actions**: from the repository linked to your app, via OIDC.
- **Locally**: from the app saved by `faable link` (in `faable.json`).

Pass an app explicitly only for **monorepos** with several apps linked to the same repository:

```bash
faable deploy <app_id>
```

**What happens during deploy:**

1. **Runtime Detection**: The CLI checks for a `package.json` (Node.js) or `Dockerfile`.
2. **Environment Check**: Ensures your environment is ready for the build process.
3. **Build**:
   - For **Node.js**: The CLI prepares the production build.
   - For **Docker**: The CLI builds the image using your local Docker engine.
4. **Upload**: The built artifact or image is pushed to the Faable registry.
5. **Release**: A new deployment is created and goes live at your application URL.

## Command Reference

| Command              | Description                    |
| :------------------- | :----------------------------- |
| `faable login`       | Authenticate with Faable       |
| `faable apps`        | List all your applications     |
| `faable link`        | Link directory to a Faable app |
| `faable deploy`      | Deploy project to production   |
| `faable whoami`      | Show current user              |
| `faable auth status` | Check authentication status    |
