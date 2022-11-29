# Github Actions

To configure continuous deployment every time code is pushed into your github repo, create a Github Action.

Following code creates an action that will be run each time you commit a change to `main` branch. You can change `main` branch and set it to any branch on your repo that you want to deploy.

Create a file inside `.github/workflows` directory and name it `deploy.yaml`, configure github action as follows:

```yaml
name: FaableCloud Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-to-faable:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: faablecloud/action-deploy@main
        with:
          faable_app_name: "<app_service_name>"
          faable_api_key: ${{ secrets.FAABLE_API_KEY }}
          faable_user: "<account_name>"
```

## Configure `FAABLE_API_KEY` in Repository Secrets

Inside repo you want to deploy, go to Settings and create an **action secret** named `FAABLE_API_KEY`, you will found it in the [Dashboard](https://www.faable.com/dashboard).

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
name: FaableCloud Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-to-faable:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: faablecloud/action-deploy@main
        with:
          faable_app_name: "<app_service_name>"
          faable_api_key: ${{ secrets.FAABLE_API_KEY }}
          faable_user: "<account_name>"
          npm_build_command: build_app
```

## Multiple branch deployment

npm_build_command: core.getInput("npm_build_command") || "build",
    npm_start_command: core.getInput("npm_start_command") || "start",
 Also you can enable multi branch deployment by creating multiple `.yaml` files and configure those independently.

A use case for this can be if you want to enable a `beta` version of your site with different environment vars.
