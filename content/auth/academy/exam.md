---
title: "Certification Exam — Integrator"
description: The Faable Auth Integrator exam — multiple-choice and short-answer questions plus three practical tasks. Pass to earn the Integrator credential.
---

# Certification Exam — Faable Auth Integrator

> **To pass:** **≥ 80%** on the written part (Sections 1–2) **AND** all **3 practical
> tasks** (Section 3) accepted against the rubric.
>
> **Open book** — you may use the docs and your `lab-notes.md`. You may **not** copy
> answers from another candidate. Decode any tokens **locally**.
>
> Time guide: ~45 min written + your already-done lab.

---

## Section 1 — Multiple choice (1 pt each)

**Q1.** Which token do you send to your own backend API in the `Authorization` header?
- A) ID token  B) Access token  C) Refresh token  D) Client secret

**Q2.** What does adding the `openid` scope to an authorization request do?
- A) Nothing, it's optional cosmetic  B) Returns an ID token (makes it an OIDC request)
- C) Grants admin access  D) Disables PKCE

**Q3.** A browser SPA has no client secret. What replaces the secret's role in the flow?
- A) The refresh token  B) The `state` parameter  C) PKCE (`code_verifier`/`code_challenge`)  D) The ID token

**Q4.** How does Faable Auth decide which **tenant** a request belongs to?
- A) By the user's email domain  B) By the request **host**  C) By the client secret  D) By a cookie set at signup

**Q5.** An attacker intercepts the `code` from the redirect URL of a PKCE flow. Why
can't they obtain tokens?
- A) The code is encrypted  B) They lack the `code_verifier`  C) The code is single IP-bound  D) They lack the ID token

**Q6.** A Node.js cron job (no user) needs to update users. Which grant + SDK?
- A) Authorization Code + `@faable/auth-js`  B) Passwordless + `@faable/auth-helpers-react`
- C) Client Credentials + `@faable/auth-sdk`  D) Refresh token + `@faable/auth-js`

**Q7.** You create an M2M client and request **no scopes**. What can it do on the
Management API?
- A) Nothing until you list scopes  B) Only `read:*`  C) The **full catalog** of the API  D) Only its own client record

**Q8.** A management call fails with `aud_mismatch`. What's wrong?
- A) Wrong client secret  B) The token's **audience** isn't the tenant's management audience
- C) Missing refresh token  D) The user lacks a role

**Q9.** Which statement about JWTs issued by Faable is correct?
- A) The payload is encrypted, so secrets are safe in claims
- B) Resource servers must call Faable on every request to validate
- C) The payload is readable; signature is verified locally via JWKS
- D) They use HMAC with the client secret

**Q10.** Login works locally but errors right after sign-in in production. Most likely cause?
- A) Expired refresh token  B) Production callback URL not allow-listed  C) Wrong scope  D) JWKS rotation

**Q11.** Which is **NOT** one of the four core tenant building blocks?
- A) Connection  B) Client  C) **Audience**  D) Team

**Q12.** The purpose of the `nonce` value is to…
- A) Defeat CSRF on the redirect  B) Bind the **ID token** to this specific login
- C) Replace the client secret  D) Encrypt the access token

## Section 2 — Short answer (2 pts each)

**Q13.** In one or two sentences, explain the difference between an **ID token** and an
**access token**, and give the correct use of each.

**Q14.** You want "Log in with Google" plus email/password on the same app. Describe in
2–3 sentences what you configure in the tenant (clients? connections? how many?).

**Q15.** A teammate puts a **client secret** into the React SPA bundle "to make
login more secure." Explain why this is wrong and what the SPA should use instead.

**Q16.** Describe the **progressive profiling** problem and how an **Action** solves it,
including the one safeguard that stops a user logging in with incomplete data.

## Section 3 — Practical tasks (graded against the rubric; all 3 required)

Complete these in your **practice tenant** (from the [Lab](lab.md)) and submit the
evidence listed.

**T1 — Working login.** Demonstrate a full Authorization Code + PKCE login with
`@faable/auth-js`. **Submit:** a screen recording or screenshots of the login + the
signed-in user's email, and the **locally-decoded ID token claims** (`sub`, `iss`,
`aud`, `exp`) from your notes. *(Maps to Lab Part B / B.2.)*

**T2 — M2M Management API call.** Using a confidential client + `@faable/auth-sdk`
(`authClientCredentials`), list the users of your tenant from a backend script.
**Submit:** the script (secrets redacted) and its output, plus the **decoded access
token** showing its `aud` and `permissions`/`scope`. *(Maps to Lab Part C.)*

**T3 — Reason about least privilege & extensibility.** **Submit** your written answers
to Lab Part D: (1) how to restrict the T2 client to read-only users, and (2) a short
sketch of an Action handling a missing GitHub email. *(Maps to Lab Part D.)*

---

## Submitting

Send your written answers (Q1–Q16) and the Section 3 evidence to your manager or the
platform team (`#auth`). They grade against the rubric and, on a pass, issue your
**Faable Auth Integrator** credential.

> Graders: the answer key and rubric are kept **outside** the published docs (see
> `INTEGRATOR-EXAM-ANSWER-KEY.md` in the docs repo root). Don't paste them here.
