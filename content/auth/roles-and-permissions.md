---
title: Roles and Permissions (RBAC)
description: Give users permissions of your APIs through roles in Faable Auth. Assign roles at the account level, enable RBAC on an API, and its access tokens carry only the permissions each user's roles grant.
---

# Roles and Permissions (RBAC)

Role-based access control lets you decide **who** can do what in your API, not only **which client** asked for it. You define permissions on an [API](apis.md), group them into **roles**, assign roles to users, and turn on `rbac` for the API. From then on, the access tokens Faable Auth issues to a user for that API carry only the permissions the user's roles grant.

## Account-level roles and team roles

A role has a `name`, a `description` and a list of API permissions. The same roles can be held in two places, and they mean different things:

| Where                                                             | What it does                                                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Account level**: assigned to the user directly                  | Grants the role's permissions in tokens for every API with `rbac` enabled. Its name appears in the `roles` claim. |
| **Team level**: held as a member of a [team](team-invitations.md) | A name only. It appears in the `roles` claim and in your team logic, but **grants no API permissions**.           |

Team roles grant no permissions on purpose. A permission is valid across the whole API. If it came from a team role, an admin of one team would get it everywhere.

The `roles` claim (with `include_roles_in_access_token` / `include_roles_in_id_token` on the API) lists the names of both kinds, deduplicated and sorted.

## How a token is built

With `rbac: true` on the API, a token issued **to a user** (authorization code, refresh, device code, password, OTP, token exchange…) follows these rules:

- **`permissions`** = the scopes the client **requested** ∩ the API's **current** permission catalog ∩ the permissions the user's **account-level** roles grant for **that** API.
- **`scope`** keeps the requested scopes, minus any catalog permission the user doesn't hold. OIDC scopes (`openid`, `profile`, `email`, `offline_access`) and scopes outside the catalog pass unchanged. An app that checks `scope` never gets what `permissions` refuses.
- The `permissions` claim is only emitted with `token_dialect: "access_token_authz"`, as a space-separated **string**.
- Machine-to-machine tokens (`client_credentials`) are **not affected**: a client that asks for no scope still gets the whole catalog. See [Client Credentials](oauth-flows/client-credentials.mdx).

> **Request the permissions you need as scopes.** Faable Auth puts in the token what was requested **and** is held, not every permission the user holds. User tokens also go to third-party clients through the consent screen, and to agents acting on the user's behalf through token exchange. If every permission were included, those clients would get permissions the user was never asked to allow. The consent screen lists only the scopes the token will actually carry.

**Changes take effect on the next token.** Refreshing a token recomputes its permissions, so a revoked role disappears at the next refresh. A token already issued keeps its permissions until it expires. Keep `token_lifetime` short if that window matters.

**Catalog changes need no migration.** Remove a permission from the API's catalog, or delete the API, and roles that held it simply stop granting it. The entry stays on the role, but it is no longer listed and does nothing.

## Setting it up

### 1. Define the permissions on the API, and enable RBAC

```http
POST /api/api_xxx
Authorization: Bearer <management_token>
Content-Type: application/json

{
  "token_dialect": "access_token_authz",
  "rbac": true,
  "permissions": [
    { "value": "invites:read", "description": "See invitations" },
    { "value": "invites:write", "description": "Send invitations" }
  ]
}
```

### 2. Create a role and give it permissions

```http
POST /role
Content-Type: application/json

{ "name": "support", "description": "Handles invitations" }
```

```http
POST /role/role_xxx/permissions
Content-Type: application/json

{
  "permissions": [
    { "api": "api_xxx", "value": "invites:read" },
    { "api": "api_xxx", "value": "invites:write" }
  ]
}
```

Each permission names the API by id and a `value` from its catalog. A value that is not in the catalog of an API of your tenant is refused with [`invalid_permission`](errors.md#invalid_permission).

### 3. Assign the role

From the user:

```http
POST /user/user_xxx/roles
Content-Type: application/json

{ "roles": ["role_xxx"] }
```

Or from the role, for several users at once:

```http
POST /role/role_xxx/users
Content-Type: application/json

{ "users": ["user_xxx", "user_yyy"] }
```

### 4. Request a token for the API, with the permissions as scopes

```ts
import { createClient } from '@faable/auth-js'

const auth = createClient({
  domain: 'https://my-tenant.auth.faable.link',
  clientId: 'client_xxx',
  audience: 'https://api.example.com',
  scope: 'openid profile email invites:read invites:write'
})
```

A user with the `support` role gets `"permissions": "invites:read invites:write"`. A user without it gets `"permissions": ""`, and `scope` is `openid profile email`.

### 5. Check the permissions

**In your API**, verify the token and require the permission with `@faable/auth-sdk`:

```ts
import {
  AccessTokenError,
  bearerToken,
  requirePermissions,
  verifyAccessToken
} from '@faable/auth-sdk'

try {
  const claims = await verifyAccessToken(
    bearerToken(req.headers.authorization),
    {
      domain: 'https://my-tenant.auth.faable.link',
      audience: 'https://api.example.com'
    }
  )
  requirePermissions(claims, 'invites:write')
} catch (e) {
  if (e instanceof AccessTokenError) return res.status(e.status).end() // 401 invalid token, 403 missing permission
  throw e
}
```

Any JWT library works too. See [Validate Access Tokens](validate-access-tokens.mdx).

**In the browser**, with `@faable/auth-js`, use these to show or hide UI. The token is decoded there, not verified:

```ts
if (await auth.hasPermission('invites:write')) showInviteButton()
const isSupport = await auth.hasRole('support')
```

**In Next.js**, `@faable/auth-js/nextjs` verifies the token before checking. Set `authorizationParams.audience` to your API identifier:

```ts
// Server Component / Server Action
if (!(await faableAuth.hasPermission('invites:write'))) notFound()

// middleware.ts: anonymous → login, signed in without the permission → 403
export const middleware = (req: NextRequest) =>
  faableAuth.middleware(req, {
    permissions: req =>
      req.nextUrl.pathname.startsWith('/admin') ? ['invites:read'] : undefined
  })
```

## Endpoints

All of them are part of the Management API. `DELETE` endpoints take a JSON body.

| Method   | Path                         | Scope                | Purpose                                                                                  |
| -------- | ---------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `GET`    | `/role/:role_id/permissions` | `read:roles`         | The role's permissions, each with its API (`api_identifier`, `api_name`, `description`). |
| `POST`   | `/role/:role_id/permissions` | `update:roles`       | Add permissions: `{ "permissions": [{ "api", "value" }] }`. Ones already held are kept.  |
| `DELETE` | `/role/:role_id/permissions` | `update:roles`       | Remove permissions, same body. Ones the role doesn't have are ignored.                   |
| `GET`    | `/role/:role_id/users`       | `read:rolemembers`   | Users holding the role at the account level.                                             |
| `POST`   | `/role/:role_id/users`       | `create:rolemembers` | Assign to users: `{ "users": [...] }`.                                                   |
| `DELETE` | `/role/:role_id/users`       | `delete:rolemembers` | Remove from users: `{ "users": [...] }`. Returns `{ removed_from_role, not_in_role }`.   |
| `GET`    | `/user/:user_id/roles`       | `read:rolemembers`   | The user's account-level roles.                                                          |
| `POST`   | `/user/:user_id/roles`       | `create:rolemembers` | Assign roles: `{ "roles": [...] }`. Returns all of the user's roles.                     |
| `DELETE` | `/user/:user_id/roles`       | `delete:rolemembers` | Remove roles, same body. Returns the roles left.                                         |
| `GET`    | `/user/:user_id/permissions` | `read:rolemembers`   | The user's effective permissions, each with the `roles` that grant it.                   |

Every change is written to the tenant's [log](logs.md) as `role.permissions_updated`, `role.users_added`, `role.users_removed` or `user.roles_updated`.

With `@faable/auth-sdk`: `roleAddPermissions`, `roleRemovePermissions`, `rolePermissions`, `userAssignRoles`, `userRemoveRoles`, `userRoles`, `userPermissions`, `roleAssignUsers` and `roleRemoveUsers`.

## Roles in Actions

Post-login [Actions](extensibility/actions.md) receive `event.authorization.roles`: the names of the user's roles, account-level and team roles together. It is only filled in when your Action's code references `event.authorization`. Permissions are not included there, because they depend on the API the token is for.

```js
exports.onExecutePostLogin = async (event, api) => {
  if (!event.authorization.roles.includes('support')) {
    api.access.deny('Support staff only')
  }
}
```

## Next steps

- [APIs](apis.md): permissions catalog, token dialect and the `rbac` flag.
- [Validate Access Tokens](validate-access-tokens.mdx): verify the token in any language.
- [Teams, Invitations and Members](team-invitations.md): team roles and membership.
