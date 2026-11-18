---
title: Get Started
description: Protect a form with Faable Challenge in three steps — create a site in the dashboard, add the widget to your form, and verify its one-time token on your server with curl or Node.js.
rank: entry
---

# Get Started with Faable Challenge

Three steps: create a site, add the widget to your form, and verify the token on your server before you act on the submission.

## 1. Create a site

1. Open the [Faable Dashboard](https://dashboard.faable.com) and pick **Challenge** in the product menu.
2. **Create a site.** Give it a name (`Contact form`) and the **domains** your form lives on — up to 10 per site. A domain covers its subdomains too: `example.com` also allows `www.example.com` and `shop.example.com`. Paste a URL if that is easier; only the hostname is kept.
3. Copy the two keys:
   - the **site key** (`fcs_pk_…`) is public and goes in your page;
   - the **secret key** (`fcs_sk_…`) stays on your server. **It is shown once** — Faable keeps only a hash of it. If you lose it, rotate it from the site's page.

The widget only works on the site's domains. To try it on your machine, add `localhost` to the list while you develop.

How many sites a project can have depends on its plan — see [Pricing](/challenge/pricing).

## 2. Add the widget to your form

Put an element with the class `faable-challenge` and your site key inside the form, and load the script once per page:

```html
<form action="/contact" method="post">
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <div class="faable-challenge" data-sitekey="fcs_pk_…"></div>
  <button>Send</button>
</form>

<script src="https://challenge.faable.com/v1/api.js" async defer></script>
```

That is all the page needs:

- The widget starts solving on the **first interaction with the form** (a focus or a keystroke), so the token is usually ready before the person presses **Send**.
- If they send earlier, the submit **waits for the token** and goes on by itself.
- The token travels in a hidden field named **`faable-challenge-response`**, and is renewed on its own while the form stays open.

With a bundler, install [`@faable/challenge`](https://www.npmjs.com/package/@faable/challenge) instead of the script tag:

```bash
npm install @faable/challenge
```

```ts
import { render } from '@faable/challenge'

render(document.querySelector('#challenge')!, {
  sitekey: 'fcs_pk_…',
  action: 'contact'
})
```

[The Widget](/challenge/widget) covers every option, single-page apps and themes.

## 3. Verify the token on your server

When the form arrives, send the token to `POST https://challenge.faable.com/v1/verify` with your secret key, and only go on if `success` is `true`:

```bash
curl -X POST https://challenge.faable.com/v1/verify \
  -H 'content-type: application/json' \
  -d '{"secret":"fcs_sk_…","response":"<faable-challenge-response>","remoteip":"<client IP>"}'
```

```json
{
  "success": true,
  "site_id": "…",
  "project_id": "project_…",
  "hostname": "www.example.com",
  "action": "contact",
  "challenge_ts": "2026-11-18T08:24:16.049Z",
  "difficulty": 18,
  "signals": [],
  "remoteip_match": true,
  "error-codes": [],
  "receipt": "eyJhbGciOiJFUzI1NiIs…"
}
```

In Node.js (18 or later, with the built-in `fetch`), for an Express handler:

```js
import express from 'express'

const app = express()
app.use(express.urlencoded({ extended: false }))

async function verifyChallenge(token, ip) {
  const res = await fetch('https://challenge.faable.com/v1/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.FAABLE_CHALLENGE_SECRET,
      response: token,
      remoteip: ip,
      action: 'contact'
    }),
    signal: AbortSignal.timeout(5000)
  })
  const body = await res.json()
  return body.success === true
}

app.post('/contact', async (req, res) => {
  const ok = await verifyChallenge(
    req.body['faable-challenge-response'],
    req.ip
  ).catch(() => false)
  if (!ok) return res.status(400).send('Could not verify the request.')

  // …now send the email, store the booking, create the account
  res.redirect('/thanks')
})
```

Keep the secret in an environment variable (`FAABLE_CHALLENGE_SECRET`) — on Faable Deploy, as a [secret](/cli#secrets) of the app — never in the page or the repository.

A few things worth knowing from the start:

- **One token, one verify.** Verifying consumes the token. A second call with the same token answers `timeout-or-duplicate`.
- **Five minutes.** A token not verified within 5 minutes of being issued expires.
- **`remoteip` is optional** and never fails the check: `remoteip_match` tells you whether it is the IP that solved the challenge, for you to weigh.
- **`action` is optional.** Send the label your widget used (`contact`) and a token from another form of yours fails with `action-mismatch`.

The full reference — every field, every error code and the signed receipt — is in [Verify API](/challenge/verify).

## Next steps

- [The Widget](/challenge/widget) — themes, sizes, languages, events, and SPA usage.
- [With Faable Auth](/challenge/faable-auth) — if your form creates Faable Auth users, mark them as verified.
- [Pricing](/challenge/pricing) — what each plan includes.
