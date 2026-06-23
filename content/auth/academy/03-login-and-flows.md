---
title: "Module 3 — Login & Flows"
description: The OAuth flows Faable supports — Authorization Code with PKCE, social, passwordless OTP, and refresh tokens — and when to use each.
---

# Module 3 — Login & Flows

> **Learning objectives**
> - Walk through the Authorization Code + PKCE flow step by step.
> - Explain what PKCE protects against and why public clients need it.
> - Know when to use passwordless, social, and refresh tokens.

## The default: Authorization Code + PKCE

This is the flow your web and mobile apps use. Full reference:
[Authorization Code Flow](../oauth-flows/authorization-code.mdx).

```
User clicks "Log in"
      │
1.    ├─ App generates a random code_verifier, hashes it → code_challenge (S256)
      │
2.    ├─ App redirects to  GET /authorize?response_type=code
      │     &client_id=…&redirect_uri=…&scope=openid profile email
      │     &state=…&code_challenge=…&code_challenge_method=S256
      │
3.    │  ── Faable shows the login UI; user authenticates via a connection ──
      │
4.    ├─ Faable redirects back to redirect_uri?code=…&state=…
      │
5.    ├─ App exchanges the code at  POST /oauth/token
      │     grant_type=authorization_code, code, code_verifier
      │
6.    └─ Faable returns: id_token, access_token (+ refresh_token)
```

### What PKCE protects against

`code_verifier` / `code_challenge` (Proof Key for Code Exchange) ties the final token
exchange to the same app that *started* the flow. Even if an attacker intercepts the
`code` from the redirect, they can't exchange it without the original `code_verifier`,
which never left the app. That's why **public clients (no secret) must use PKCE** —
it replaces the client secret as the proof of "I'm the one who asked."

### `state` and `nonce`

- **`state`** — random value echoed back to defeat CSRF on the redirect. The SDK
  generates and checks it for you.
- **`nonce`** — random value placed in the request and returned **inside the ID
  token**, so your app can confirm the token belongs to *this* login.

> Good news: with `@faable/auth-js` (Module 4) **all of step 1, the redirect, `state`,
> `nonce`, and the token exchange are handled for you.** You should still understand
> the flow to debug it.

## Social login

A social connection (Google, GitHub, Apple…) is the *same* Authorization Code flow —
Faable just federates the actual authentication to the provider, then issues *your*
tenant's tokens. To the app, nothing changes. See [Social](../social/).

> Gotcha worth remembering: some providers don't return everything. GitHub may hide a
> user's email. Module 5 shows how **Actions** handle "required data is missing."

## Passwordless (OTP / magic link)

No password to store or leak. The user enters their email, receives a one-time code
or link, and is signed in. Reference: [Passwordless](../passwordless.md). Great for
low-friction consumer apps and as a fallback.

## Refresh tokens

Access tokens are short-lived on purpose. A **refresh token** lets the app get a new
access token silently when the old one expires, without sending the user back through
login. Reference: [Refresh Token Flow](../oauth-flows/refresh-token.mdx).

- Request the `offline_access` scope to receive one (where enabled).
- The client SDK stores and rotates it for you; on the server you treat it as a secret.

## Which flow do I use?

| Situation | Flow |
|---|---|
| Web SPA / mobile app login | **Authorization Code + PKCE** |
| "Log in with Google/GitHub" | Social (same flow, federated) |
| No-password consumer login | **Passwordless OTP** |
| Keep the user logged in | **Refresh token** (`offline_access`) |
| Backend calling an API with **no user** | **Client Credentials** → Module 5 |

## Check yourself

1. An attacker grabs the `code` from the redirect URL. Why can't they get tokens?
2. Your SPA has no client secret. What plays the role of the secret in the flow?
3. The user's access token expired after 1h but they're still using the app. How do
   they keep going without re-login?

<details>
<summary>Answers</summary>

1. They lack the **`code_verifier`** (PKCE). The token exchange requires it and it
   never left the legitimate app.
2. **PKCE** — the `code_verifier`/`code_challenge` pair proves the same client that
   started the flow is finishing it.
3. The SDK uses the **refresh token** to silently obtain a new access token.
</details>

---

Next: **[Module 4 — Integrate Your App](04-integrate-your-app.md)**.
