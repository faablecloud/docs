# Faable Auth Integrator — Answer Key & Grading Rubric (INTERNAL)

> ⚠️ **Do not move this into `content/`.** The docs site publishes everything under
> `content/`; this file lives at the repo root precisely so it is **not** built or
> indexed. Graders only.

Exam: `content/auth/academy/exam.md`. Pass = **≥ 80% written (Sections 1–2)** **AND**
all **3 practical tasks** accepted.

## Scoring

- Section 1: 12 questions × 1 pt = **12**
- Section 2: 4 questions × 2 pts = **8**
- Written total = **20 pts**. Pass threshold = **16 / 20 (80%)**.
- Section 3: pass/fail per task; **all 3 must pass**.

## Section 1 — Multiple choice key

| Q | Answer | Note |
|---|---|---|
| Q1 | **B** | Access token in `Authorization`. ID token is for the app to read. |
| Q2 | **B** | `openid` makes it an OIDC request → ID token returned. |
| Q3 | **C** | PKCE replaces the secret for public clients. |
| Q4 | **B** | Tenant resolved by request **host**. |
| Q5 | **B** | No `code_verifier` → can't complete the exchange. |
| Q6 | **C** | Client Credentials + `@faable/auth-sdk` (no user). |
| Q7 | **C** | M2M with empty scope → full catalog (Auth0 parity). |
| Q8 | **B** | Audience isn't `faable:management:<account_id>`. |
| Q9 | **C** | Payload readable; signature verified locally via JWKS. |
| Q10 | **B** | Prod callback URL not allow-listed. |
| Q11 | **C** | Audience is not one of the four building blocks (Account, Connections, Clients, Users/Teams). |
| Q12 | **B** | `nonce` binds the ID token to this login (`state` is the CSRF one). |

## Section 2 — Short answer rubric (2 pts each)

**Q13 (ID vs access token).** Full marks if they state: ID token = *who the user is*,
read by the app (identity claims, OIDC); access token = *what the bearer may do*, sent
to a resource server in `Authorization: Bearer`, scoped by `aud`/`scope`. 1 pt if they
get the distinction but misassign the use (e.g. "send the ID token to APIs").

**Q14 (Google + password).** Full marks: **one client** for the app (public, PKCE),
**two connections** enabled (a social/Google connection + a database connection); both
connections enabled on that client. 1 pt if they conflate clients with connections but
show the right intent.

**Q15 (secret in SPA).** Full marks: a browser bundle is **public** — anyone can read
the secret, so it provides no security and is a leak; the SPA is a **public client** and
must use **PKCE** instead. 1 pt if they say "don't do it" without explaining PKCE.

**Q16 (progressive profiling).** Full marks: a provider omits a required field (e.g.
GitHub private email); a `postLogin` **Action** pauses the flow
(`api.redirect.sendUserTo`) to collect it, then resumes at `/continue`; the safeguard
is `api.access.deny(...)` if the field is still missing on continue (else the user can
replay and log in incomplete). 1 pt if they describe the Action but omit the deny safeguard.

## Section 3 — Practical task rubric (all required)

**T1 — Working login.** PASS if: a real PKCE login completes against their practice
tenant; evidence shows the signed-in email; **decoded ID token** includes a plausible
`sub`, the tenant `iss`, an `aud`, and a future `exp`. FAIL if they submit only code
with no run evidence, or paste a token from a public online decoder (security violation
— ask them to redo locally).

**T2 — M2M call.** PASS if: a confidential client + `@faable/auth-sdk`
(`authClientCredentials`) lists users; output matches their tenant; **decoded access
token** shows `aud = faable:management:<account_id>` and `permissions`/`scope`
consistent with the management API. FAIL if they hand-built a token, hardcoded one, or
the audience is wrong.

**T3 — Least privilege & extensibility.** PASS if: (1) they restrict the client by
**requesting only `read:users`** (narrowing scope) rather than inventing per-client
grant config; and (2) the Action sketch pauses → collects → resumes → **denies if
still missing**. FAIL if the least-privilege answer misunderstands that empty scope =
full catalog, or the Action sketch lacks the resume/deny idea.

## Common misconceptions to watch for

- Sending the **ID token** to APIs (Q1/Q13/T1) — the single most common error.
- Thinking they must **enumerate scopes** for an M2M client to work (Q7/T2/T3).
- Believing a **resource server calls Faable per request** to validate (Q9).
- Putting a **secret in a public client** (Q15).

## Issuing the credential

On pass, mint the badge via the `auth-academy` client: a JWT with `cert: "integrator"`,
`sub` = the employee, and an issue date. (See platform team for the academy client
credentials.) Record the pass in the academy roster.
