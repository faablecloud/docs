---
title: Error codes
description: Every error Faable Auth returns carries a stable, machine-readable error_code. Branch on it — never on the message — and translate it into whatever your users should read.
---

# Error codes

Every error response from the Management API and the hosted flows has the same shape:

```json
{
  "status": 400,
  "message": "Invalid phone number. Include the country code, for example +34600123456.",
  "error_code": "invalid_phone",
  "docs": "https://faable.com/docs/auth/errors#invalid_phone",
  "details": { "fields": ["phone"] }
}
```

- **`error_code`** is the field to branch on. It is stable: a code is never renamed or reused with another meaning, and each code maps to exactly one HTTP status.
- **`message`** is written for a person and **may change between releases**. Show it in a log; do not compare it, and do not show it to end users as it is — map the code to your own copy instead.
- **`details`** is optional and structured. `validation_error` and `already_exists` carry `fields`; `validation_error` also carries `issues` (one `{ path, message }` per failing field).
- **`docs`** links to the entry for the code on this page.

A few codes carry a detail after a colon — `sms_unavailable:plan`, `sms_unavailable:quota`. Branch on the prefix.

The one exception is the OAuth token endpoint (`POST /oauth/token`), which answers in the [RFC 6749 shape](oauth-flows) — `{ "error", "error_description" }` — and carries `error_code` as an extension member when the canonical `error` is too coarse (for example `invalid_grant` with `error_code: "user_suspended"`).

## With the SDK

`@faable/auth-sdk` throws a `FaableApiError` on any non-2xx. The code is on the error, and every generated method lists the codes it can throw in its docstring:

```ts
import { FaableApiError, FaableAuthApi } from '@faable/auth-sdk'

try {
  await auth.userCreate({ name, email, phone })
} catch (e) {
  if (e instanceof FaableApiError) {
    switch (e.error_code) {
      case 'already_exists':
        return 'That email is already registered.'
      case 'invalid_phone':
        return 'Write the phone with its country code, e.g. +34 600 123 456.'
      case 'validation_error':
        return `Check ${e.details?.fields?.join(', ')}.`
    }
    if (e.isErrorCode('sms_unavailable'))
      return 'SMS is not available right now.'
  }
  throw e
}
```

`ErrorCode` is exported as a TypeScript union, so a `switch` over it is checked by the compiler.

## The OpenAPI document

Every operation in [`/docs/json`](https://faable.auth.faable.link/docs/json) documents its error responses: one entry per status, with `error_code` restricted to the codes that operation can emit. Code generators pick them up from there.

## Generic codes

When an error has no more specific code, `error_code` is derived from the status. You will always get one of these at minimum; the specific codes below are what you should reach for first.

| Code                     | Status |
| ------------------------ | ------ |
| `bad_request`            | 400    |
| `validation_error`       | 400    |
| `unauthorized`           | 401    |
| `payment_required`       | 402    |
| `forbidden`              | 403    |
| `not_found`              | 404    |
| `method_not_allowed`     | 405    |
| `conflict`               | 409    |
| `payload_too_large`      | 413    |
| `unsupported_media_type` | 415    |
| `unprocessable_entity`   | 422    |
| `too_many_requests`      | 429    |
| `internal_error`         | 500    |

## All codes

Generated from the server's catalogue (`npm run dump-error-codes` in the auth service); the list is the same one the OpenAPI `ErrorCode` schema enumerates.

| Code                                                                  | Status | Meaning                                                                                                                                |
| --------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="already_exists"></a>`already_exists`                           | 400    | A resource with the same unique field already exists (for a user, usually `email`). `details.fields` names the field.                  |
| <a id="already_member"></a>`already_member`                           | 400    | The user is already a member of the team.                                                                                              |
| <a id="ambiguous_connection"></a>`ambiguous_connection`               | 400    | Several connections match; pass `connection_id`.                                                                                       |
| <a id="bad_request"></a>`bad_request`                                 | 400    | The request is malformed. `message` says what is wrong.                                                                                |
| <a id="connection_misconfigured"></a>`connection_misconfigured`       | 400    | The connection is missing settings needed to talk to its provider.                                                                     |
| <a id="connection_required"></a>`connection_required`                 | 400    | No connection was given and the client has no `default_connection`.                                                                    |
| <a id="expired_link"></a>`expired_link`                               | 400    | The magic link token was not found or has expired.                                                                                     |
| <a id="factor_already_confirmed"></a>`factor_already_confirmed`       | 400    | The factor was already confirmed.                                                                                                      |
| <a id="factor_not_found"></a>`factor_not_found`                       | 400    | No factor with that id belongs to this user.                                                                                           |
| <a id="flow_not_found"></a>`flow_not_found`                           | 400    | The login flow does not exist in this account.                                                                                         |
| <a id="identity_orphaned"></a>`identity_orphaned`                     | 400    | The identity pointed at a user that no longer exists; it was removed. Sign in again.                                                   |
| <a id="invalid_client"></a>`invalid_client`                           | 400    | The `client_id` in the request does not name a client of this account.                                                                 |
| <a id="invalid_client_metadata"></a>`invalid_client_metadata`         | 400    | Dynamic client registration rejected a field (RFC 7591). `message` names it.                                                           |
| <a id="invalid_code"></a>`invalid_code`                               | 400    | The verification code is wrong, expired or already used.                                                                               |
| <a id="invalid_connection"></a>`invalid_connection`                   | 400    | The connection does not exist, is disabled, or is not of the type this flow needs.                                                     |
| <a id="invalid_credentials"></a>`invalid_credentials`                 | 400    | The email/username or password is incorrect.                                                                                           |
| <a id="invalid_device_code"></a>`invalid_device_code`                 | 400    | The device or user code is invalid or expired.                                                                                         |
| <a id="invalid_email"></a>`invalid_email`                             | 400    | The email address is not valid.                                                                                                        |
| <a id="invalid_expand"></a>`invalid_expand`                           | 400    | An `?expand=` path is not allowed on this resource.                                                                                    |
| <a id="invalid_factor"></a>`invalid_factor`                           | 400    | The factor cannot be verified (no secret material).                                                                                    |
| <a id="invalid_id"></a>`invalid_id`                                   | 400    | The id in the path is not a valid id for this resource.                                                                                |
| <a id="invalid_link"></a>`invalid_link`                               | 400    | The magic link is malformed.                                                                                                           |
| <a id="invalid_phone"></a>`invalid_phone`                             | 400    | The phone number is not E.164 and could not be resolved with the account default country. Include the country code.                    |
| <a id="invalid_query"></a>`invalid_query`                             | 400    | The `?query=` FaableQL expression could not be parsed.                                                                                 |
| <a id="invalid_redirect_uri"></a>`invalid_redirect_uri`               | 400    | The redirect URI is not registered for the client.                                                                                     |
| <a id="invalid_request"></a>`invalid_request`                         | 400    | A required OAuth parameter is missing or two of them are incompatible. `message` says which.                                           |
| <a id="invalid_role"></a>`invalid_role`                               | 400    | The role belongs to another account.                                                                                                   |
| <a id="invalid_state"></a>`invalid_state`                             | 400    | The `state` is missing, expired, or does not describe a resumable step.                                                                |
| <a id="invalid_ticket"></a>`invalid_ticket`                           | 400    | The ticket does not exist or is not the kind this endpoint accepts.                                                                    |
| <a id="invite_used"></a>`invite_used`                                 | 400    | The invite was already accepted.                                                                                                       |
| <a id="malformed_credential"></a>`malformed_credential`               | 400    | The WebAuthn credential is malformed.                                                                                                  |
| <a id="no_passkey_enrolled"></a>`no_passkey_enrolled`                 | 400    | The user has no passkey to sign in with.                                                                                               |
| <a id="no_provider_token"></a>`no_provider_token`                     | 400    | The identity holds no provider access token.                                                                                           |
| <a id="no_refresh_token"></a>`no_refresh_token`                       | 400    | The identity holds no provider refresh token, so it cannot be refreshed.                                                               |
| <a id="no_usable_factor"></a>`no_usable_factor`                       | 400    | The user has no confirmed second factor to challenge.                                                                                  |
| <a id="passkey_login_disabled"></a>`passkey_login_disabled`           | 400    | Sign in with a passkey is not enabled for this client.                                                                                 |
| <a id="passkey_verification_failed"></a>`passkey_verification_failed` | 400    | The WebAuthn response could not be verified.                                                                                           |
| <a id="password_too_weak"></a>`password_too_weak`                     | 400    | The password does not meet the connection policy. `message` lists each unmet rule.                                                     |
| <a id="passwordless_unavailable"></a>`passwordless_unavailable`       | 400    | No passwordless connection is configured or enabled for this client.                                                                   |
| <a id="phone_changed"></a>`phone_changed`                             | 400    | The phone on the user changed after the code was sent. Start again.                                                                    |
| <a id="provider_error"></a>`provider_error`                           | 400    | The upstream identity provider returned an error. `message` carries it.                                                                |
| <a id="same_email"></a>`same_email`                                   | 400    | The new email is the same as the current one.                                                                                          |
| <a id="search_not_supported"></a>`search_not_supported`               | 400    | This resource does not support `?search=`.                                                                                             |
| <a id="team_required"></a>`team_required`                             | 400    | An Auth Account must belong to a project (team).                                                                                       |
| <a id="ticket_expired"></a>`ticket_expired`                           | 400    | The ticket is past its expiry.                                                                                                         |
| <a id="ticket_used"></a>`ticket_used`                                 | 400    | The ticket was already consumed.                                                                                                       |
| <a id="user_has_no_email"></a>`user_has_no_email`                     | 400    | The operation needs an email but the user has none.                                                                                    |
| <a id="validation_error"></a>`validation_error`                       | 400    | The body, query or path failed schema validation. `details.issues` lists each failing field.                                           |
| <a id="access_denied"></a>`access_denied`                             | 401    | The caller may not access this row (ownership or machine-to-machine restriction).                                                      |
| <a id="action_unavailable"></a>`action_unavailable`                   | 401    | The Action that paused this login is disabled or belongs elsewhere.                                                                    |
| <a id="client_credentials_denied"></a>`client_credentials_denied`     | 401    | An Action denied the client_credentials grant. `message` carries the reason.                                                           |
| <a id="client_mismatch"></a>`client_mismatch`                         | 401    | The client belongs to a different account.                                                                                             |
| <a id="invalid_otp"></a>`invalid_otp`                                 | 401    | The one-time password is wrong or expired.                                                                                             |
| <a id="invalid_passkey"></a>`invalid_passkey`                         | 401    | The passkey assertion did not verify.                                                                                                  |
| <a id="invalid_token"></a>`invalid_token`                             | 401    | The bearer token is missing, malformed, expired or has no subject.                                                                     |
| <a id="login_denied"></a>`login_denied`                               | 401    | A post-login Action denied the sign-in. `message` carries the reason it gave. On token grants it is a 403 with `error: invalid_grant`. |
| <a id="mfa_invalid_code"></a>`mfa_invalid_code`                       | 401    | The authenticator code did not verify.                                                                                                 |
| <a id="mfa_invalid_recovery_code"></a>`mfa_invalid_recovery_code`     | 401    | The recovery code did not verify.                                                                                                      |
| <a id="mfa_pending"></a>`mfa_pending`                                 | 401    | A second-factor challenge is pending; answer it before continuing.                                                                     |
| <a id="not_logged_in"></a>`not_logged_in`                             | 401    | There is no signed-in session for this request.                                                                                        |
| <a id="session_missing"></a>`session_missing`                         | 401    | The session that started this login no longer exists.                                                                                  |
| <a id="state_mismatch"></a>`state_mismatch`                           | 401    | The `state` belongs to another account, session, client or ceremony.                                                                   |
| <a id="totp_not_allowed"></a>`totp_not_allowed`                       | 401    | This account does not accept authenticator apps.                                                                                       |
| <a id="unauthorized"></a>`unauthorized`                               | 401    | The request carries no valid credentials.                                                                                              |
| <a id="unknown_passkey"></a>`unknown_passkey`                         | 401    | The passkey is not enrolled for this user.                                                                                             |
| <a id="payment_required"></a>`payment_required`                       | 402    | The feature is not included in the current plan.                                                                                       |
| <a id="plan_required"></a>`plan_required`                             | 402    | The setting requires a higher plan. `message` says which.                                                                              |
| <a id="audience_not_found"></a>`audience_not_found`                   | 403    | The `audience` does not name an API registered in this account.                                                                        |
| <a id="forbidden"></a>`forbidden`                                     | 403    | The credentials are valid but do not allow this operation.                                                                             |
| <a id="insufficient_scope"></a>`insufficient_scope`                   | 403    | The token lacks a scope this operation requires. `message` names it.                                                                   |
| <a id="interaction_required"></a>`interaction_required`               | 403    | An Action asked for a redirect on a non-interactive flow.                                                                              |
| <a id="mfa_required"></a>`mfa_required`                               | 403    | The login needs a second factor that this flow cannot collect, or one is still pending on the session.                                 |
| <a id="not_owner"></a>`not_owner`                                     | 403    | The caller may only perform this operation on their own user.                                                                          |
| <a id="origin_not_allowed"></a>`origin_not_allowed`                   | 403    | The request `Origin` is not in the client's Allowed Web Origins.                                                                       |
| <a id="signup_denied"></a>`signup_denied`                             | 403    | A pre-signup Action or an active block denied the sign-up. `message` carries the reason.                                               |
| <a id="signup_disabled"></a>`signup_disabled`                         | 403    | Self-service sign-up is disabled on this connection.                                                                                   |
| <a id="step_up_required"></a>`step_up_required`                       | 403    | Confirm an existing factor before changing your factors.                                                                               |
| <a id="system_resource"></a>`system_resource`                         | 403    | The resource is managed by Faable and cannot be modified or deleted.                                                                   |
| <a id="user_suspended"></a>`user_suspended`                           | 403    | The user is suspended and cannot sign in or be modified.                                                                               |
| <a id="account_not_found"></a>`account_not_found`                     | 404    | No Auth Account matches the request (domain, header or token).                                                                         |
| <a id="client_not_found"></a>`client_not_found`                       | 404    | No client with that `client_id`.                                                                                                       |
| <a id="credential_not_found"></a>`credential_not_found`               | 404    | The user has no password credential on this connection.                                                                                |
| <a id="invite_not_found"></a>`invite_not_found`                       | 404    | No invite with that id in this account.                                                                                                |
| <a id="not_a_member"></a>`not_a_member`                               | 404    | The user is not a member of the team.                                                                                                  |
| <a id="not_found"></a>`not_found`                                     | 404    | The resource does not exist in this account.                                                                                           |
| <a id="revision_not_found"></a>`revision_not_found`                   | 404    | The revision is not in the flow history.                                                                                               |
| <a id="role_not_found"></a>`role_not_found`                           | 404    | No role with that id in this account.                                                                                                  |
| <a id="ticket_not_found"></a>`ticket_not_found`                       | 404    | No ticket with that id belongs to this user.                                                                                           |
| <a id="method_not_allowed"></a>`method_not_allowed`                   | 405    | The HTTP method is not supported on this path.                                                                                         |
| <a id="account_limit_reached"></a>`account_limit_reached`             | 409    | The project already has the maximum number of Auth Accounts.                                                                           |
| <a id="conflict"></a>`conflict`                                       | 409    | The request conflicts with the current state of the resource.                                                                          |
| <a id="email_taken"></a>`email_taken`                                 | 409    | Another user in this account already uses that email.                                                                                  |
| <a id="identity_already_linked"></a>`identity_already_linked`         | 409    | That external identity is already linked to another user.                                                                              |
| <a id="identity_conflict"></a>`identity_conflict`                     | 409    | The user already has a linked identity for this connection.                                                                            |
| <a id="identity_link_denied"></a>`identity_link_denied`               | 409    | That external identity cannot be linked to this user.                                                                                  |
| <a id="phone_already_verified"></a>`phone_already_verified`           | 409    | The user already has a verified phone; the number cannot be swapped from the screen.                                                   |
| <a id="sms_failed"></a>`sms_failed`                                   | 409    | The SMS provider rejected the message.                                                                                                 |
| <a id="sms_unavailable"></a>`sms_unavailable`                         | 409    | This account cannot send SMS right now. The suffix says why: `sms_unavailable:plan`, `:quota`, `:provider`.                            |
| <a id="payload_too_large"></a>`payload_too_large`                     | 413    | The request body exceeds the size limit.                                                                                               |
| <a id="unsupported_media_type"></a>`unsupported_media_type`           | 415    | The `Content-Type` is not accepted by this endpoint.                                                                                   |
| <a id="unprocessable_entity"></a>`unprocessable_entity`               | 422    | The request is well-formed but cannot be processed.                                                                                    |
| <a id="too_many_attempts"></a>`too_many_attempts`                     | 429    | Too many wrong codes. Wait a few minutes and try again.                                                                                |
| <a id="too_many_requests"></a>`too_many_requests`                     | 429    | Rate limit exceeded. Honour the `Retry-After` header.                                                                                  |
| <a id="internal_error"></a>`internal_error`                           | 500    | Unexpected server error. Retry later; the request id is logged.                                                                        |
| <a id="login_flow_misconfigured"></a>`login_flow_misconfigured`       | 500    | The login flow of this account cannot run. `message` carries the node error.                                                           |
