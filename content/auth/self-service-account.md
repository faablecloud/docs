---
title: Self-Service Account
description: Let signed-in users manage their own account — sign-in methods, password, profile, linked accounts, sessions and deletion — with their session, no client secret and no Management API.
---

# Self-Service Account

An account or profile screen needs a handful of things from the auth server: how the user signs in, a way to set or change their password, their name and country, the social accounts they have linked, where they are signed in, and a way to delete the account. Faable Auth exposes all of them to **the signed-in user**, so your app calls them with the user's session or access token. Nothing here needs a `client_secret` or the Management API, and a user can only ever act on their own account.

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

// Name, company and country, and your app's own profile fields.
// Keys you leave out are not touched.
await auth.updateProfile({
  name: 'Ada Lovelace',
  country_iso: 'GB',
  fields: [{ key: 'profile', value: 'teacher' }]
})

// One field at a time (null removes it), and reading it back from the session.
await auth.updateProfileField('profile', 'teacher')
const profile = await auth.getProfileField('profile') // 'teacher'

// Unlink a Google, GitHub or GitLab account (a connection id from getCredentials).
const { error: unlinkError } = await auth.unlinkIdentity(connection_id)
if (unlinkError?.code === 'last_sign_in_method') {
  // It's their only way in: ask them to set a password or link another account first.
}

// Where the user is signed in, and "sign out everywhere else".
const { data: sessions } = await auth.listSessions()
// sessions: { results: [{ id, user_agent, ip, last_seen_at, … }], current_session_id }
const { data: ended } = await auth.revokeOtherSessions() // { revoked: 2 }

// Delete the account. Permanent: confirm with the user first.
// On success the local session is cleared and SIGNED_OUT is emitted.
await auth.deleteAccount()
```

These methods need `@faable/auth-js` 2.19 or later; `updateProfileField()` and `getProfileField()` need 3.0. `updateProfile()` and `updateProfileField()` also update the stored session's user and fire `USER_UPDATED`, so `getSession()` and your `onAuthStateChange` handlers see the new values without waiting for a token refresh.

Errors come back as an `AuthApiError` whose `code` is one of the [error codes](#errors) below.

## Endpoints

All of them are on your auth tenant and accept either an `Authorization: Bearer <access_token>` header or the session cookie, like `GET /me`.

| Method   | Path                            | auth-js                                   | Purpose                                                           |
| -------- | ------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `GET`    | `/me/credentials`               | `getCredentials()`                        | Whether the user has a password, and the connections they use.    |
| `POST`   | `/me/password`                  | `setPassword()`                           | Set or change the user's password.                                |
| `PATCH`  | `/me`                           | `updateProfile()`, `updateProfileField()` | Update the name, company, country and your app's custom `fields`. |
| `DELETE` | `/me/identities/:connection_id` | `unlinkIdentity()`                        | Unlink one of the user's social or enterprise accounts.           |
| `GET`    | `/me/sessions`                  | `listSessions()`                          | The user's active sessions. See [Sessions](sessions.md).          |
| `POST`   | `/me/sessions/revoke-others`    | `revokeOtherSessions()`                   | Sign the user out everywhere else.                                |
| `DELETE` | `/me`                           | `deleteAccount()`                         | Delete the user's account.                                        |

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

## Name, company and country

`PATCH /me` also takes the user's own profile:

```bash
curl -X PATCH https://<your-auth-domain>/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Ada Lovelace", "country_iso": "GB" }'
```

| Field          | Meaning                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `name`         | 1 to 100 characters.                                                                                     |
| `company_name` | Up to 100 characters, stored in `user_metadata`.                                                         |
| `country_iso`  | An ISO 3166 code, alpha-2 or alpha-3 (`ES`, `ESP`), stored as alpha-2. An unknown code is `bad_request`. |

Send only what changes: keys you leave out are not touched. Nothing else about the user can be written this way: `email_verified`, `app_metadata` or anything outside this list is ignored. The new values reach the session's claims on the next token refresh.

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

With auth-js, `updateProfileField(key, value)` writes one field (`null` removes it) and `getProfileField(key)` reads it back from the session's user, without a request (`null` when unset). See [Client library](#client-library).

## Unlinking an account

```bash
curl -X DELETE https://<your-auth-domain>/me/identities/<connection_id> \
  -H "Authorization: Bearer <access_token>"
```

The response is `{ "unlinked": 1 }`. It removes the user's identities on that connection, and the provider tokens they held, so the user can no longer sign in with that account until they link it again. Take the `connection_id` from [`GET /me/credentials`](#how-the-user-signs-in). The user's sessions stay.

Faable Auth refuses with `409 last_sign_in_method` when the account is the user's **only way to sign in**: no password, no account on another connection, and no passwordless email sign-in on the tenant for a verified email. Offer to [set a password](#setting-or-changing-the-password) or link another account first.

A connection the user has no account on is `404 not_found`. The endpoint is rate-limited to 10 requests per minute.

## Deleting the account

```bash
curl -X DELETE https://<your-auth-domain>/me \
  -H "Authorization: Bearer <access_token>"
```

The response is `204`. The user's identities, credentials, second factors and team memberships go with it, and a `user.deleted` event is emitted. It cannot be undone, so ask the user to confirm first. When the session cookie was used, it is cleared; with auth-js, `deleteAccount()` also clears the local session and emits `SIGNED_OUT`.

A suspended user cannot delete their own account (`user_suspended`).

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
| `last_sign_in_method`      | 409    | Unlinking this account would leave the user with no way to sign in.       |
| `not_found`                | 404    | The user has no account on that connection.                               |
| `user_suspended`           | 403    | A suspended user can't change or delete their account.                    |

The full list is in [Error Codes](errors.md).
