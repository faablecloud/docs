---
title: Teams, Invitations and Members
description: Invite people to a team in Faable Auth by email, let them accept on your own page or from a notice inside your app, and manage members and roles — with every change in the tenant's log and in your webhooks.
---

# Teams, Invitations and Members

Teams in Faable Auth group users so you can grant roles collectively. This page covers the whole membership lifecycle: inviting someone by email, accepting (from the email link, on your own page, or from a "pending invitation" notice in your app), declining, changing roles and removing members.

All endpoints here are part of the **Management API**: call them from your backend with a token of a client that holds the `…:teammembers` scopes. The only public endpoint is `/invite-verify`, the default target of the email link.

## Endpoints

| Method   | Path                               | Scope                | Purpose                                               |
| -------- | ---------------------------------- | -------------------- | ----------------------------------------------------- |
| `POST`   | `/team/:team_id/invite`            | `create:teammembers` | Invite by email (or add an existing user directly).   |
| `GET`    | `/team/:team_id/invite`            | `read:teammembers`   | List a team's pending invitations.                    |
| `DELETE` | `/team/:team_id/invite/:invite_id` | `delete:teammembers` | Revoke a pending invitation.                          |
| `POST`   | `/team/invite/accept`              | `create:teammembers` | Accept for a signed-in user (by link token or by id). |
| `POST`   | `/team/invite/decline`             | `create:teammembers` | Decline for a signed-in user.                         |
| `GET`    | `/user/:user_id/team-invites`      | `read:teammembers`   | A user's own pending invitations, across teams.       |
| `POST`   | `/team/:team_id/member/:user_id`   | `update:teammembers` | Replace a member's roles.                             |
| `DELETE` | `/team/:team_id/member/:user_id`   | `delete:teammembers` | Remove a member.                                      |
| `GET`    | `/invite-verify?token=…`           | public               | Default target of the email link.                     |

## Inviting

```http
POST /team/team_42/invite
Authorization: Bearer <management_token>
Content-Type: application/json

{
  "email": "new.member@example.com",
  "roles": ["role_editor"],
  "mode": "invite",
  "accept_url": "https://app.example.com/invite",
  "redirect_uri": "https://app.example.com/projects/42",
  "inviter_user_id": "user_…"
}
```

| Field             | Required | Default  | Description                                                                                                                            |
| ----------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `email`           | yes      | —        | The address to invite.                                                                                                                 |
| `roles`           | no       | `[]`     | Role ids the membership will hold. They must be roles of the same tenant (`invalid_role` otherwise).                                   |
| `mode`            | no       | `"auto"` | `auto` adds an existing user of the tenant directly and emails anyone else; `invite` always emails and waits for the person to accept. |
| `accept_url`      | no       | —        | Your page for accepting. The email link becomes `accept_url#<token>` (see [Accepting on your own page](#accepting-on-your-own-page)).  |
| `redirect_uri`    | no       | —        | Where the person lands once in. It is also the button of the "you were added" email.                                                   |
| `inviter_user_id` | no       | caller   | The person inviting, when your backend calls with a machine token. The email names them. Must be a user of the tenant.                 |

`accept_url` and `redirect_uri` must be on one of the tenant's own origins (the callback hosts of its clients); anything else is `invalid_invite_url`.

The response is `{ "status": "added", "member": … }` when an existing user was added directly, or `{ "status": "invited", "ticket_id": "…" }` when an invitation went out. An invitation lasts **7 days**. Inviting the same address to the same team again replaces the pending one: the old link stops working.

## Accepting

There are three ways in. In all of them, a membership is created **only for the invited address**.

### From the email link (default)

Without `accept_url`, the email links to `GET /invite-verify?token=…` on the auth host. Faable consumes the invitation, **creates the user** if nobody has that email yet (with `email_verified = true`, since the click proves the inbox), adds them to the team and redirects to `redirect_uri` with `?status=accepted`, or to `/flow/team-invite-done` when there is none. It is idempotent for someone who is already a member, and rate-limited to 10 requests per 10 seconds per IP.

### Accepting on your own page

With `accept_url`, the link opens your page with the token in the URL **fragment** (`#…`), so it never reaches a server log, a `Referer` or an analytics pageview. Your page signs the person in — with any method — and your backend accepts for them:

```http
POST /team/invite/accept
Authorization: Bearer <management_token>
Content-Type: application/json

{ "token": "<from the fragment>", "user_id": "user_…" }
```

This path **never creates a user and never verifies an email**. The user must already exist in the tenant and have the invited email, **verified**. Otherwise:

| Error code                | Meaning                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `invite_email_mismatch`   | Signed in as someone else. `details.invited_email` carries the invited address, masked (`n•••@example.com`). |
| `invite_email_unverified` | The address matches but isn't verified yet.                                                                  |
| `ticket_expired`          | Older than 7 days.                                                                                           |
| `ticket_used`             | Already accepted, declined or revoked.                                                                       |
| `invalid_ticket`          | No such invitation.                                                                                          |

The answer is `{ status: "accepted" | "already_member", team_id, user_id, roles }`. Strip the fragment from the URL before any analytics or error-tracking script loads.

### From a notice inside your app

A person who already has an account shouldn't depend on finding the email. List their invitations when they sign in and let them answer in place:

```http
GET /user/user_…/team-invites
→ { "email_verified": true, "data": [ { "id": "ticket_…", "team": "team_42", "roles": [...], "inviter": "user_…", "expires_at": "…" } ] }
```

Invitations are listed only when the user's email is **verified** — an unverified address could be anybody's — otherwise the answer is `email_verified: false` and an empty list. Then accept or decline by id:

```http
POST /team/invite/accept    { "invite_id": "ticket_…", "user_id": "user_…" }
POST /team/invite/decline   { "invite_id": "ticket_…", "user_id": "user_…" }
```

Both apply the same check as the token (verified email equal to the invited one) and the same error codes. Declining spends the invitation: its link stops working and it leaves the team's pending list.

## Managing members

```http
POST /team/team_42/member/user_…
{ "roles": ["role_viewer"], "actor_user_id": "user_…" }

DELETE /team/team_42/member/user_…?actor_user_id=user_…
```

Changing roles replaces the whole list (`[]` leaves the member with none). `actor_user_id` is optional: when your backend acts on behalf of a person with a machine token, name them and the tenant's log will say who did it instead of your backend. It must be a user of the tenant, or the call fails with `404` before changing anything.

A user is a member of a team **at most once**; adding someone who already is returns `already_member`.

## Events and webhooks

Every change emits an event you can receive through a [notification subscription](logs.md) webhook. Team events are **notices, not state**: they carry ids and roles, and your receiver reads whatever else it needs.

| Event                  | When                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `team.member.added`    | Someone joined. `method`: `direct`, `invite_auto` or `invite_accepted`.                        |
| `team.member.updated`  | Roles changed. Carries `roles` and `previous_roles`.                                           |
| `team.member.removed`  | Someone was removed or left.                                                                   |
| `team.invite.created`  | An invitation went out.                                                                        |
| `team.invite.accepted` | An invitation was accepted.                                                                    |
| `team.invite.revoked`  | An invitation stopped being valid. `reason`: `revoked`, `replaced` (re-invited) or `declined`. |

The same changes are written to the tenant's [log](logs.md), filterable by team: `GET /log?query=team:team_42 origin:team`.

## Notification emails

- **`team_invite`** — to the invitee whenever an invitation is created. Names the inviter when there is one, and links to `accept_url#<token>` or to `/invite-verify`.
- **`team.member.added`** — to the person once they are in, however they got there. Its button opens `redirect_uri` when the invitation had one.

Both are localized (English and Spanish) and can be overridden per tenant from the dashboard.

## Next steps

- [Clients](clients.md) — register the backend client that calls the Management API.
- [Logs](logs.md) — inspect invitations, acceptances and membership changes.
