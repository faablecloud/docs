---
title: Sessions
description: Every sign-in creates a session you can list and revoke — from the dashboard, the Management API, or by the user themselves. Revoking a session signs that device out of every application and kills its refresh tokens.
---

# Sessions

Every time a user authenticates — through the hosted login, a social provider, a passwordless code or the password grant — Faable Auth records a **Session**: the device, the application it signed in to, the IP, and when it was last used. The session is what the tokens of that sign-in belong to, so ending it ends them too.

Sessions let you answer "where is this user signed in?" and act on it: revoke a lost laptop, sign a user out everywhere after a password reset, or let users manage their own devices from your app.

## What a session is

A user signs in to Faable Auth **once** on your auth domain; the applications they then use each get their own tokens from that sign-in. The Session is the object behind it:

| Field              | Meaning                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `status`           | `active` or `revoked`. An active session whose `expires_at` has passed has expired: nothing can refresh it.  |
| `sid`              | The OpenID Connect session id. Every `id_token` minted for this session carries it as the `sid` claim.       |
| `client`           | The application the user signed in to.                                                                       |
| `ip`, `user_agent` | Where the sign-in came from, as seen at the last authentication.                                             |
| `last_seen_at`     | The last authentication or token refresh. Each refresh slides `expires_at` 30 days from here.                |
| `revoked_reason`   | `admin` (Management API or dashboard), `logout` (the user signed out), `user` (revoked from another device). |

A sign-in on a browser that already holds a session **re-uses** its row rather than adding one: a device is one session, however many times it signs in. A direct grant (passwordless code, password) has no browser cookie and gets one session per grant.

Rows stay for 90 days after the session ends, so the history is there when you need it.

## Revoking a session

Revoking is what makes a session real. When a session is revoked:

- the browser cookie behind it stops working;
- every **refresh token** issued through it is refused on its next use with `invalid_grant`;
- the row is marked `revoked`, with the reason, and kept for the history.

Access tokens and id tokens already issued keep working until they expire (up to their configured lifetime, typically an hour): they are self-contained and never checked against the server. Set short lifetimes on your APIs if you need revocation to bite faster.

Signing out through the `/logout` endpoint revokes the session the same way — a sign-out is not a cosmetic cookie clear.

### From the dashboard

Open the user (**Users → the user**). The **Sessions & devices** section lists the active sessions with their browser, operating system, application and IP, each with a **Revoke** button, and the recent history underneath.

### From the Management API

Sessions are a standard resource of the [Management API](academy/05-server-and-management-api.md). Listing needs `read:sessions`; revoking needs `update:sessions`.

| Method | Path                          | Purpose                                                    |
| ------ | ----------------------------- | ---------------------------------------------------------- |
| `GET`  | `/session`                    | List sessions (paginated, [FaableQL](logs.md) filterable). |
| `GET`  | `/session/:session_id`        | One session.                                               |
| `POST` | `/session/:session_id/revoke` | Revoke it. `409 session_already_revoked` on a second call. |

Filter by user and status, and expand the references you need:

```http
GET /session?query=user:user_…%20status:active&expand=client
```

```bash
curl -X POST https://<your-auth-domain>/session/session_…/revoke \
  -H "Authorization: Bearer <management token>"
```

There is no `DELETE`: deleting the row would lose the history the list exists for.

### By the user, from your application

Two endpoints work with the user's own session cookie or a bearer access token, like `/me`:

| Method | Path                         | Purpose                                                           |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| `GET`  | `/me/sessions`               | The caller's active sessions; `current_session_id` is this one.   |
| `POST` | `/me/sessions/revoke-others` | Sign the user out everywhere else. Returns how many were revoked. |

This is what a "sign out of all other devices" button calls. The session the request came through is never revoked by it.

## Tokens and sessions

Refresh tokens and access tokens carry the session they belong to as the `fsid` claim; id tokens carry the OIDC `sid`. Tokens issued before sessions existed carry neither: they keep working until they expire, and are replaced by session-bound ones on the user's next sign-in.
