---
title: Signup Protection
description: Make scripts pay before Faable Auth sends an email or creates an account. A per-client proof-of-work challenge on sign-ups and passwordless codes, solved invisibly by auth-js and the hosted login, with an optional badge.
rank: high
---

# Signup Protection

A public sign-up form, or a "send me a code" box, is an endpoint anyone can script: thousands of fake accounts, or thousands of emails sent from your domain to addresses that never asked for them. **Signup protection** makes every such request cost CPU before Faable Auth sends an email or creates an account. The browser solves a small **proof-of-work challenge** — a fraction of a second for a person, real work for a script sending thousands.

Signup protection is powered by **Faable Challenge**, Faable's bot-protection service, and is included with Faable Auth on every plan. The challenge is issued and verified by Challenge; if it ever does not answer in time, Faable Auth issues the same challenge itself, so a sign-up never waits on it.

It is set **per client** (the dashboard calls it **Bot protection**) and covers the two endpoints that act on an address nobody has proven yet:

- `POST /dbconnections/signup` — [sign-up](signup.md) with email or username.
- `POST /passwordless/start` — the email with a [code or magic link](passwordless.mdx).

[`@faable/auth-js`](#with-faableauth-js) 3.4.0 or later and the [hosted login screens](hosted-login.mdx) solve the challenge for you. Nothing to change in your code.

## Modes

| Mode      | What happens                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `off`     | No challenge. Only your [Actions](extensibility/actions.md) can stop a sign-up.                                                                                              |
| `on_risk` | A challenge only when the request looks automated: it comes from a Tor exit node or a datacenter IP, or its User-Agent is not a real browser's. More signals are on the way. |
| `always`  | Every sign-up and every passwordless code solves the challenge.                                                                                                              |

**New clients start in `on_risk`.** Clients created before November 2026 have no value, which reads as `off`: nothing changes for them until you turn it on.

Client libraries that cannot solve the challenge (auth-js older than 3.4.0, or your own client that does not [declare support](#custom-clients)):

- in `on_risk`, keep working as before, with no challenge;
- in `always`, are refused with `403 challenge_unsupported`. Upgrade them before you switch.

> [!NOTE]
> The decision never depends on whether the email already has an account. A challenge that only appeared for unknown addresses would tell anyone which ones are registered.

## Turning it on

**Dashboard** — **Auth → Clients →** your client **→ Security** tab. It also shows a live preview of the badge next to a Send button. The change applies to the next request.

**CLI** — `--signup-protection <off|on_risk|always>` on [`faable auth clients`](../cli.md#oauth-clients) `create` and `update`:

```bash
faable auth clients create -n my-app --callback https://app.example.com/callback --signup-protection always
faable auth clients update <client_id> --signup-protection on_risk
```

`faable auth clients get` prints a `Signup protection:` line, `list` has a `SIGNUP_PROTECTION` column, and `--json` output carries `signup_protection`.

**MCP** — on the [Faable MCP server](../cli.md#mcp-server), `list_auth_clients` returns each client's `signup_protection`, and `update_auth_client_signup_protection` sets it (`client` — the resource id or the OAuth client_id —, `mode`, and optionally `tenant` and `project`). That one is a write tool: it is only there with writes enabled (`faable mcp --writes`, or the `auth:write` permission on the hosted server).

> [!NOTE]
> The CLI flag and the MCP tools are new: they need the latest CLI (`npm i -g @faable/faable@latest`, which also updates the local `faable mcp`) or the latest hosted MCP server.

**Management API** — `signup_protection` (`off`, `on_risk` or `always`) on `POST /client` and `POST /client/:id`.

## With `@faable/auth-js`

From 3.4.0, `signup()`, `signupAndLogin()` and `signInWithPasswordless()` handle it end to end. When the server asks for a challenge, the library solves it in a Web Worker (or in the page, in short batches, when a CSP blocks `blob:` workers) and sends the request again. Your code sees the final result, as if there had been no challenge.

`onChallenge` lets you reflect it in your UI. It is called with `'solving'`, then `'done'` or `'error'`:

```ts
const { error } = await auth.signup({
  email,
  password,
  onChallenge: state => {
    button.textContent = state === 'solving' ? 'Checking…' : 'Sign up'
  }
})
```

`signInWithPasswordless()` takes the same option. If the request needs no challenge, the callback is never called.

## The badge (optional)

The challenge is invisible by default. To show users that the form is protected, add an element where the badge should go. From auth-js **3.5.0**, `createClient()` finds it, including elements rendered later (a React form), and draws it. It follows the challenge on its own:

```html
<form id="signup">
  <input name="email" type="email" required />
  <div class="actions">
    <button type="submit">Create account</button>
    <div data-faable-challenge class="faable-challenge--auto"></div>
  </div>
</form>
```

It shows "Protected against bots", then "Checking you are human…" while it solves and "Verified" when it is done. It is drawn in a Shadow DOM with inline SVG and CSS: nothing is fetched, and your page's styles neither reach it nor are affected by it.

| Class                                    | Effect                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `faable-challenge--light` / `--dark`     | White or black badge.                                                                                                            |
| `faable-challenge--auto`                 | Follows the user's `prefers-color-scheme` (default).                                                                             |
| `faable-challenge--normal` / `--compact` | Always the full badge, or always the round icon. By default it fits: the full badge when there is room, the round icon when not. |
| `faable-challenge--no-brand`             | Hides the Faable mark.                                                                                                           |
| `faable-challenge--lang-<xx>`            | Language, e.g. `faable-challenge--lang-de`.                                                                                      |

**Language** — `data-lang="xx"` on the element wins, then a `faable-challenge--lang-xx` class, then the nearest `lang` attribute (your `<html lang>`), then the browser's language, then English. 119 languages: every language a Faable Auth tenant can enable.

**Events** — the element emits `faable-challenge:solving`, `faable-challenge:done` and `faable-challenge:error`, which bubble. In the error state the badge is clickable and emits `faable-challenge:retry`. Listen for it to submit the form again.

**From JavaScript**:

```ts
import { mountChallengeWidget, resetChallengeWidgets } from '@faable/auth-js'

// Draw it with options instead of classes (classes on the element still win).
mountChallengeWidget(el, {
  theme: 'dark',
  size: 'compact',
  locale: 'es',
  brand: false
})

// Back to "Protected against bots" for a form that stays on the page.
resetChallengeWidgets(form)
```

A native `reset` of the parent `<form>` resets the badge too.

## Custom clients

Without auth-js the protocol is three steps. Send `"challenge_support": "pow"` in the body of every request (the first one and the retry): it declares that your client can solve the challenge, so the server asks it for one instead of treating it like an old library ([see modes](#modes)). auth-js and the hosted login need nothing.

**1. The server asks for a challenge.** The request comes back as `428 challenge_required`, with the challenge in `details`:

```bash
curl -i https://your-tenant.auth.faable.link/passwordless/start \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://app.example.com' \
  -d '{"client_id":"<your_client_id>","email":"user@example.com","send":"code","challenge_support":"pow"}'
```

```http
HTTP/1.1 428 Precondition Required
Content-Type: application/json

{
  "status": 428,
  "message": "solve the challenge and retry",
  "error_code": "challenge_required",
  "docs": "https://faable.com/docs/auth/errors#challenge_required",
  "details": {
    "id": "0d6c3f0e-7a1b-4c55-9f0e-2b8d3a7e9c41",
    "kind": "pow",
    "seed": "9f2c4e1a7b3d5f60a8c2e4b6d8f0a1c3",
    "email_hash": "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514",
    "difficulty": 18,
    "expires_at": "2026-11-17T10:05:00.000Z"
  }
}
```

**2. Find a `nonce`** — any string of up to 64 characters — such that `sha256("<seed>:<email_hash>:<nonce>")` starts with `difficulty` zero bits.

**3. Send the same request again** with the answer:

```json
{
  "client_id": "<your_client_id>",
  "email": "user@example.com",
  "send": "code",
  "challenge_support": "pow",
  "challenge": {
    "id": "0d6c3f0e-7a1b-4c55-9f0e-2b8d3a7e9c41",
    "nonce": "1k3x9"
  }
}
```

In JavaScript, `solveChallenge` from auth-js does step 2:

```ts
import { solveChallenge } from '@faable/auth-js'

const AUTH = 'https://your-tenant.auth.faable.link'
const headers = { 'Content-Type': 'application/json' }

async function post(path: string, fields: Record<string, unknown>) {
  const body = { ...fields, challenge_support: 'pow' }
  let res = await fetch(AUTH + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  if (res.status === 428) {
    const { details } = await res.json()
    const nonce = await solveChallenge(details)
    res = await fetch(AUTH + path, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, challenge: { id: details.id, nonce } })
    })
  }
  return res
}
```

Elsewhere it is a few lines. In Python:

```python
import hashlib, itertools, requests

AUTH = "https://your-tenant.auth.faable.link"

def solve(c):
    prefix = f"{c['seed']}:{c['email_hash']}:"
    for n in itertools.count():
        nonce = format(n, "x")
        digest = int.from_bytes(hashlib.sha256((prefix + nonce).encode()).digest(), "big")
        if digest >> (256 - c["difficulty"]) == 0:
            return nonce

def post(path, fields):
    body = {**fields, "challenge_support": "pow"}
    res = requests.post(AUTH + path, json=body)
    if res.status_code == 428:
        c = res.json()["details"]
        body["challenge"] = {"id": c["id"], "nonce": solve(c)}
        res = requests.post(AUTH + path, json=body)
    return res
```

The rules:

- **Declare support** with `"challenge_support": "pow"`. Without it, `on_risk` lets your client through as before and `always` refuses it with `challenge_unsupported`. Declaring it buys nothing: a client that declares support is simply asked to solve the challenge.
- **Send `client_id`.** It picks the client whose setting applies.
- **Single use, 5 minutes.** A challenge is bound to the client, the email and the IP address it was issued for, and can be redeemed once.
- **Difficulty** is 18 bits by default, one more per risk signal, up to 21. That is about 260,000 hashes on average at 18 bits: around 0.3 s in a laptop browser, three to four times longer on a phone. The server sets it; the client never picks it.
- **`428 challenge_invalid`** means the answer was not accepted: expired, already used, issued for another request, or a wrong nonce. `details` carries a fresh challenge. Solve that one.
- **`403 origin_required`** — when the client has [Allowed Web Origins](clients.md#security-boundaries) and protection is on, the request must carry an `Origin` header, which every browser sends. It rejects calls from scripts that do not pretend to be a browser.

## On the user and the session

When a sign-up, or the passwordless code that created or verified a user, passed a challenge, the user records it:

```json
{
  "challenge_passed_at": "2026-11-17T10:01:12.000Z",
  "challenge_passed": {
    "method": "pow",
    "difficulty": 18,
    "client_id": "<your_client_id>"
  }
}
```

The session born from that login has `challenge_passed_at` too. Both are read-only, and the user's fields come back from the Management API, so your backend can tell accounts that came through a solved challenge from those that did not. Every challenge issued, passed, failed or refused is also in the [logs](logs.md) (`challenge.issued`, `challenge.passed`, `challenge.failed`, `challenge.unsupported`).

## What it does not stop

- **Proof of work raises the cost of each attempt. It does not prove there is a person.** A real browser driven by automation (Playwright, Puppeteer) solves it the same way a user's browser does. It makes bulk abuse slow and expensive, not impossible.
- **It is not a rate limit.** `/dbconnections/signup` is also limited to 5 requests per minute per IP, and `/passwordless/start` sends one email per address every 3 minutes. Those apply in every mode.
- **For stricter rules** — block a domain, require an invitation, check a list — use a pre-signup [Action](extensibility/actions.md). It runs after the challenge, in every mode.

## Related

- [Signup](signup.md) — the sign-up endpoint and `signup()`.
- [Passwordless](passwordless.mdx) — codes and magic links.
- [Clients](clients.md) — where the setting lives.
- [Error codes](errors.md#challenge_required) — `challenge_required`, `challenge_invalid`, `challenge_unsupported`, `origin_required`.
