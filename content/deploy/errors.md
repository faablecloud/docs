---
title: Error codes
description: Every error the Faable Deploy API returns carries a stable, machine-readable error_code. Branch on it — never on the message — and turn it into whatever your users should read.
---

# Error codes

Every error response from the Deploy API has the same shape:

```json
{
  "status": 409,
  "message": "acme.com is already registered on Faable. A hostname can only point at one app — if you added it in another of your projects, remove it there first.",
  "error_code": "domain_taken",
  "docs": "https://faable.com/docs/deploy/errors#domain_taken",
  "statusCode": 409,
  "error": "Conflict",
  "code": "domain_taken"
}
```

- **`error_code`** is the field to branch on. It is stable: a code is never renamed or reused with another meaning, and each one maps to exactly one HTTP status.
- **`message`** is written for a person and **may change between releases**. Log it, show it if it reads well, but do not compare it.
- **`details`** is optional and structured. `validation_error` carries `fields` and `issues` (one `{ path, message }` per failing field); `repository_already_linked` carries the app that holds the repository.
- **`action`** appears when there is a concrete next step the caller can offer — `connect_github` or `install_github_app`.
- **`statusCode`**, **`error`** and **`code`** are **deprecated** aliases kept for existing clients. `code` holds the same value as `error_code`. They will be removed; do not write new code against them.

The same contract, with its own catalogue, applies to [Faable Auth](../auth/errors.md).

## With the SDK

`@faable/deploy-sdk` throws a `FaableApiError` on any non-2xx, and every generated method lists the codes it can throw in its docstring:

```ts
import { FaableApiError, FaableDeployApi } from '@faable/deploy-sdk'

try {
  await deploy.appLinkRepository(app_id, { repository })
} catch (e) {
  if (e instanceof FaableApiError) {
    switch (e.error_code) {
      case 'github_identity_missing':
        return redirectTo('/connect/github')
      case 'repository_already_linked':
        return `Already linked to ${e.details?.app_name}.`
      case 'github_installation_missing':
        return redirectTo(installUrl)
    }
  }
  throw e
}
```

`ApiErrorCode` is exported as a TypeScript union, so a `switch` over it is checked by the compiler.

## Errors worth handling by name

Most codes are self-explanatory from the table below, but these four change what your integration should _do_:

| Code                                         | What to do                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `github_identity_missing` (412)              | Send the user to connect GitHub. `action` says so too.                              |
| `github_installation_missing` (412)          | Send them to install the Faable GitHub App.                                         |
| `repository_already_linked` (409)            | Offer the app that already holds it — `details.app_id` and `details.app_name`.      |
| `app_disabled` / `moderation_hold` (409/403) | Stop retrying. The app is held, and a deploy will not succeed until it is released. |

## The OpenAPI document

Every operation in [`/docs/json`](https://api.faable.com/docs/json) documents its error responses: one entry per status, with `error_code` restricted to the codes that operation can emit. Code generators pick them up from there.

## All codes

Generated from the server's catalogue (`npm run dump-error-codes`); the same list the OpenAPI `ApiErrorCode` schema enumerates.

| Code                                                                      | Status | Meaning                                                                                                               |
| ------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| <a id="already_exists"></a>`already_exists`                               | 400    | A resource with the same unique field already exists. `details.fields` names the field.                               |
| <a id="ambiguous_app_for_repository"></a>`ambiguous_app_for_repository`   | 400    | Several apps are linked to that repository; pass `--app-slug`.                                                        |
| <a id="app_secrets_only"></a>`app_secrets_only`                           | 400    | Only app secrets can be written in bulk.                                                                              |
| <a id="bad_request"></a>`bad_request`                                     | 400    | The request is malformed. `message` says what is wrong.                                                               |
| <a id="branch_missing"></a>`branch_missing`                               | 400    | The deploy branch does not exist on the repository. `message` lists the branches that do.                             |
| <a id="deploy_mode_conflict"></a>`deploy_mode_conflict`                   | 400    | The app deploys from its own workflow, so the platform will not create a deployment for it.                           |
| <a id="domain_invalid"></a>`domain_invalid`                               | 400    | Not a valid hostname. No protocol, port or path.                                                                      |
| <a id="invalid_expand"></a>`invalid_expand`                               | 400    | An `?expand=` path is not allowed on this resource.                                                                   |
| <a id="invalid_id"></a>`invalid_id`                                       | 400    | The id in the path is not a valid id for this resource.                                                               |
| <a id="invalid_installation_id"></a>`invalid_installation_id`             | 400    | The `installation_id` is not a number.                                                                                |
| <a id="invalid_json"></a>`invalid_json`                                   | 400    | The request body is not valid JSON.                                                                                   |
| <a id="invalid_project_name"></a>`invalid_project_name`                   | 400    | The project name is not acceptable. `message` says why.                                                               |
| <a id="invalid_query"></a>`invalid_query`                                 | 400    | The `?query=` FaableQL expression could not be parsed.                                                                |
| <a id="invalid_root_dir"></a>`invalid_root_dir`                           | 400    | The Root Directory must be a path inside the repository — no leading `/` and no `..`.                                 |
| <a id="invalid_secret_context"></a>`invalid_secret_context`               | 400    | Secrets are scoped to an app or to a profile, nothing else.                                                           |
| <a id="invalid_secret_name"></a>`invalid_secret_name`                     | 400    | Secret names are 1-255 printable ASCII characters and cannot contain '='.                                             |
| <a id="missing_github_event"></a>`missing_github_event`                   | 400    | The `x-github-event` header is missing.                                                                               |
| <a id="no_deploy_workflow"></a>`no_deploy_workflow`                       | 400    | No workflow in the repository runs `faable deploy`.                                                                   |
| <a id="no_workflows"></a>`no_workflows`                                   | 400    | The repository has no GitHub Actions workflows, so a CI gate would never open.                                        |
| <a id="owner_not_removable"></a>`owner_not_removable`                     | 400    | The project owner cannot be removed. Delete the project instead.                                                      |
| <a id="repository_empty"></a>`repository_empty`                           | 400    | The repository has no commits on the deploy branch yet.                                                               |
| <a id="repository_not_linked"></a>`repository_not_linked`                 | 400    | The app has no linked repository.                                                                                     |
| <a id="root_dir_mismatch"></a>`root_dir_mismatch`                         | 400    | The workflow deploys from one directory and platform builds would run from another. Declare `rootDir` in faable.json. |
| <a id="root_dir_not_found"></a>`root_dir_not_found`                       | 400    | The Root Directory does not exist on that ref of the repository.                                                      |
| <a id="search_not_supported"></a>`search_not_supported`                   | 400    | This resource does not support `?q=`.                                                                                 |
| <a id="team_required"></a>`team_required`                                 | 400    | The operation needs a project: send it in the `x-faable-team` header.                                                 |
| <a id="user_not_found"></a>`user_not_found`                               | 400    | No user with that id in Faable Auth.                                                                                  |
| <a id="validation_error"></a>`validation_error`                           | 400    | The body, query or path failed schema validation. `details.issues` lists each failing field.                          |
| <a id="access_denied"></a>`access_denied`                                 | 401    | The row exists but does not belong to the caller.                                                                     |
| <a id="apikey_expired"></a>`apikey_expired`                               | 401    | The API key predates projects and must be recreated.                                                                  |
| <a id="build_token_app_missing"></a>`build_token_app_missing`             | 401    | The app the build token was minted for no longer exists.                                                              |
| <a id="build_token_expired"></a>`build_token_expired`                     | 401    | The build token is past its lifetime.                                                                                 |
| <a id="build_token_unusable"></a>`build_token_unusable`                   | 401    | The deployment reached a terminal phase, so its build token no longer works.                                          |
| <a id="github_token_invalid"></a>`github_token_invalid`                   | 401    | The stored GitHub token was rejected; the user must reconnect.                                                        |
| <a id="invalid_apikey"></a>`invalid_apikey`                               | 401    | The API key does not exist or has been revoked.                                                                       |
| <a id="invalid_build_token"></a>`invalid_build_token`                     | 401    | The build token is not valid for this deployment.                                                                     |
| <a id="invalid_token"></a>`invalid_token`                                 | 401    | The bearer token is missing, malformed or expired.                                                                    |
| <a id="oidc_untrusted"></a>`oidc_untrusted`                               | 401    | The GitHub Actions OIDC token was rejected. `message` says why.                                                       |
| <a id="secrets_access_denied"></a>`secrets_access_denied`                 | 401    | The caller may not read or write the secrets of that app or profile.                                                  |
| <a id="team_or_scope_required"></a>`team_or_scope_required`               | 401    | Listing needs either a project in `x-faable-team` or a global scope on the token.                                     |
| <a id="unauthorized"></a>`unauthorized`                                   | 401    | The request carries no valid credentials.                                                                             |
| <a id="user_token_required"></a>`user_token_required`                     | 401    | The endpoint acts on behalf of a person and the credential carries no user (an API key or a service account).         |
| <a id="payment_required"></a>`payment_required`                           | 402    | The feature is not included in the current plan.                                                                      |
| <a id="project_plan_limited"></a>`project_plan_limited`                   | 402    | The Free plan project cap is reached. Upgrade to create more.                                                         |
| <a id="app_repository_mismatch"></a>`app_repository_mismatch`             | 403    | The app does not exist or is not linked to the repository the token comes from.                                       |
| <a id="domain_reserved"></a>`domain_reserved`                             | 403    | Hostnames under that domain are assigned by Faable.                                                                   |
| <a id="forbidden"></a>`forbidden`                                         | 403    | The credentials are valid but do not allow this operation.                                                            |
| <a id="github_installation_suspended"></a>`github_installation_suspended` | 403    | The GitHub App installation is suspended.                                                                             |
| <a id="github_permission_denied"></a>`github_permission_denied`           | 403    | The installation lacks a permission this operation needs.                                                             |
| <a id="github_repository_blocked"></a>`github_repository_blocked`         | 403    | GitHub refuses to serve the source of that repository (403 or 451).                                                   |
| <a id="moderation_hold"></a>`moderation_hold`                             | 403    | The project contains an app disabled by moderation and cannot be deleted. Contact support@faable.com.                 |
| <a id="owner_only"></a>`owner_only`                                       | 403    | Only the project owner can manage collaborators.                                                                      |
| <a id="plan_required"></a>`plan_required`                                 | 403    | The build or feature needs a higher plan. `message` says which.                                                       |
| <a id="status_forbidden_field"></a>`status_forbidden_field`               | 403    | That field of a deployment status is platform bookkeeping. `message` names it.                                        |
| <a id="status_forbidden_phase"></a>`status_forbidden_phase`               | 403    | That phase is set by the platform, not by the client.                                                                 |
| <a id="status_forbidden_resource"></a>`status_forbidden_resource`         | 403    | Only a platform service writes app or domain status.                                                                  |
| <a id="superadmin_only"></a>`superadmin_only`                             | 403    | The operation is restricted to platform staff.                                                                        |
| <a id="user_suspended"></a>`user_suspended`                               | 403    | The account is suspended. Contact support@faable.com.                                                                 |
| <a id="app_not_found"></a>`app_not_found`                                 | 404    | No app with that id or slug in this project.                                                                          |
| <a id="collaborator_not_found"></a>`collaborator_not_found`               | 404    | That user is not a collaborator on the project.                                                                       |
| <a id="github_repository_not_found"></a>`github_repository_not_found`     | 404    | The repository does not exist or the installation cannot see it.                                                      |
| <a id="no_app_for_repository"></a>`no_app_for_repository`                 | 404    | No app is linked to that repository.                                                                                  |
| <a id="not_found"></a>`not_found`                                         | 404    | The resource does not exist, or not in the caller’s project.                                                          |
| <a id="project_not_found"></a>`project_not_found`                         | 404    | No project with that id for this caller.                                                                              |
| <a id="waf_rule_not_found"></a>`waf_rule_not_found`                       | 404    | No WAF rule with that pattern on this app.                                                                            |
| <a id="method_not_allowed"></a>`method_not_allowed`                       | 405    | The HTTP method is not supported on this path.                                                                        |
| <a id="app_disabled"></a>`app_disabled`                                   | 409    | The app is disabled, so it cannot be deployed or provisioned. `message` says why when the reason is public.           |
| <a id="artifact_deploy_disabled"></a>`artifact_deploy_disabled`           | 409    | Artifact deploys are not enabled on this environment.                                                                 |
| <a id="conflict"></a>`conflict`                                           | 409    | The request conflicts with the current state of the resource.                                                         |
| <a id="deploy_refused"></a>`deploy_refused`                               | 409    | The deploy was refused by quota, plan or an in-flight deployment. `message` says which.                               |
| <a id="domain_taken"></a>`domain_taken`                                   | 409    | That hostname is already registered on Faable.                                                                        |
| <a id="remote_build_disabled"></a>`remote_build_disabled`                 | 409    | Remote builds are off for this environment or this app. Deploy with a local build instead.                            |
| <a id="repository_already_linked"></a>`repository_already_linked`         | 409    | The repository is already linked to another app. `details.app_id` / `details.app_name` name it.                       |
| <a id="transfer_refused"></a>`transfer_refused`                           | 409    | The app cannot be moved to that project. `message` lists the blockers.                                                |
| <a id="gone"></a>`gone`                                                   | 410    | The resource existed and is gone for good; retrying will not bring it back.                                           |
| <a id="github_identity_missing"></a>`github_identity_missing`             | 412    | The user has not connected GitHub. Send them through `connect_github`.                                                |
| <a id="github_installation_missing"></a>`github_installation_missing`     | 412    | The Faable GitHub App is not installed on any repository of theirs.                                                   |
| <a id="github_installation_not_found"></a>`github_installation_not_found` | 412    | The installation id is unknown or the App was uninstalled.                                                            |
| <a id="artifact_too_large"></a>`artifact_too_large`                       | 413    | The artifact exceeds the size allowed for the plan.                                                                   |
| <a id="payload_too_large"></a>`payload_too_large`                         | 413    | The request body exceeds the size limit.                                                                              |
| <a id="unsupported_media_type"></a>`unsupported_media_type`               | 415    | The `Content-Type` is not accepted by this endpoint.                                                                  |
| <a id="unprocessable_entity"></a>`unprocessable_entity`                   | 422    | The request is well-formed but cannot be processed.                                                                   |
| <a id="app_rate_limited"></a>`app_rate_limited`                           | 429    | A new account may only create a few apps in its first 24 hours.                                                       |
| <a id="project_rate_limited"></a>`project_rate_limited`                   | 429    | A new account may only create a few projects in its first hours. It opens with time, or with a plan.                  |
| <a id="too_many_requests"></a>`too_many_requests`                         | 429    | Rate limit exceeded. Honour the `Retry-After` header.                                                                 |
| <a id="internal_error"></a>`internal_error`                               | 500    | Unexpected server error. Retry later; the request id is logged.                                                       |
| <a id="bad_gateway"></a>`bad_gateway`                                     | 502    | An upstream the API depends on failed.                                                                                |
| <a id="github_error"></a>`github_error`                                   | 502    | GitHub failed upstream. `message` carries what it said.                                                               |
| <a id="metrics_unavailable"></a>`metrics_unavailable`                     | 503    | Traffic metrics are temporarily unavailable — this is not an app with no traffic.                                     |
| <a id="service_unavailable"></a>`service_unavailable`                     | 503    | The feature is not configured on this environment, or is temporarily out of service.                                  |
