---
title: Change Email
description: Let your users update their account email safely. Faable Auth verifies ownership of the new address (and optionally the old one) before applying the change.
---

# Change Email

Faable Auth provides a built-in flow for users to update the email address on their account. The flow is designed around **proof of ownership**: the new email is never applied until the user clicks a verification link, and an optional second step can require the old email to confirm as well — useful for high-risk accounts.

You can drive this flow from your application's profile/settings screen with a single client-side call, or directly over HTTP.

## Client library

From a signed-in browser session, [`@faable/auth-js`](quickstart/nextjs.mdx) exposes `changeEmail()`. It uses the active session's access token, so the user can only change their own address:

```ts
const { data, error } = await auth.changeEmail({
  new_email: 'new@example.com',
  verification_mode: 'old_and_new', // optional; raises the tenant default
  redirect_uri: 'https://app.example.com/settings/email-changed'
})
// data: { status: 'verification_sent', ticket_id, verification_mode }
```

This calls the endpoints below for you. The rest of this page documents the underlying HTTP contract.

## Endpoints

| Method | Path                            | Purpose                                                          |
| ------ | ------------------------------- | ---------------------------------------------------------------- |
| `POST` | `/user/:user_id/change-email`   | Start the flow. Sends the verification email to the new address. |
| `GET`  | `/change-email-verify?ticket=…` | Public entry point for the link in the verification email.       |

Both endpoints are exposed by your auth tenant (e.g. `https://your-tenant.faable.app` or your custom domain).

### Authentication & limits

- `POST /user/:user_id/change-email` requires either an `Authorization: Bearer <access_token>` header **or** a valid session cookie. The caller must match the `user_id` in the path — users can only change their own email.
- Re-authentication is **not** required; an active session is enough.
- The endpoint is rate-limited to **5 requests per minute** per IP.
- `GET /change-email-verify` is public (the ticket itself is proof) and rate-limited to **5 requests per 10 seconds**.

## Starting the flow

```http
POST /user/usr_123/change-email
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "new_email": "new@example.com",
  "verification_mode": "old_and_new",
  "redirect_uri": "https://app.example.com/settings/email-changed"
}
```

| Field               | Required | Description                                                                                                   |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `new_email`         | yes      | The address the user wants to switch to.                                                                      |
| `verification_mode` | no       | `new_only` or `old_and_new`. Overrides the tenant default — see [Verification modes](#verification-modes).    |
| `redirect_uri`      | no       | Where to send the user after they click the link. The status of the operation is appended as `?status=applied | pending_old`. |

Response:

```json
{
  "status": "verification_sent",
  "ticket_id": "tkt_abc",
  "verification_mode": "old_and_new"
}
```

Behind the scenes Faable creates a verification ticket (TTL 24h) and emails a confirmation link to the new address. Starting a new flow for the same user automatically revokes any pending ticket from a previous attempt.

## Verification modes

Two modes are supported, chosen at the **tenant** level via the account setting `email_change_verification_mode` (see [Configuring the tenant default](#configuring-the-tenant-default)):

### `new_only` (default)

A single confirmation link is sent to the **new** email. When the user clicks it:

1. The email swap is applied: `user.email` updates and `user.email_verified` is set to `true`.
2. The user is redirected to `redirect_uri` with `?status=applied`.
3. A **security alert** email is sent to the **old** address so the user notices if the change wasn't them.

### `old_and_new`

Two confirmation steps:

1. The first link goes to the **new** email. Clicking it issues a secondary ticket and emails it to the **old** address. The user is redirected to `redirect_uri` with `?status=pending_old`.
2. The second link goes to the **old** email. Clicking it finalizes the swap and redirects to `redirect_uri` with `?status=applied`.

This mode is meant for accounts where account takeover via a compromised new mailbox would be especially damaging.

### Policy escalation

The `verification_mode` field in the request body can only **raise** the bar, never lower it:

- If the tenant policy is `old_and_new`, passing `new_only` in the request is **ignored** — double verification is still required.
- If the tenant policy is `new_only`, the client can opt into `old_and_new` per request (for example, on a security-sensitive screen).

> [!TIP]
> If you don't set `verification_mode` on the request, the tenant default is used.

## Handling the redirect

After verification completes (or after step 1 of `old_and_new`), the user is sent back to your `redirect_uri` with a status query parameter:

| `?status=`    | When                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `applied`     | The email change is final. `user.email` is updated and verified.           |
| `pending_old` | First step of `old_and_new` done; waiting on the click in the old mailbox. |

If you omit `redirect_uri`, the user lands on a built-in fallback page at `/flow/email-change-done` on the auth host.

## Errors

| HTTP | Code                    | Meaning                                                                                                                 |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 400  | `same_as_current_email` | The `new_email` matches the current one (case-insensitive).                                                             |
| 409  | `email_already_exists`  | Another user in the same tenant already uses that address. The error is generic on purpose, to avoid email enumeration. |
| 401  | —                       | Missing/invalid bearer or no session cookie.                                                                            |
| 403  | —                       | The authenticated user doesn't match `:user_id`.                                                                        |

## Side effects

When the change completes, Faable stamps `user.email_change_locked_at` with the current timestamp. This prevents the email from being silently overwritten on subsequent OAuth logins (when the upstream IdP returns a different email), keeping the user's chosen address authoritative.

## Configuring the tenant default

The tenant-wide default mode lives on the Account resource as `email_change_verification_mode`. It accepts `new_only` (default) or `old_and_new`, and can be updated via the dashboard or the [Account update API](clients.md):

```http
POST /account/:account_id
Content-Type: application/json

{
  "email_change_verification_mode": "old_and_new"
}
```

## Notification emails

Two transactional emails are sent during this flow. Both are rendered with the tenant's branding (logo, colors) and translated into the user's locale (currently English and Spanish):

- **Verification email** — sent to the new address (and again to the old address in `old_and_new` mode) with the confirmation link.
- **Security alert** — sent to the previous address after the swap completes, so the user can react quickly if the change was unexpected.

You can override either template per-tenant from the dashboard.

## Next steps

- [Team Invitations](team-invitations.md) — invite users by email with a similar verification flow.
- [Logs](logs.md) — audit every email change attempt and delivery.
