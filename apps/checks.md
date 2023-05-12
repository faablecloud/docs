# Checks

Faable can be configured to run checks to test our code against failures. It is used to ensure availiability of deployed services.

All Faable Apps are configured by default with the following checks.

| Check | Expects | Description                                                         | Notes                          |
| ----- | ------- | ------------------------------------------------------------------- | ------------------------------ |
| GET / | 200 OK  | Runs every 5 minutes. Checks that path '/' of your app returns 200. | Enabled by default on all apps |

If a check does not match expected response, App will be restarted automatically by Faable platform.
