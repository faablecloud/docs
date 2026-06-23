---
title: "Hands-on Lab — Integrator"
description: Build a working Faable Auth integration end to end in a throwaway practice tenant — client, login, and an M2M Management API call.
---

# Hands-on Lab — Integrator

This is where the learning sticks. You'll integrate a tiny app and make a backend
call, end to end, in a **practice tenant**. Budget ~60–90 minutes.

> **Environment.** Use the **practice tenant** your platform team provisions for the
> academy (a disposable tenant — ask in `#auth` for your `domain` and dashboard
> access). Never run the lab against a production tenant. If you're self-hosting the
> academy, the `dev` environment (database `auth-dev`) is the disposable one.

## What you'll produce

Keep a short `lab-notes.md` as you go — you'll cite it in the exam's practical tasks.
Capture: your client id, a decoded ID token, a decoded access token, and a successful
Management API response.

---

## Part A — Model a tenant (Modules 1–2)

1. In the [dashboard](https://dashboard.faable.com), open your practice tenant.
2. Create a **public Client** for a web app. Set **Allowed Callback URLs** to
   `http://localhost:3000/callback`. Save the **Client ID**.
3. Enable at least one **Connection** (database email+password is simplest; add a
   social one if you want).

✅ *Checkpoint:* you can name, for your tenant, the account domain, one client, and one
connection.

## Part B — Add login (Modules 3–4)

1. Scaffold a minimal app (plain Vite/React, Next.js, or even an HTML page) using
   `@faable/auth-js`:

   ```ts
   import { createClient } from "@faable/auth-js";
   const auth = createClient({
     domain: "<your-practice-tenant-domain>",
     clientId: "<your_client_id>",
   });
   ```

2. Wire a **Log in** button → `auth.signInWithOauthConnection({ redirectTo: "http://localhost:3000/callback" })`.
3. On `/callback`, call `auth.handleRedirectCallback()`, then `auth.getSession()`.
4. Render the signed-in user's email and **log the tokens to the console**.

✅ *Checkpoint:* you complete a full login and have a `session` with an `id_token` and
an `access_token`.

### B.2 — Inspect your tokens (decode locally)

Decode the **ID token** and the **access token** payloads **locally** (a local
`jwt`-decode snippet or your editor — **do not paste tokens into a website**). In your
notes, record for each: `sub`, `aud`, `scope`/`permissions`, `iss`, `exp`. Write one
sentence on **why you'd send the access token (not the ID token) to your backend**.

✅ *Checkpoint:* you can point at the claim that identifies the user (`sub` in the ID
token) and the claim that says where the access token may be used (`aud`).

## Part C — Call the Management API as a machine (Module 5)

1. In the dashboard, create a **confidential Client** for backend use. Save its
   **Client ID** and **Client Secret**.
2. In a tiny Node script, use `@faable/auth-sdk` with `authClientCredentials`:

   ```ts
   import { FaableAuthApi, authClientCredentials } from "@faable/auth-sdk";
   const api = FaableAuthApi.create({
     authStrategy: authClientCredentials,
     auth: { client_id: process.env.CID!, client_secret: process.env.CSECRET! },
     domain: process.env.DOMAIN!,
   });
   const page = await api.listUsers().first();
   console.log(page.results.map(u => u.email));
   ```

3. Run it. You should see the user you created in Part B.
4. **Bonus:** `await api.updateUser(<id>, { locale: "es" })` and confirm the change in
   the dashboard.

✅ *Checkpoint:* a `client_credentials`-authenticated backend lists your tenant's users
**without** you enumerating any scopes (full catalog by default).

## Part D — Reflect (Module 5)

In `lab-notes.md`, answer in 2–3 sentences each:

1. What would you change to give the Part C client **only** read access to users?
2. A GitHub social login returns no email. Sketch how an **Action** would handle it.

---

## Done?

When all four checkpoints pass and your `lab-notes.md` is complete, take the
**[Certification Exam](exam.md)**. The exam's three practical tasks map directly to
Parts B.2, C, and D — so good notes here make the exam fast.
