---
title: 'Module 4 — Integrate Your App'
description: Add login to a web app with @faable/auth-js — initialize the client, start the flow, handle the callback, and read the session and user.
---

# Module 4 — Integrate Your App

> **Learning objectives**
>
> - Initialize `@faable/auth-js` and start a login.
> - Handle the callback and read the session + user.
> - Know which SDK to reach for in browser vs server vs React.

## The client SDK: `@faable/auth-js`

For browsers and React Native. It runs the Authorization Code + PKCE flow, manages
the session, and refreshes tokens. You only need your tenant **domain** and **Client ID**.

```ts
import { createClient } from '@faable/auth-js'

export const auth = createClient({
  domain: 'your-tenant.auth.faable.link',
  clientId: '<your_client_id>'
})
```

### Start a login

```ts
await auth.signInWithOauthConnection({
  redirectTo: 'https://app.example.com/callback' // must be in Allowed Callback URLs
})
```

This redirects the browser to Faable's `/authorize` with PKCE, `state`, and `nonce`
already set up. The user authenticates via whatever connections you enabled.

### Handle the callback

On your callback route, let the SDK finish the exchange:

```ts
// at https://app.example.com/callback
const { session } = await auth.handleRedirectCallback()
// session has the tokens; the user is now signed in
```

### Read session & user

```ts
const session = await auth.getSession() // null if not signed in
const accessToken = session?.access_token // forward this to YOUR APIs
const user = session?.user // identity from the ID token
```

> **Apply Module 1 here:** `session.user` comes from the **ID token** (who the user
> is). `session.access_token` is what you put in `Authorization: Bearer …` when
> calling _your own_ backend. Don't mix them up.

### Log out

```ts
await auth.signOut() // clears the local session; see OIDC Logout for RP-initiated
```

For logging out across every app the user signed into, see
[OIDC Logout](../oidc/logout.md).

## The Faable SDK family — pick the right one

| Package                                                                                  | Where it runs          | Use it for                                                |
| ---------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| [`@faable/auth-js`](https://www.npmjs.com/package/@faable/auth-js)                       | Browser / React Native | Login flow, session, token refresh (this module).         |
| [`@faable/auth-helpers-react`](https://www.npmjs.com/package/@faable/auth-helpers-react) | React                  | Hooks for session/user state (`SessionContext`).          |
| [`@faable/auth-sdk`](https://www.npmjs.com/package/@faable/auth-sdk)                     | Node.js server         | Verify tokens; **admin / Management API** ops (Module 5). |

A quick win: the [Next.js Quickstart](../quickstart/nextjs.mdx) wires all of this in
an App Router project.

## Common integration mistakes

- ❌ Sending the **ID token** to your API. Send the **access token**.
- ❌ Forgetting to add the prod callback URL → works locally, breaks in prod.
- ❌ Hardcoding tokens or putting a **client secret in a browser app** (public clients
  have no secret — PKCE replaces it).
- ❌ Calling APIs with an access token whose **`aud`** is not your API → the resource
  server rejects it (Module 5).

## Check yourself

1. After `handleRedirectCallback()`, where do you get the value to call your own
   `/api/orders` backend?
2. Your login redirects fine locally but errors after deploying. Most likely cause?
3. Which package would a Node.js cron job use to update users — and why not `@faable/auth-js`?

<details>
<summary>Answers</summary>

1. From `session.access_token` (the **access token**), forwarded as
   `Authorization: Bearer …`.
2. The production **callback URL isn't allow-listed** on the client.
3. **`@faable/auth-sdk`** (server-side). `@faable/auth-js` is a browser/mobile client
   SDK built around a _user_ login + PKCE; a cron job has no user and needs the
   server-side **client_credentials** path (Module 5).

</details>

---

Next: **[Module 5 — Server-side & Management API](05-server-and-management-api.md)**.
