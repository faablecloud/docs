---
title: Login Experience
description: What the hosted login screen offers and in what order, passkey sign-in, and the post-login invitation that gets users to create a passkey — configured per account, overridable per client.
---

# Login Experience

The hosted login screen is not a fixed form. What it shows — which methods, in what order, whether passkeys are on, whether users are invited to create one — is configuration on your auth account, and any client can override it for its own login screen.

Everything here lives under **Login Experience** in the dashboard, and under `login_methods` on the [Account and Client](clients.md) objects of the Management API.

## What the login screen shows

The screen offers a method when three things are true: the connection is **enabled**, it is **allowed for the client** that started the login (set per connection under _Enabled clients_), and it has not been removed from this login experience.

The order is yours. Drag methods in the dashboard, or set `login_methods.order` to a list of connection ids (and the literal `passkey`). Methods you do not list keep the built-in order after the ones you do: passwordless first, then password, then social.

Removing a method here is enforced, not cosmetic. A connection taken off a client's login screen is also refused at `/authorize?connection=<id>` for that client — the screen and the server always agree about what a client may use.

![The Login methods section of the dashboard: an ordered list of the tenant's connections with move and remove controls](/auth/login-experience/login-methods.webp)

## Sign in with a passkey

A passkey verified with a biometric or a device PIN proves possession **and** knowledge in one gesture, which is why a passkey login is never asked for a second factor afterwards. Turn it on under **Login Experience → Passkeys**.

Two things happen on the login screen. A **Continue with a passkey** button appears at the top. And, in browsers that support it, the passkey is also offered from inside the email field — returning users pick it from the autofill suggestions and never touch the button.

![The hosted login screen with a passkey suggested inside the email field](/auth/login-experience/passkey-autofill.webp)

Registration runs entirely on your auth domain: a passkey is bound to the origin that created it, so the ceremony cannot be moved into your own application. Your app only ever sees the resulting session.

<Callout type="warning">
  A passkey is bound to the domain it was created on. If your login moves to a
  [custom domain](custom-domain.md), every passkey registered on the old
  domain stops working. Set a **WebAuthn Relying Party ID** to a domain you
  own (e.g. `example.com`) **before** users start enrolling, and passkeys keep
  working across every host under it.
</Callout>

## Inviting users to create a passkey

Turning passkey sign-in on does not, on its own, get anyone a passkey. Left to a settings page, enrolment stays in the single digits; most passkeys people actually have were created from a prompt shown **right after a login**, at the moment the user has just typed a password and can see why they would rather not.

That prompt is the **passkey offer**. With it on, a user who signs in with a password, an email code or a social login — and has no passkey or authenticator app yet — is taken to a hosted screen before returning to your application:

![The hosted passkey offer: "Sign in faster next time", a Create a passkey button and a Not now link](/auth/login-experience/passkey-offer.webp)

It never blocks the login. The user can say **Not now**; a browser that cannot create passkeys skips the screen without showing it; a failed registration offers to continue without one; and a user who simply closes the tab is signed in normally on their next visit. The login is complete before the screen appears — the offer is a question, not a gate.

Turn it on under **Login Experience → Passkeys**, next to passkey sign-in. It needs passkey sign-in on: there is no point creating a passkey that cannot be used to sign in. Two knobs keep it from becoming a nag:

| Setting             | Default | What it does                                                                                                |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Ask again after     | 30 days | How long to wait before offering again to a user who said _Not now_.                                        |
| Maximum times asked | 3       | How many times a user is offered a passkey over their lifetime. `0` switches the offer off for this tenant. |

Repeating the prompt measurably raises abandonment. Keep it rare.

![The Passkeys section of the dashboard: the sign-in toggle, the offer toggle, and the snooze and cap fields](/auth/login-experience/passkey-settings.webp)

### From the API

The same settings on the account, for scripts and infrastructure-as-code. `login_methods` is replaced as a whole on write, so send the full object:

```bash
curl -X POST https://<your-auth-domain>/account/account_xxx \
  -H "Authorization: Bearer $MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "login_methods": {
      "order": ["connection_abc", "passkey"],
      "passkey_login_enabled": true,
      "passkey_promotion": "offer",
      "passkey_promotion_snooze_days": 30,
      "passkey_promotion_max_prompts": 3
    }
  }'
```

Nothing changes in your application. The same `redirect_uri` receives the same authorization code — a few seconds later when the user creates a passkey, immediately when they decline:

```ts
// Your callback handler is untouched. Whether the user created a passkey on
// the way here is visible in the id token's `amr` claim on their NEXT login.
const session = await auth.handleRedirectCallback()
```

## Measuring adoption

Every offer writes an audit row: `user.passkey_offer.shown` when the screen appears, `user.passkey_offer.accepted` when a passkey is created from it, `user.passkey_offer.dismissed` when the user declines (with the reason: `dismissed`, `unsupported` or `failed`). Each row carries the prompt number, so acceptance can be read per attempt under [Logs](logs.md) or pulled through the API with FaableQL:

```
type IN ("user.passkey_offer.shown", "user.passkey_offer.accepted")
```

On a user's detail page the **Passkey offer** row shows how many times they were asked and when they last declined. **Ask again** resets it — the answer both to "why does it keep asking me" and "I want to be asked again". Over the API: `POST /user/:id/passkey-prompt/reset`.

## Ask for the email first

Under **Login Experience → Screen**, **Ask for the email first** turns the login into two steps: a single email field, then the methods that apply — with the email already filled in. It is the shape Stripe and Google use, and it is the natural place for the passkey suggestion to appear.

Nothing is looked up between the two steps. The address is carried on the login, not resolved to a user, so the first screen cannot be used to find out which addresses have an account.

## Remember the last method

**Remember the last method** moves the method a returning browser used last time to the top of the screen, with a _Last used_ tag. The hosted screen remembers it in a first-party cookie on your auth domain; whether to act on it is decided by this setting on the server, so turning it off is immediate and complete.

## Per-client overrides

Every setting on this page is a tenant default that a client can override for its own login screen — the method order, whether passkeys are offered, whether users are invited to create one. Open the client under **Clients → Login experience**; a client that sets nothing inherits what the account says, field by field.

That is enough for the common split: the consumer app offers passwords and Google with a passkey invitation; the admin app offers only the corporate connection and [requires two-step verification](mfa.md#turning-it-on). For anything beyond flipping settings — different screens, conditions on who sees what — see [Login Flows](login-flows.md).

## Related

- [Two-Step Verification](mfa.md) — authenticator apps, security keys and passkeys as a second factor.
- [Passkeys in Next.js](guides/nextjs-passkeys.mdx) — the end-to-end guide.
- [Clients](clients.md) — where per-client overrides live.
