---
title: Email Notifications
description: Choose which Faable Deploy emails each member of a project gets — deploys, failures, app health and platform maintenance — who gets billing emails, and how to see who got each one.
---

# Email Notifications

Faable emails a project's members when something happens to its apps: a deploy went live, a build failed, a running app keeps crashing. Each person chooses which of those emails they want, per project, in **Project settings → Notifications**.

## Categories

| Category                 | What it covers                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Successful deploys**   | An app went live, or a new version of it replaced the last one.                                  |
| **Failed deploys**       | A build or a deploy failed, or GitHub pushes were paused for an app.                             |
| **App health**           | A running app keeps crashing, runs out of memory, a scheduled task fails, or it is rate-limited. |
| **Platform maintenance** | A runtime your apps use is going to be retired, and what to change before it is.                 |

Turning a category off only affects you. Everything else keeps arriving.

### If you never choose

Until you pick for yourself, each category follows a default that depends on what you do in the project:

- **Successful deploys** reach only **whoever launched the deploy**. Pushes from a connected repository count as the app's owner's.
- **Failed deploys, app health and platform maintenance** reach the people who **work on the apps**: members, the person who created the app, and owners who launched a deploy in the project in the last 90 days.
- **Viewers** get none of them by default.

So an owner who only manages the project — and never deploys — doesn't get build errors in their inbox unless they turn them on. The Notifications tab shows, for every category, whether it is on and whether that is your choice or the default.

### Choosing for someone else

Owners see a **Members** table in the same tab and can turn categories on or off for anyone in the project — for instance, to stop sending build failures to a colleague who doesn't work on the code. A member or a viewer can only change their own.

## Billing and team emails

These are not categories you subscribe to:

- **Billing and plan limits** — payments, invoices, the trial, a deploy queued by the daily limit, an app paused because it needs a paid plan, usage and traffic warnings — go to **whoever pays for the project**. Owners can add a **billing contact** in the Notifications tab, an extra address such as your accountant, that gets them too. Other members see these as banners in the dashboard instead.
- **Team** emails — invitations, and changes to your own role — always go to the person they are about.

## Unsubscribing from an email

Every email of a category you can turn off says why you got it and has two links at the bottom: **Manage notifications**, which opens the project's tab, and **Stop … emails**, which turns that one category off for you in that project, with one click. Your mail client's own _Unsubscribe_ button does the same.

## Activity

The **Activity** section at the bottom of the tab lists every email about the project, newest first: who it was sent to, whether it was **delivered**, **bounced** or **opened**, and who was **left out** and why — for example _"never chose; off by default"_ or _"turned off failed deploy emails"_. Owners see every email of the project; anyone else, only their own.

Use it to answer "I never got the email": if it is listed as delivered, look in the spam folder; if it bounced, the address doesn't accept mail; if you were left out, the reason says which setting to change.

## From the API

| Method | Path                                                                      | Who                                      |
| ------ | ------------------------------------------------------------------------- | ---------------------------------------- |
| `GET`  | `/project/:id/notification-preferences`                                   | owners see everyone; others, themselves  |
| `GET`  | `/project/:id/notification-preferences/me`                                | any member                               |
| `PUT`  | `/project/:id/notification-preferences/me` `{ categories }`               | any member                               |
| `PUT`  | `/project/:id/members/:user_id/notification-preferences` `{ categories }` | owner                                    |
| `PUT`  | `/project/:id/billing-contact` `{ billing_contact_email }`                | owner                                    |
| `GET`  | `/project/:id/notifications/activity`                                     | owners see everything; others, their own |

`categories` takes any of `deploys`, `failures`, `app_health` and `maintenance` as `true` or `false`; the ones you don't send keep their value. See [Members & Roles](members.md) for who is an owner, a member or a viewer.
