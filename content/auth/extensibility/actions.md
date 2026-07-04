---
title: Actions
description: Run your own JavaScript inside Faable Auth at key moments of the authentication flow — enforce custom rules, enrich tokens, or redirect users through a custom step.
---

# Actions

**Actions** are small JavaScript functions that you write and Faable runs inside a sandbox at well-defined moments of the authentication pipeline. Use them to enforce business rules (e.g. block users without a verified email), require additional consent, or redirect users through your own UI before issuing tokens.

Actions are stored per-account, run in execution order, and have a focused API for the most common decisions: allow, deny, or pause-and-redirect.

## Triggers

| Trigger | When it runs | Typical use |
|---------|--------------|-------------|
| `post-login` | After the user is authenticated, **before** tokens are issued. | Enforce rules, redirect to custom UI (terms of service, MFA enrollment), enrich the session. |
| `continue`   | When the user returns from a `post-login` redirect via the `/continue` endpoint. | Pick up state and decide what to do next. |

Multiple actions can be registered at the same trigger; they execute in ascending `order`. The first one to call `api.access.deny()` short-circuits the chain; the first one to call `api.redirect.sendUserTo()` pauses the flow.

> [!IMPORTANT]
> **Plan limits**: Hobby accounts can have **1 Action** per account. Pro and Business allow unlimited Actions. See [Auth pricing](../pricing.md).

## CRUD endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/actions` | Create an action. |
| `GET`  | `/actions` | List actions (filterable by trigger). |
| `POST` | `/actions/:action_id` | Update name, code, order, or enabled flag. |
| `DELETE` | `/actions/:action_id` | Delete. |

### Fields

| Field | Description |
|-------|-------------|
| `name` | Free-text label (max 200 chars). |
| `trigger` | `post-login` or `continue`. |
| `code` | The JavaScript source to execute. |
| `enabled` | When `false`, the action is skipped. |
| `order` | Integer; lower runs first. |

## Writing an Action

Your code must export an async function whose name matches the trigger. For `post-login`:

```js
exports.onExecutePostLogin = async (event, api) => {
  // event holds context about the current login.
  // api is how you affect the outcome.
};
```

### The `event` object

```ts
event = {
  user: {
    user_id: string;
    email: string;
    email_verified: boolean;
    app_metadata: Record<string, unknown>;
    user_metadata: Record<string, unknown>;
    // …additional standard claims
  };
  client: { client_id: string; name: string };
  connection: { name: string; strategy: string };
  request: { ip: string; userAgent: string };
  stats: {
    // true when this login is the user's SIGNUP — the identity was created
    // by the same flow that triggered the action. Always false on `continue`
    // resumes, even if the original paused flow was a signup.
    is_new_user: boolean;
  };
};
```

> [!TIP]
> `event.stats.is_new_user` distinguishes a **signup** from a returning login, regardless of how the user registered (email/password form, Google, GitHub…). Every flow passes through `post-login`, which makes it the one reliable place to react to new accounts.

### The `api` object

```ts
api.access.deny(reason: string)
  // Reject the login. Returns HTTP 401 to the client with the given reason.
  // No further actions in the chain run.

api.redirect.sendUserTo(url: string)
  // Pause the login flow and send the user's browser to `url`.
  // Faable persists state so the flow can resume via /continue once the
  // user returns.
```

### Example — block users with an unverified email and require ToS acceptance

```js
exports.onExecutePostLogin = async (event, api) => {
  if (!event.user.email_verified) {
    api.access.deny("Please verify your email before signing in.");
    return;
  }

  const tosAccepted = event.user.app_metadata?.tos_accepted_at;
  if (!tosAccepted) {
    api.redirect.sendUserTo("https://app.example.com/accept-tos");
  }
};
```

If the user clicks through your ToS page and you redirect them back to Faable's `/continue` endpoint, a corresponding `continue` Action picks up — typically to mark the metadata field and let the flow proceed.

### Example — track signup conversions in your analytics

OAuth signups (Google, GitHub…) never hit your register page, so page-based conversion tracking undercounts them. Since **every** flow passes through `post-login`, an Action is the one place that catches all signups. Use `event.stats.is_new_user` and forward the conversion to your analytics backend:

```js
/**
 * @param {Event} event - The event object
 * @param {Api} api - The Faable Auth API object
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only fire on the user's first login (their signup), not on every login.
  if (!event.stats.is_new_user) return;

  await fetch("https://eu.i.posthog.com/i/v0/e/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: "<your PostHog project token>",
      event: "user_signed_up",
      distinct_id: event.user.user_id,
      properties: {
        email: event.user.email,
        connection: event.connection?.strategy, // e.g. "github", "google", "auth"
      },
    }),
  });
};
```

The same pattern works for any conversion backend (GA4 Measurement Protocol, a Slack webhook, your own API). Failures inside the Action are logged to [Logs](../logs.md); a tracking hiccup never blocks the login itself unless you explicitly call `api.access.deny()`.

### Console logging

`console.log()` and `console.error()` calls inside your code are captured and written to [Logs](../logs.md), so you can debug behavior without exposing it to end users.

## Execution mode

In production, Actions run on a dedicated worker process via RPC (so a misbehaving action can't stall the auth server). The default timeout is 5 seconds per action. In local development, the auth server can also execute them in-process. This is an operational detail you don't usually need to think about.

## Next steps

- [Webhooks](webhooks.md) — react to events **after** they happen instead of intercepting them inline.
- [Logs](../logs.md) — inspect Action execution and `console.log` output.
