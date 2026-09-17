---
title: Phone verification
description: Verify a user's mobile number with an SMS code, so it can later carry password-recovery codes when email does not reach them.
---

# Phone verification

A verified mobile number is what lets Faable Auth send a password-recovery code by SMS when the email does not reach the person — common with university, hospital and corporate mailboxes that quarantine automated mail. Nothing is ever sent to a number that has not been verified first.

Phone verification is available on **Hobby** and **Pro**. It uses the tenant's monthly SMS allowance; see [Pricing](pricing.mdx).

## Phone numbers are stored in E.164

Wherever a phone number reaches Faable Auth — `POST /user`, `POST /user/{id}`, phone verification — it is stored in E.164 (`+34636647460`) or the write is refused:

1. A number that already carries an international prefix is stored as it is.
2. A number without one (`636647460`, how most people type it) is resolved with the account's **default country** — `default_country_iso`, set in the dashboard under _Settings_.
3. Anything that still cannot be resolved is refused with **400** and `error_code: "invalid_phone"`.

So **set the default country before your backend starts writing phone numbers**. Without it, every national number is refused, and a number stored in some other shape can never receive an SMS.

Two more things make the data usable:

- Ask for a **mobile** explicitly, with `<input type="tel">`. A landline cannot receive SMS.
- Better, collect the country code in the form itself, so the number arrives in E.164 and the default country never has to guess. The hosted screens do this.

Reading a user back tells you where they stand: `phone_e164` is `true` when the stored number is a usable E.164. A `false` there is a number stored before this rule existed — no SMS will reach it until it is written again in a shape we can resolve.

## Start a verification

```http
POST /user/{user_id}/verify-phone/start
Authorization: Bearer <token>
Content-Type: application/json

{ "phone": "636647460" }
```

`phone` is optional: when omitted, the code goes to the phone already stored on the user. When given, it replaces the user's phone (normalised as above, or **400** `invalid_phone`) and marks it unverified until the code is confirmed.

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

## When the number is wrong

The person is looking at a code that went somewhere they cannot read. The hosted screen offers _"that's not my number"_, which replaces the number and sends a new code; if you build your own, it is:

```http
POST /verify-phone/restart
Content-Type: application/json

{ "state": "3f9c…", "phone": "+34600333444" }
```

It answers like `start`, with a **new** `state` — the previous one stops working. Use `GET /verify-phone/pending?state=…` to render the screen: it returns the masked destination, the seconds left, whether the number may still be changed, and the account's default country.

Correcting the number needs no session, the `state` is the proof — so it is refused with **409** `phone_already_verified` once the person has a verified phone. From that point on, a `state` that leaked cannot move where the codes go.

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

Every step leaves an audit row: `message.phone_verify` (sent, or why not), `user.phone_verification.request`, `user.phone_verification.restarted` (with both numbers masked) and `user.phone_verification.confirm`. The code itself never appears in any of them.
