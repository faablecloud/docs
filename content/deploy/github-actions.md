# Github Actions

To configure continuous deployment every time code is pushed into your github repo, create a Github Action.

Following code creates an action that will be run each time you commit a change to `main` branch. You can change `main` branch and set it to any branch on your repo that you want to deploy.

Create a file inside `.github/workflows` directory and name it `deploy.yaml`, configure github action as follows:

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
      - run: npm ci
      - run: npx @faable/faable@latest deploy
```

## Build script

In cases where your are developing an app with a `build` step like a `typescript` or `next` app it is handled automatically if a `build` script is present in `package.json`. Check your `package.json`.

```json
{
  "name": "app_name",
  "scripts": {
    "build": "<your build script here>"
  }
}
```

If your build script has a name different than `build` use the flag `--npm_build_command` in the CLI to specify the desired script in action config.

## Deploy multiple environments

In order to test features or prefiew changes before releasing to production maybe want to deploy your project in multiple environments with different configurations.

A use case for be if you want to enable a `staging`, `beta` or `preprod` version of your site with different environment vars.

To solve this issue, create multiple Github actinons `.yaml` files and configure those to point to different **Faable Apps**.
