---
title: Email Sending
description: Which address Faable Auth sends your tenant's email from, how replies are handled, and how to point them at your own support inbox.
---

# Email Sending

Faable Auth sends email on your behalf: access codes, email verification, password resets, team invitations and security alerts. This page covers what your users see in the `From` line and where their replies go.

## What your users see

Every message uses **your tenant's name as the display name** and a Faable address as the envelope:

```txt
From: Acme <no-reply@auth.faable.com>
```

You do not need to configure anything, prove domain ownership, or add DNS records. The sending domain is authenticated by Faable with DKIM, a dedicated Return-Path and a `DMARC` policy of `reject`, which is what keeps these messages out of spam and stops anyone spoofing them.

The address is deliberately **separate from the one Faable uses for its own product email**. Reputation is per sending domain: if one tenant mails a list of stale addresses and collects bounces, the damage stays with authentication mail and does not reach anything else.

## Replies

The `From` address is a `no-reply@` mailbox — nobody reads it, and Faable cannot answer questions about your product on your behalf.

If you want your users to be able to reply, set a **Reply-To** on the account. Every email your tenant sends then carries it, and a reply lands in your own inbox instead of disappearing:

```http
POST /account/{account_id}
Content-Type: application/json

{
  "email_reply_to": "support@acme.com"
}
```

Send `null` to remove it and go back to no replies.

| Field            | Effect                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| `email_reply_to` | Address in the `Reply-To` header of every email this tenant sends.       |
| unset or `null`  | No `Reply-To` header, so a reply goes to the unread `no-reply@` mailbox. |

> [!TIP]
> Use an address that a person or a helpdesk actually monitors. A user who replies to a login code is usually a user in trouble.

## What you can customise

| What             | How                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------- |
| Display name     | The account name — it is what appears before the address.                           |
| Logo             | `logo_src` on the account; falls back to the Faable emblem.                         |
| Language         | `enabled_locales` (`en`, `es`). The recipient's own locale wins when you enable it. |
| Reply address    | `email_reply_to`, above.                                                            |
| Subject and body | A custom template per event type, which overrides the built-in one.                 |
| Welcome email    | See [Signup](signup.md#welcome-email).                                              |

The envelope address itself is not configurable: it is what carries the authentication that gets these messages delivered.

## Bounces

A hard bounce or a spam complaint marks the address undeliverable and Faable stops sending to it for 30 days, so one bad address does not keep damaging delivery for everyone. Every attempt is recorded — see [Logs](logs.md) and look for `email.*` entries, which carry the recipient, the outcome and, when a send is skipped, the reason.
