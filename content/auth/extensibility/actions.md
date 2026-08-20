---
title: Actions
description: Run your own JavaScript inside Faable Auth at key moments of the authentication flow — enforce custom rules, enrich tokens, or redirect users through a custom step.
---

# Actions

**Actions** are small JavaScript functions that you write and Faable runs inside a sandbox at well-defined moments of the authentication pipeline. Use them to enforce business rules (e.g. block users without a verified email), require additional consent, or redirect users through your own UI before issuing tokens.

Actions are stored per-account, run in execution order, and have a focused API for the most common decisions: allow, deny, or pause-and-redirect.

## Triggers

| Trigger      | When it runs                                                                     | Typical use                                                                                  |
| ------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `post-login` | After the user is authenticated, **before** tokens are issued.                   | Enforce rules, redirect to custom UI (terms of service, MFA enrollment), enrich the session. |
| `continue`   | When the user returns from a `post-login` redirect via the `/continue` endpoint. | Pick up state and decide what to do next.                                                    |

Multiple actions can be registered at the same trigger; they execute in ascending `order`. The first one to call `api.access.deny()` short-circuits the chain; the first one to call `api.redirect.sendUserTo()` pauses the flow.

> [!IMPORTANT]
> **Plan limits**: Free accounts can have **1 Action** per account. Hobby and Pro allow unlimited Actions. See [Auth pricing](../pricing.md).

## CRUD endpoints

| Method   | Path                  | Purpose                                    |
| -------- | --------------------- | ------------------------------------------ |
| `POST`   | `/actions`            | Create an action.                          |
| `GET`    | `/actions`            | List actions (filterable by trigger).      |
| `POST`   | `/actions/:action_id` | Update name, code, order, or enabled flag. |
| `DELETE` | `/actions/:action_id` | Delete.                                    |

### Fields

| Field     | Description                          |
| --------- | ------------------------------------ |
| `name`    | Free-text label (max 200 chars).     |
| `trigger` | `post-login` or `continue`.          |
| `code`    | The JavaScript source to execute.    |
| `enabled` | When `false`, the action is skipped. |
| `order`   | Integer; lower runs first.           |

## Writing an Action

Your code must export an async function whose name matches the trigger. For `post-login`:

```js
exports.onExecutePostLogin = async (event, api) => {
  // event holds context about the current login.
  // api is how you affect the outcome.
}
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
  request: {
    ip: string;
    userAgent: string;
    // Raw Accept-Language header, e.g. "en-GB,en;q=0.9". Empty when absent.
    language: string;
    // Coarse device class parsed from the User-Agent.
    device: 'mobile' | 'desktop' | 'bot' | 'unknown';
    // true when `ip` belongs to a known datacenter / hosting / proxy range.
    ip_datacenter?: boolean;
    // How many of your currently-active blocks have seen this exact IP.
    ip_active_blocks?: number;
    // Same, widened to the IP's /24 (or /48 for IPv6). Only ever non-zero for
    // datacenter addresses, so it can never implicate a residential range.
    ip_network_active_blocks?: number;
  };
  stats: {
    // true when this login is the user's SIGNUP — the identity was created
    // by the same flow that triggered the action. Always false on `continue`
    // resumes, even if the original paused flow was a signup.
    is_new_user: boolean;
    // Age of the account in milliseconds. Undefined when it cannot be dated.
    account_age_ms?: number;
    // true when this login's primary language tag differs from the one seen
    // at the user's first login. Only ever true on a returning login.
    language_changed?: boolean;
    // How many times THIS action has already denied THIS user.
    deny_count?: number;
  };
};
```

> [!NOTE]
> The three `ip_*` fields are resolved **on demand**: Faable only computes them when your action's source mentions them by name, so an action that never reads them costs nothing. Treat `undefined` as "not evaluated" and compare explicitly (`=== true`).

> [!TIP]
> `event.stats.is_new_user` distinguishes a **signup** from a returning login, regardless of how the user registered (email/password form, Google, GitHub…). Every flow passes through `post-login`, which makes it the one reliable place to react to new accounts.

### The `api` object

```ts
api.access.deny(reason: string, opts?: {
  blockFor?: string | number   // '48h', '7d', or milliseconds
  code?: string                // short machine tag for your audit rows
  details?: Record<string, unknown>
})
  // Reject the login. Returns HTTP 401 to the client with the given reason.
  // No further actions in the chain run.
  //
  // With `blockFor`, the verdict is PERSISTED: further attempts by the same
  // user are denied for that long without re-running your code, and
  // `event.stats.deny_count` counts how often it has fired, so you can back
  // off progressively. `code` and `details` are audit-only — they land in the
  // log row, never in the message the user sees.

api.access.review(code: string, details?: Record<string, unknown>)
  // Let the login through, but flag it for a human. The user is unaffected;
  // the audit row is marked `review: true` with your code and details.
  //
  // Use it for rules that are worth noticing but not worth blocking on. A
  // rule you are not confident enough to enforce is still worth shipping
  // here — a flagged row you can review beats a rule you never deployed.

api.redirect.sendUserTo(url: string)
  // Pause the login flow and send the user's browser to `url`.
  // Faable persists state so the flow can resume via /continue once the
  // user returns.
```

`deny` and `review` are independent: an action may do both, and the deny still wins the verdict.

### Example — block users with an unverified email and require ToS acceptance

```js
exports.onExecutePostLogin = async (event, api) => {
  if (!event.user.email_verified) {
    api.access.deny('Please verify your email before signing in.')
    return
  }

  const tosAccepted = event.user.app_metadata?.tos_accepted_at
  if (!tosAccepted) {
    api.redirect.sendUserTo('https://app.example.com/accept-tos')
  }
}
```

If the user clicks through your ToS page and you redirect them back to Faable's `/continue` endpoint, a corresponding `continue` Action picks up — typically to mark the metadata field and let the flow proceed.

### Example — onboard new users only

Send brand-new accounts through a one-time onboarding step, while returning users go straight in. Works for **every** signup flow — email/password, magic link, Google, GitHub — because they all pass through `post-login`:

```js
/**
 * @param {Event} event - The event object
 * @param {Api} api - The Faable Auth API object
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only divert the user's very first login (their signup).
  if (event.stats.is_new_user) {
    api.redirect.sendUserTo('https://app.example.com/onboarding')
  }
}
```

### Tracking signup conversions

For **signup analytics** (Google Ads conversions, PostHog events…), you don't need an Action at all: when a flow creates a new account, the redirect back to your app carries a one-time **`signup=true`** query parameter — for every flow (register form, passwordless, social OAuth). Fire your conversion client-side when you see it:

```js
// On your OAuth landing/callback page:
const params = new URLSearchParams(window.location.search)
if (params.get('signup') === 'true') {
  analytics.capture('user_signed_up') // your one-time conversion event
}
```

The parameter only ever appears once (it lives in the callback URL, never in a token claim), and it survives Action redirects: if a `post-login` Action pauses the flow, the eventual redirect after `/continue` still carries it.

### Console logging

`console.log()` and `console.error()` calls inside your code are captured and written to [Logs](../logs.md), so you can debug behavior without exposing it to end users.

## Execution mode

In production, Actions run on a dedicated worker process via RPC (so a misbehaving action can't stall the auth server). The default timeout is 5 seconds per action. In local development, the auth server can also execute them in-process. This is an operational detail you don't usually need to think about.

## Next steps

- [Webhooks](webhooks.md) — react to events **after** they happen instead of intercepting them inline.
- [Logs](../logs.md) — inspect Action execution and `console.log` output.
