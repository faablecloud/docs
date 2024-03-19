# Guide: Deploy node.js Express

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

```js
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

## Deploy to Faable

CLI install:

```bash
npm i -g @faable/faable
```

Deploy folder to faable:

```bash
faable deploy sample-app
```

App is ready at `sample-app.faable.link`
