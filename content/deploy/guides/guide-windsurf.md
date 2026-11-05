---
title: Deploy from Windsurf
description: Connect Windsurf, now Devin Desktop, to Faable over MCP with one JSON entry and OAuth, then deploy from the agent and read your build logs. Hosted in the EU.
rank: high
---

# Deploy from Windsurf

**Connect Faable to Windsurf once and the agent can create your app, deploy it and read the build logs when something fails.** Your app runs in the EU at `https://<app>.faable.link` with free SSL.

> [!NOTE]
> Windsurf's documentation now calls the editor **Devin Desktop**, and its MCP configuration moved. This guide uses the current paths. If your editor still reads `~/.codeium/windsurf/mcp_config.json`, put the same entry there, with `serverUrl` instead of `url`.

## 1. Connect Faable

Add this to `~/.config/devin/mcp_config.json` (on Windows, `%APPDATA%\devin\mcp_config.json`), or to `.devin/mcp_config.json` in a repository to share it with your team:

```json
{
  "mcpServers": {
    "faable": {
      "url": "https://mcp.faable.com/mcp"
    }
  }
}
```

If you use the Devin CLI, this does the same:

```bash
devin mcp add -s user faable https://mcp.faable.com/mcp
```

## 2. Sign in

Find **faable** in the editor's MCP list and sign in, or run `devin mcp login faable`. If the server shows **Needs authentication**, click **Authenticate**.

Your browser opens the Faable consent screen, which shows what is being connected and asks you to choose **one project**. No key goes in the file, so `.devin/mcp_config.json` is safe to commit.

## 3. Deploy

**If your code is on GitHub**, open it in the editor and ask the agent:

> Deploy this repository to Faable and give me the URL.

The agent finds the repository, creates the app and waits until it is live. From then on, every push deploys on its own. By default it asks for your approval before each tool call.

**If it is a local folder**, you need the local server, which runs on your machine. Sign in once from a terminal:

```bash
npx -y @faable/faable login
```

Then add it next to the hosted entry:

```json
{
  "mcpServers": {
    "faable-local": {
      "command": "npx",
      "args": ["-y", "@faable/faable", "mcp", "--writes"]
    }
  }
}
```

And ask:

> Deploy this folder to Faable as a new app called my-app.

`deploy_directory` uploads the folder and builds it. `node_modules` and `.env` files stay out, and in a plain folder your `.gitignore` files apply. It only exists on the local server, because the hosted one cannot see your disk. Once the code is on GitHub, link the repository so a push deploys it.

## Things to ask once it is connected

| Ask                                          | What happens                                                                                     |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| "Why did my last deploy fail?"               | Reads the deployment and its build log, and says whether the cause is your code or Faable's side |
| "My app returns 500s. What do the logs say?" | Reads the runtime logs of the last 24 hours                                                      |
| "Which paths are failing?"                   | Reads the app's traffic: status codes, busiest and failing paths                                 |
| "Add app.example.com to my app"              | Attaches the domain and returns the CNAME to create at your DNS provider                         |
| "Deploy the latest commit"                   | Builds the deploy branch on Faable's servers and waits until it is live or failed                |
| "Who signed in to my app today?"             | Reads the logins of your [Faable Auth](/auth) tenant, if you use it                              |

For a value that really is secret, run `faable deploy secrets set NAME=value` in your own terminal. `The agent` can set secrets for you, and Faable never shows the value back, but anything you type in the chat has already gone through your AI provider.

## What it can and cannot do

- **The connection acts on one project**, the one you chose on the consent screen. It cannot reach your other projects.
- **The hosted server can read, deploy and make reversible changes**: create an app, set secrets, add a domain, change the deploy branch. It has no tool that deletes an app. The full list is in the [tool catalog](https://mcp.faable.com/tools.json).
- **Need reads only?** Connect to `https://mcp.faable.com/mcp?readonly=1` instead.
- **Logs are treated as data, not instructions.** Build output and commit messages can be written by anyone who can push, so they reach the agent marked as untrusted.
- **To disconnect**, open your [account page](https://faable.auth.faable.link/flow/account/security) and remove the app under **Connected apps**. It loses access within a minute.

The usual platform rules apply. Your app has to [serve HTTP on `$PORT`](../build-requirements.mdx), the Free plan builds Node.js, Python and PHP without a Dockerfile, and a Dockerfile needs Hobby or Pro.

## Troubleshooting

- **The server does not appear.** Check that the JSON is valid and that you edited the file your version reads (see the note at the top).
- **Needs authentication.** Click **Authenticate** to run the browser sign-in again.
- **A repository is missing from the list.** Faable only sees repositories the Faable GitHub App is installed on. Ask for your repositories again and the agent returns the install link.
- **`plan_required`.** The repository has a Dockerfile and the project is on Free. Remove the Dockerfile so the managed build applies, or move to Hobby.
- **The deploy failed.** Ask why. The answer says whether it is `user` (your code or configuration) or `platform` (Faable). The [build failures page](../build-failures.md) lists the common causes.

## Related

- [Deploy from Claude Code](guide-claude-code.md)
- [Deploy from Cursor](guide-cursor.md)
- [Deploy from Codex](guide-codex.md)
- [MCP server reference](../../cli.md#mcp-server): every tool, API keys and the guarantees of the server
- [Hosting AI agents in Europe](../ai-agents.mdx): if what you are deploying is itself an agent
- [Pricing](../pricing.mdx): what the Free plan includes
