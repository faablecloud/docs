---
title: Phone verification
description: Verify a user's mobile number with an SMS code, so it can later carry password-recovery codes when email does not reach them.
---

# Phone verification

A verified mobile number is what lets Faable Auth send a password-recovery code by SMS when the email does not reach the person — common with university, hospital and corporate mailboxes that quarantine automated mail. Nothing is ever sent to a number that has not been verified first.

Phone verification is available on **Hobby** and **Pro**. It uses the tenant's monthly SMS allowance; see [Pricing](pricing.mdx).

## Collect a mobile, not a "contact phone"

Most people type their number without an international prefix (`636647460`). Two things make that usable:

1. Ask for a **mobile** explicitly, with `<input type="tel">`. A landline cannot receive SMS.
2. Set the account's **default country** (`default_country_iso`, e.g. `ES`) in the dashboard under _Settings_. Numbers without a prefix are normalised to E.164 (`+34636647460`) using it. Numbers that already carry a prefix are left as they are.

## Start a verification

```http
POST /user/{user_id}/verify-phone/start
Authorization: Bearer <token>
Content-Type: application/json

{ "phone": "636647460" }
```

`phone` is optional: when omitted, the code goes to the phone already stored on the user. When given, it replaces the user's phone (normalised) and marks it unverified until the code is confirmed.

Who may call it — the same rule as the email verification endpoints:

- the user themself, with their session or a bearer token of their own;
- a **machine token** (client credentials) — the usual way from your backend right after signup;
- an administrator of another tenant.

Response:

```json
{
  "status": "sent",
  "destination_masked": "···· 460",
  "state": "3f9c…",
  "expires_in": 600
}
```

The `state` is an opaque handle that identifies this verification. Send the person to the hosted screen with it:

```
https://<your-auth-domain>/flow/verify-phone?state=3f9c…&next=/welcome
```

`next` is optional and must be a path on the same site. The screen asks for the code and, once verified, continues to `next`.

If SMS cannot go out right now the request fails with **409** and an `error_code` that says why: `sms_unavailable:plan` (plan does not include SMS), `sms_unavailable:included` (monthly allowance exhausted on a plan that does not meter overage), `sms_unavailable:no_provider` (SMS is not enabled on this platform). Fall back to email in that case.

## Confirm the code

The hosted screen does this for you. To build your own:

```http
POST /verify-phone/confirm
Content-Type: application/json

{ "state": "3f9c…", "code": "482913" }
```

No session is required: the `state` and the code are the proof. The code is valid for 10 minutes and for **five attempts**; after that the `state` is burned and a new verification must be started. On success the user gets `phone_verified: true` and `phone_verified_method: "sms_otp"`.

## From the dashboard

On a user's page, _Phone verified_ offers **Send verification code**. The code goes to the user's phone; if you are on a call with them, type the code they read back to you and the phone is verified without them leaving the call. The manual _mark as verified_ toggle is still there for the cases without a mobile.

## What is recorded

Every step leaves an audit row: `message.phone_verify` (sent, or why not), `user.phone_verification.request` and `user.phone_verification.confirm`. The code itself never appears in any of them.
