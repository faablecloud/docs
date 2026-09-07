---
title: Login Flows
description: The screens a login walks through, as a graph you can read, edit, preview and publish — per account, or per client, so one tenant can run different access for different applications.
---

# Login Flows

A login is a sequence of screens with decisions between them: choose a method, prove a credential, maybe a second factor, maybe an invitation to create a passkey, then back to the app. Faable Auth keeps that sequence as a **graph** — and lets you read it, change it, try it and publish it, for the whole account or for one client.

## What a login flow is

Nodes are typed steps; edges leave a node through a **named handle** (`then` / `else` on a condition, `satisfied` / `challenge` / `enroll` on the second-factor gate). A login starts at `start`, walks edges, and ends at `end` (tokens are issued) or `deny`.

The one rule that governs everything: **the flow decides the order of screens; your settings decide the rules.** A node that reads a policy — which methods to offer, whether a second factor is owed, whether to offer a passkey — reads it from [Login Experience](login-experience.md) and [Two-Step Verification](mfa.md) at run time. It never carries a copy. A flow therefore cannot remove what a policy requires: publishing a graph with no second-factor gate while the policy is `required` is refused.

## The default flow

Every account runs a flow already: the one compiled from its settings. Open **Auth → Login Flow** to see it.

With two-step verification on, a gate appears after the Actions with its three ways out; with the passkey offer on, an invitation hangs off the "nothing owed" path — and only there. Whoever just passed or enrolled a second factor is never offered a passkey on top. That rule is topology, not code: you can see it.

Nothing is stored for the default flow. Change a setting and the graph you see changes with it.

## One tenant, different access per client

Each client can run its own flow. The precedence is by whole graph: the client's flow if it has one, else the account's, else the compiled one — reflecting **that client's** overrides, so an admin app with `mfa_policy: required` compiles to a gated graph while the consumer app of the same tenant does not.

On a client, **Login flow** says which graph it runs. **Customize for this client** gives it its own, starting from what it runs today.

## Nodes

| Node            | What it does                                                                 | Reads               |
| --------------- | ---------------------------------------------------------------------------- | ------------------- |
| Start           | Where every login begins.                                                    | —                   |
| Email first     | Asks for the email before showing any method. Nothing is looked up.          | `identifier_first`  |
| Choose a method | The hosted login screen: which methods, in what order.                       | `login_methods`     |
| Credential      | The user proved who they are (password, code, social, passkey).              | —                   |
| Actions         | Runs your post-login [Actions](extensibility/actions.md). A deny stops here. | Actions             |
| Second factor?  | Decides whether a factor is owed: `satisfied`, `challenge` or `enroll`.      | `mfa_policy`        |
| Verify factor   | Asks for the code, key or passkey the user has.                              | —                   |
| Enrol factor    | Enrols a first factor during the login.                                      | —                   |
| Offer a passkey | Invites the user to create a passkey. Never blocks.                          | `passkey_promotion` |
| Condition       | Branches on a fact: `then` / `else`.                                         | —                   |
| Deny            | Refuses the login with an error you name.                                    | —                   |
| Sign in         | Issues the tokens and returns the user to the app.                           | —                   |

## Conditions

A condition is one of a closed set of facts — there is no expression language, on purpose: anything you could write in one is a security surface in the login path and cannot be checked before it runs. Arbitrary logic belongs in an [Action](extensibility/actions.md).

| Condition                   | Example use                                            |
| --------------------------- | ------------------------------------------------------ |
| User has a second factor    | Skip the passkey offer for users who already have one. |
| User just signed up         | Show something once, on the first login only.          |
| Session assurance level ≥ n | Route differently after a second factor.               |
| Client is one of …          | A branch only the admin app takes.                     |
| Connection type is …        | Different treatment for social sign-ins.               |
| Device is remembered        | The browser passed a challenge recently.               |

Each can be negated.

## Editing, previewing and publishing

**Customize** turns the compiled graph into a flow of your own — never a blank canvas. From then on the page shows two views: **Running** (what logins walk) and **Draft** (what you are editing).

- **Validate** checks the draft against the rules a publish enforces and paints each problem on its node: exactly one start; every handle connected; nothing unreachable; no cycle without a condition; a second-factor gate on every path when the policy wants one; the passkey offer only with the offer on.
- **Try this flow** opens a real login in a new tab that runs the **draft**, for your browser only, for ten minutes. Nothing is published.
- **Publish** freezes the draft under its revision. New logins run it; logins already in flight finish on the revision they started. The previous revision goes to history.
- **Roll back** makes a previous revision run again, without touching the draft.

## Recipes

### Require a second factor only for the admin app

No flow needed: set **Two-step verification → Required** on the admin client. Its compiled graph grows the gate; the consumer app's does not. Open **Login Flow** with the admin client selected to see the difference.

### No new signups on the admin client

Customize the admin client's flow. After **Credential**, add a **Condition** — _User just signed up_ — with `then` to a **Deny** (`signups_closed`, 403) and `else` on to Actions.

```json
{
  "id": "no_signups",
  "type": "condition",
  "config": { "predicate": { "op": "user.is_new" } }
}
```

### Offer a passkey right after the first login only

With the passkey offer on, add a **Condition** — _User just signed up_ — before **Offer a passkey**: `then` to the offer, `else` to Sign in.

## API

```bash
# Start a custom flow from what runs today (account, or one client)
curl -X POST https://<auth-domain>/loginflow/materialize \
  -H "Authorization: Bearer $MANAGEMENT_TOKEN" -H "Content-Type: application/json" \
  -d '{ "client_id": "client_xxx" }'

# What runs right now, and the bound flow with its draft
curl https://<auth-domain>/loginflow/resolved?client_id=client_xxx -H "Authorization: Bearer $MANAGEMENT_TOKEN"

# Edit the draft, check it, publish it, roll it back
curl -X POST https://<auth-domain>/loginflow/loginflow_xxx -d '{ "graph": { ... }, "layout": { ... } }' ...
curl -X POST https://<auth-domain>/loginflow/loginflow_xxx/validate ...
curl -X POST https://<auth-domain>/loginflow/loginflow_xxx/publish ...
curl -X POST https://<auth-domain>/loginflow/loginflow_xxx/rollback -d '{ "revision": 3 }' ...

# A preview token: run the draft on one login, in your browser
curl -X POST https://<auth-domain>/loginflow/loginflow_xxx/preview-token ...
# → open /authorize?client_id=…&redirect_uri=…&response_type=code&scope=openid&flow_preview=<token>
```

Every endpoint is in the OpenAPI reference under `loginflow`.

## FAQ

### Can a flow disable two-step verification?

No. The gate node reads the policy; it does not carry one. With the policy on, a graph that lets a login reach _Sign in_ without passing the gate does not validate and cannot be published.

### Does publishing affect logins already in progress?

No. A login pins the revision it started on when it starts, and finishes on it. New logins take the new revision.

### Do direct grants run the flow?

No. Token-endpoint grants — the passwordless code grant, client credentials — have no browser and no screens to order. They apply the same policies (Actions, two-step verification) directly.

### What happens if my flow has an error?

Publishing refuses it with the list of problems. If a published graph ever fails at run time — a node that cannot be reached, a loop — the login fails with an error and an audit row `auth.login_flow.error`; it never loops the user's browser.

## Related

- [Login Experience](login-experience.md) — the settings the flow's nodes read.
- [Two-Step Verification](mfa.md) — the policy behind the gate.
- [Actions](extensibility/actions.md) — arbitrary logic, in code.
