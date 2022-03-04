# Deploy to Faable

We are going to configure continuous deploy in your github repo by creating a Github Action that will be run each time you commit a change to your `main` branch.

Create a file inside `.github/workflows` and name it `deploy.yaml`, configure the github action as follows:

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
          faable_api_key: ${{ secrets.FAABLE_API_SECRET }}
          faable_user: "<account_name>"
```

## Building your app

If your are developing a `typescript` or `next` app. If you have a `build` script it will be run by our Github action before your app is deployed. You can create it in your `package.json`.

```json
{
  "name": "app_name",
  "scripts": {
    "build": "<your build script here>"
  }
}
```

## Multi branch deployment

You can change the `main` branch and set it to any branch on your repo. Also you can enable multi branch deployment by creating multiple `.yaml` files and configure those independently.

A use case for this can be if you want to enable a `beta` version of your site with different environment vars.
