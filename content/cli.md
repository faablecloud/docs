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

**Options:**

- `--apikey <key>`: Authenticate using a pre-generated API Key (useful for CI/CD).
- `--token <token>`: Authenticate using an OIDC token.

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

Link your current directory to an existing Faable application. If no `app_id` is provided, the CLI will prompt you to select one from your account.

```bash
faable link [app_id]
```

The CLI automatically detects your Git remote origin and links it to the Faable project.

## Deployment

Deploying your application is the core feature of the Faable CLI. It handles runtime detection (Node.js or Docker) and manages the build and upload process.

### Deploy

Deploy the current project to Faable.

```bash
faable deploy [app_id]
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
