---
title: Self-Service Account
description: Let signed-in users see how they sign in, set or change their password, and save your app's own profile fields — with their session, no client secret and no Management API.
---

# Self-Service Account

A profile screen usually needs three things from the auth server: whether the user has a password, a way to set or change it, and a place to save a few app-specific profile fields. Faable Auth exposes all three to **the signed-in user**, so your app calls them with the user's session or access token. Nothing here needs a `client_secret` or the Management API, and a user can only ever act on their own account.

## Client library

From a signed-in session, [`@faable/auth-js`](quickstart/nextjs.mdx) has one method per endpoint:

```ts
// "Set a password" or "Change password"?
const { data } = await auth.getCredentials()
// data: { has_password: false,
//         connections: [{ id: 'connection_…', name: 'google', type: 'google_oauth2' }] }

// Change an existing password: the current one is required.
await auth.setPassword({ password: next, current_password: current })

// Set the first password (e.g. a user who signed up with Google).
const { error } = await auth.setPassword({ password: next })
if (error?.code === 'reauth_required') {
  // Sign in again, then retry with the new session.
  await auth.authorize({ queryParams: { max_age: '0' } })
}

// Save your app's own profile fields.
await auth.updateProfile({ fields: [{ key: 'profile', value: 'teacher' }] })
```

Errors come back as an `AuthApiError` whose `code` is one of the [error codes](#errors) below.

## Endpoints

All three are on your auth tenant and accept either an `Authorization: Bearer <access_token>` header or the session cookie, like `GET /me`.

| Method  | Path              | Purpose                                                        |
| ------- | ----------------- | -------------------------------------------------------------- |
| `GET`   | `/me/credentials` | Whether the user has a password, and the connections they use. |
| `POST`  | `/me/password`    | Set or change the user's password.                             |
| `PATCH` | `/me`             | Update the profile, including your app's custom `fields`.      |

A bearer token must be a **user** token issued by **this** tenant; a `client_credentials` token, or one from another tenant, gets `403 forbidden`. A suspended user, or a session still waiting for its second factor, is refused the same way `GET /me` refuses them.

## How the user signs in

`GET /me/credentials` returns:

```json
{
  "has_password": false,
  "connections": [
    { "id": "connection_…", "name": "google", "type": "google_oauth2" }
  ]
}
```

`has_password` is `true` when the user has a password on a `database` connection. `connections` lists every connection the user is linked to: the password one, and each social or enterprise identity. Provider tokens and profile data are never included.

## Setting or changing the password

```bash
curl -X POST https://<your-auth-domain>/me/password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "password": "new password", "current_password": "old password" }'
```

The response is `{ "revoked_sessions": 2 }`.

What the request must prove depends on whether the user already has a password.

**Changing an existing password** needs `current_password`. A wrong one is `invalid_current_password`; after 10 wrong attempts in 15 minutes the user is locked out of this check for the rest of that window (`too_many_login_attempts`), whatever they type.

**Setting the first password** creates the user's `database` credential. There is no current password to ask for, so the proof is the sign-in itself:

- The user's email must be verified (`email_not_verified` otherwise).
- The sign-in must be **recent**: within the last 5 minutes.
- If the user has a second factor, the sign-in must have **completed it**.

If either sign-in condition fails, the response is `403 reauth_required`. Send the user through `/authorize` with `max_age=0` (and they'll be asked for their second factor if they have one), then retry with the new token. A stolen session or token on its own is never enough to put a password on someone's account.

Access tokens carry `auth_time` and `acr` (`urn:faable:loa:2` once a second factor was proven), and a refreshed token keeps the values from the original sign-in, because refreshing is not signing in again. Tokens from the password and OTP grants don't carry them, so a first password set with one of those tokens always gets `reauth_required`.

In both cases:

- The new password must meet the connection's [password policy](connections.md) (`password_too_weak`, with each unmet rule in the message).
- **Every other session of the user is signed out**; the one the request came through stays. Refresh tokens from the revoked sessions stop working, and access tokens already issued last until they expire. See [Sessions](sessions.md).
- The user gets a security email that their password changed, even when it is the first one.

The endpoint is rate-limited to 5 requests per minute per IP.

## Custom profile fields

Your app can save a few fields of its own on the user, such as the profile a user picks during onboarding. They are stored in `user_metadata["faable.com/fields"]` as `[{ key, value }]`, the same place the admin notification emails read them from.

### Declare the fields

Only the keys you declare can be written by users. Declare them per app with the [Faable CLI](../cli.md):

```bash
faable auth clients update <client_id> --add-field profile:enum:student,teacher
faable auth clients update <client_id> --add-field school:string:120
faable auth clients get <client_id>      # shows the fields that apply
```

A field is `key`, `key:string[:max_length]` or `key:enum:a,b,c`. `--remove-field <key>` stops accepting one, and `--inherit-fields` drops the app's own list so it uses the tenant's again. AI agents can do the same through the MCP tool `update_auth_client_fields`.

Or with the Management API, on the client (`POST /client/:id`) or on the tenant (`POST /account/:id`):

```bash
curl -X POST https://<your-auth-domain>/client/<client_id> \
  -H "Authorization: Bearer <management token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_fields": [
      { "key": "profile", "type": "enum", "options": ["student", "teacher"] },
      { "key": "school", "type": "string", "max_length": 120 }
    ]
  }'
```

| Field        | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| `key`        | Lowercase letters, digits and `_`, up to 40 characters.           |
| `type`       | `string` (free text) or `enum` (one of `options`).                |
| `options`    | The accepted values of an `enum` field.                           |
| `max_length` | The longest accepted `string` value, up to 1000. Defaults to 200. |

Up to 20 fields. A client's `profile_fields` **replaces** the tenant's list for that app, it does not add to it; without one, the app uses the tenant's (`POST /account/:id`). `null` removes the client's list, and the app goes back to the tenant's.

### Write them

```bash
curl -X PATCH https://<your-auth-domain>/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "fields": [{ "key": "profile", "value": "teacher" }] }'
```

- Fields are merged **by key**: keys you don't send are kept, and `"value": null` removes a key.
- A key that isn't declared for the app the user signed in to, or a value that doesn't match its declaration, fails the **whole** request with `invalid_profile_field`, and nothing is written.
- The rest of `user_metadata` is never touched. Users cannot write arbitrary metadata.

The response is the updated user, and `GET /me` returns the fields under `user_metadata`.

## Errors

| Code                       | Status | When                                                                      |
| -------------------------- | ------ | ------------------------------------------------------------------------- |
| `forbidden`                | 403    | The bearer token is from another tenant, or isn't a user token.           |
| `invalid_current_password` | 400    | `current_password` is missing or wrong.                                   |
| `too_many_login_attempts`  | 429    | Too many wrong current passwords. Wait and retry.                         |
| `reauth_required`          | 403    | Setting a first password needs a recent sign-in (with the second factor). |
| `email_not_verified`       | 403    | Setting a first password needs a verified email.                          |
| `password_too_weak`        | 400    | The password doesn't meet the connection's policy.                        |
| `no_database_connection`   | 400    | The tenant has no password sign-in.                                       |
| `conflict`                 | 409    | Another user already has a password for this email.                       |
| `invalid_profile_field`    | 400    | A field isn't declared, or its value doesn't match the declaration.       |

The full list is in [Error Codes](errors.md).
