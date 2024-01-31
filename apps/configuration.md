# App config

To serve your **APP** from Faable check that the following is true.

## Start script

Make sure your app has a `start` script inside `package.json`

```json
{
  "name": "app_name",
  "scripts": {
    "start": "<your start script here>"
  }
}
```

## Serve your app at `$PORT`

Start a server that listens on `0.0.0.0` and serves `http` traffic using environment variable `PORT` to configure its port binding. This variable will be automatically configured in Faable Cloud when routing requests to your app.

```javascript
const express = require("express");
const app = express();

// NOTE: To work on Faable Cloud, use the $PORT environment variable
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen("0.0.0.0", port, () => {
  console.log(`Example app listening on port ${port}`);
});
```

## Node.js Runtimes

Node versions adhere to Semver, the semantic versioning convention popularized by GitHub. Semver uses a version scheme in the form MAJOR.MINOR.PATCH.

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
