# Github Actions

To configure continuous deployment every time code is pushed into your github repo, create a Github Action.

Following code creates an action that will be run each time you commit a change to `main` branch. You can change `main` branch and set it to any branch on your repo that you want to deploy.

Create a file inside `.github/workflows` directory and name it `deploy.yaml`, configure github action as follows:

```yaml
name: Faable Deploy
env:
  FAABLE_APIKEY: ${{ secrets.FAABLE_APIKEY }}
on:
  push:
    branches: [main]
jobs:
  Deploy-Preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Faable CLI
        run: npm i -g @faable/faable
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          cache: "yarn"
      - run: yarn install --frozen-lockfile
      - name: Deploy Project to Faable
        run: faable deploy
```

## Configure `FAABLE_APIKEY` in Repository Secrets

Inside repo you want to deploy, go to Settings and create an **action secret** named `FAABLE_APIKEY`, you will found it in the [Dashboard](https://www.faable.com/dashboard).

## Building your app

In cases where your are developing an app with a `build` step like a `typescript` or `next` app it is handled automatically if a `build` script is present in `package.json`. Check your `package.json`.

```json
{
  "name": "app_name",
  "scripts": {
    "build": "<your build script here>"
  }
}
```

If your build script has a name different than `build`. Add `npm_build_command` configuration to your desired script in action config.

```yaml
name: Faable Deploy
env:
  FAABLE_APIKEY: ${{ secrets.FAABLE_APIKEY }}
on:
  push:
    branches: [main]
jobs:
  Deploy-Preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Faable CLI
        run: npm i -g @faable/faable
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          cache: "yarn"
      - run: yarn install --frozen-lockfile
      - name: Deploy Project to Faable
        run: faable deploy --npm-build-script your_build_script
```

## Deploy multiple environments

In order to test features or prefiew changes before releasing to production maybe want to deploy your project in multiple environments with different configurations.

A use case for be if you want to enable a `staging`, `beta` or `preprod` version of your site with different environment vars.

To solve this issue, create multiple Github actinons `.yaml` files and configure those to point to different **Faable Apps**.
