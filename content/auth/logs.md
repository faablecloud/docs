---
title: Logs
description: Inspect notification deliveries, webhook calls, and other account events from the Faable Auth Logs API. Read-only, paginated, FaableQL-filterable.
---

# Logs

Faable Auth records significant account events — email deliveries, webhook calls, authentication events, and more — in a **Logs** resource. You can query it from the dashboard or via the API to audit what happened, debug delivery problems, and feed your own observability pipeline.

Logs are **read-only**: entries are written by the system and cannot be deleted by API. Some entry types are configured to auto-expire (Mongo TTL); others persist indefinitely so they can serve as an audit trail.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/logs` | List logs (paginated). |
| `GET` | `/logs/:log_id` | Fetch a single log entry. |

Both require an authenticated account session.

## Anatomy of a log entry

```json
{
  "id": "log_…",
  "account": "acc_…",
  "type": "email.team_invite",
  "status": "success",
  "message": "Sent to invitee",
  "data": {
    "to": "new.member@example.com",
    "from": "no-reply@example.com",
    "event_type": "team_invite",
    "source": "builtin",
    "subject": "You've been invited to Project X",
    "message_id": "<…@example.com>"
  },
  "expires_at": null,
  "createdAt": "2026-05-12T10:42:01.000Z",
  "updatedAt": "2026-05-12T10:42:01.000Z"
}
```

| Field | Description |
|-------|-------------|
| `type` | A dotted string identifying the event family. Examples: `email.user.welcome`, `email.team_invite`, `webhook.user.created`. |
| `status` | One of `success`, `failed`, `skipped`, `info`. |
| `message` | Short human-readable description (often the error message when `status=failed`). |
| `data` | Type-specific structured payload — its shape depends on the log type. |
| `expires_at` | When set, the row is deleted automatically by Mongo's TTL index at that time. |

## Common log types

### `email.*` — notification deliveries

Recorded for every transactional email Faable sends (welcome, passwordless OTP, team invite, change-email, security alerts, custom templates…).

`data` includes:

- `to`, `from`, `subject`
- `event_type` — the trigger that produced the email
- `source` — `builtin`, `custom` (your override), or `external` (Auth0-style template provider)
- `message_id` — the provider's message identifier (useful for tracing in your ESP)
- `error` — populated when `status=failed`

### `webhook.*` — webhook deliveries

One entry per webhook attempt.

`data` includes:

- `subscription_id` — which subscription was fired
- `event_id`, `event_type` — what was delivered
- `duration_ms` — request duration
- `request`, `response` — bodies truncated at 64 KB
- `error` — present on timeouts or non-2xx responses

See [Webhooks](extensibility/webhooks.md) for the delivery contract.

## Filtering

The `?query=` parameter accepts **FaableQL** — a compact filter syntax used across Faable resources. Field-value pairs are colon-separated:

```
GET /logs?query=type:email.user.welcome&pageSize=50
GET /logs?query=status:failed&pageSize=20
GET /logs?query=type:webhook.user.created status:failed
```

Pagination follows the standard Faable cursor pattern (`pageSize`, `cursor`).

## Retention

- Entries without `expires_at` persist indefinitely.
- Entries written with a TTL (e.g. high-volume PII-containing events like login records) disappear automatically once the TTL elapses.

If you need long-term retention beyond the defaults, mirror logs to your own warehouse using [Webhooks](extensibility/webhooks.md).

## Next steps

- [Webhooks](extensibility/webhooks.md) — stream events to your own backend in real time.
- [Change Email](change-email.md) and [Team Invitations](team-invitations.md) — flows that produce many of the `email.*` log entries.
