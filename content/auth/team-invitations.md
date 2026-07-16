---
title: Team Invitations
description: Invite users to a team in Faable Auth by email. Existing tenant users are added directly; unknown emails get a verification link that creates the account on first click.
---

# Team Invitations

Teams in Faable Auth group users so you can grant permissions and roles collectively. The **Team Invitations** flow lets an authenticated user (typically an admin) add somebody to a team by email — no matter if the recipient already has an account in the tenant or not.

The flow handles three cases out of the box:

1. **The email already maps to a tenant user** → add them to the team immediately.
2. **The email is unknown** → email an invitation; when the recipient clicks, Faable creates the user (with `email_verified = true`, since the click proves ownership) and adds them to the team.
3. **The admin wants to notify the user even though they exist** → force-send an invitation email anyway.

## Endpoints

| Method   | Path                               | Purpose                                                  |
| -------- | ---------------------------------- | -------------------------------------------------------- |
| `POST`   | `/team/:team_id/invite`            | Create an invitation (or add directly).                  |
| `GET`    | `/team/:team_id/invite`            | List pending invitations for a team.                     |
| `DELETE` | `/team/:team_id/invite/:ticket_id` | Revoke a pending invitation.                             |
| `GET`    | `/invite-verify?ticket=…`          | Public entry point for the link in the invitation email. |

The first three require an account session (Bearer or cookie). `/invite-verify` is public — the ticket is proof of ownership. It's rate-limited to **5 requests per 10 seconds** per IP.

## Creating an invitation

```http
POST /team/team_42/invite
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "new.member@example.com",
  "roles": ["role_editor"],
  "mode": "auto",
  "redirect_uri": "https://app.example.com/welcome"
}
```

| Field          | Required | Default  | Description                                                                          |
| -------------- | -------- | -------- | ------------------------------------------------------------------------------------ |
| `email`        | yes      | —        | The address to invite.                                                               |
| `roles`        | no       | `[]`     | Role IDs to attach to the new team membership.                                       |
| `mode`         | no       | `"auto"` | `auto` adds existing users directly and emails unknown ones; `invite` always emails. |
| `redirect_uri` | no       | —        | Where to send the invitee after they accept. `?status=accepted` is appended.         |

### Response — user existed and was added (mode `auto`)

```json
{
  "status": "added",
  "member": {
    "id": "tm_…",
    "user": "usr_…",
    "team": "team_42",
    "roles": ["role_editor"]
  }
}
```

No email is sent in this branch — the user simply gets a `team.member.added` notification (see [below](#notification-emails)).

### Response — invitation was emailed

```json
{
  "status": "invited",
  "ticket_id": "tkt_…"
}
```

A ticket of type `team_invite` is created (TTL **7 days**) and an invitation email goes out. Re-inviting the same address to the same team revokes any earlier pending ticket.

## Invitation modes

### `auto` (default)

- If the email already belongs to a user in the same tenant → add immediately to the team (`status: "added"`).
- Otherwise → issue a ticket and email the invitee (`status: "invited"`).

### `invite`

Always issue a ticket and email — even when the user already exists. Useful when you want the user to receive a formal notification (e.g. linking them to a specific landing page) rather than being added silently.

## Accepting an invitation

When the invitee clicks the link in the email, their browser hits `GET /invite-verify?ticket=…`. Faable then:

1. Validates and consumes the ticket.
2. **Creates the user** if no user exists for that email yet. The user is created with `email_verified = true` (the click proves they own the inbox).
3. If the user existed but their email wasn't verified, marks it verified.
4. Adds the user to the team with the roles attached to the invitation.
5. Emits a `team.member.added` event (which triggers the welcome email — see below).
6. Redirects to the `redirect_uri` from the original invite request with `?status=accepted` appended. If no `redirect_uri` was provided, falls back to `/flow/team-invite-done` on the auth host.

The endpoint is **idempotent**: if the user is already a member of the team, it just redirects without error.

## Listing pending invitations

```http
GET /team/team_42/invite?expand=team,inviter,roles
```

Returns pending (non-expired) invitations for the team. You can filter using [FaableQL](logs.md#filtering) on the `email` field:

```
GET /team/team_42/invite?query=email:new.member@example.com
```

By default, `team`, `inviter`, and `roles` are returned as IDs. Use `?expand=` to inline the full objects.

## Revoking an invitation

```http
DELETE /team/team_42/invite/tkt_abc

→ 200 OK
{ "status": "revoked" }
```

Already-consumed or unknown tickets return an error.

## Notification emails

Two emails are involved in this flow:

- **`team_invite`** — sent to the invitee whenever a ticket is created (i.e. every invite except the "auto + existing user" fast path). Contains the team name, the inviter's name, and the acceptance link.
- **`team.member.added`** — sent to the newly-added user any time they end up in a team, whether through direct add or ticket acceptance. Includes a link to your application.

Both emails are localized (currently English and Spanish) and can be overridden per tenant from the dashboard.

## Next steps

- [Clients](clients.md) — register your application before driving any auth flow.
- [Logs](logs.md) — inspect invitation deliveries and acceptance events.
