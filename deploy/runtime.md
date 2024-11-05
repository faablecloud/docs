#  Runtime

Your app run in our platform as Linux Containers. This document describes how apps work in Faable Deploy.

## Node.js

Node versions adhere to Semver, the semantic versioning convention popularized by GitHub. Semver uses a version scheme in the form `MAJOR.MINOR.PATCH`.

Faable supports the Current version of Node.js and all Active Long-Term-Support (LTS) versions. Faable supports new releases within 24 hours of the official release from the Node team. As the Node.js release schedule illustrates, Faable currently supports Node.js versions 18.x and 20.x.

## Specifying a Node.js Version

Always specify a Node.js version that matches the runtime that you’re developing and testing with. To find your version locally:

```bash
node --version
v20.9.0
```

To specify the version of Node.js to use on Faable, use the engines section of the `package.json`. Drop the v to save only the version number.

```json
{
  "name": "example-app",
  "description": "a really cool app",
  "version": "1.0.0",
  "engines": {
    "node": "20.x"
  }
}
```

> If a Node version isn’t specified in the engines section, Node.js 20.x is used automatically.

## Environment variables

You can set environment variables for your App in the [Dashboard](https://www.faable.com/dashboard/apps)

## App Manager

The app manager keeps apps running automatically; so operating your app is maintenance-free. The Runtime instantiates one app per region unless it is specified in redundancy options. In the case one app container craashes, make sure there's at least two app instances running. Otherwise app will be unresponsive for the restart period.

## Restarting

Faable Deploy Runtime implements an incremental restart policy for crashing apps.

- When an app crashes it will be continuously restarted.
- If an app keeps restarting for 5 minutes, it will be stopped and marked as crashed. Crashed apps must be restarted manually.

After an app exits, the App Manager restarts them with an exponential back-off delay (10s, 20s, 40s, …), that is capped at five minutes. Once an app has executed for 10 minutes without any problems, the manager resets the restart backoff timer for that app. In case the app keeps incrementing the back-off delay up to five minutes, it will be marked as crashed and needs to be restarted manually.
