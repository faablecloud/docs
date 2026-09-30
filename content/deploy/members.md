---
title: Project Members and Roles
description: Invite people to a Faable Deploy project, give each one a role (owner, member or viewer), hand over ownership and billing, and see who changed what.
---

# Project Members and Roles

A project is shared with everyone you invite to it, and each person has a **role** that decides what they can do. Manage it all from **Project settings → Members** in the dashboard.

## Roles

| What they can do                                            | Viewer | Member | Owner |
| ----------------------------------------------------------- | :----: | :----: | :---: |
| See the project, its apps, deployments, logs and domains    |   ✅   |   ✅   |  ✅   |
| Deploy; create, edit and delete apps, domains and variables |        |   ✅   |  ✅   |
| Read secret values, registry credentials and API keys       |        |   ✅   |  ✅   |
| Invite people, change roles, remove members                 |        |        |  ✅   |
| Rename or delete the project                                |        |        |  ✅   |
| Change the plan and manage billing                          |        |        |  ✅   |
| Leave the project                                           |   ✅   |   ✅   |  ✅   |

A project always keeps **at least one owner**: the last owner can't step down, leave or be removed. Make someone else an owner first, or delete the project.

Anything a role doesn't allow is refused with `role_required`, and the error says which role it needs.

## Inviting people

**Invite people** asks for one or more email addresses and the role they'll get. Each person receives an email with a link that is valid for **7 days**.

- They can accept with **any sign-in method** — email code, Google or GitHub — as long as the account's **verified** email is the invited one. Signed in with a different account, the page tells them which address the invitation is for and lets them switch.
- If they already have a Faable account, they also see the invitation at the top of the dashboard and can **accept or decline** it there, without the email.
- Nobody gets an account created by being invited: people sign up themselves when they accept.

Pending invitations are listed under the members, where an owner can **resend** one (the old link stops working) or **revoke** it. A project can have up to **20 pending invitations**, and a person can send up to **50 invitations a day**.

## Changing roles, removing and leaving

Owners change anyone's role from the role picker on their row, and remove people from the **⋯** menu. Everyone can **Leave project** from their own row. Every change asks for confirmation first and says what it does — for example, that a viewer can no longer deploy or read secret values.

## Ownership and billing

The **owner** role and **who pays** for the project are separate: the person who pays is marked **Billing** in the member list, and must be an owner.

- **Hand over billing** — from the **⋯** menu of another owner, the person who pays can pass billing to them. From then on the plan and invoices go to their account, and a free project counts towards their free projects.
- **Transfer ownership** — makes the other person an owner, hands them billing if you were paying, and turns you into a member, in one step.

Billing can be handed over only while the project has **no active subscription**. With one, write to [support@faable.com](mailto:support@faable.com) and we'll move it for you.

## Activity

**Project settings → Activity** lists who joined, left, was invited, removed or changed role, and who did it, newest first. A change can take a few seconds to show up.

## From the API

The same operations are available on the [Deploy API](sdk.mdx), authenticated as a user and without the `x-faable-project` header for the invitation endpoints:

| Method   | Path                                       | Who                         |
| -------- | ------------------------------------------ | --------------------------- |
| `GET`    | `/project/:id/members`                     | any member                  |
| `POST`   | `/project/:id/invite`                      | owner                       |
| `GET`    | `/project/:id/invitations`                 | any member                  |
| `POST`   | `/project/:id/members/:user_id` `{ role }` | owner                       |
| `DELETE` | `/project/:id/members/:user_id`            | owner, or yourself to leave |
| `POST`   | `/project/:id/billing-owner` `{ user_id }` | who pays                    |
| `GET`    | `/project/:id/activity`                    | any member                  |
| `GET`    | `/project-invitations`                     | you                         |
| `POST`   | `/project-invitations/:invite_id/accept`   | you                         |
| `POST`   | `/project-invitations/:invite_id/decline`  | you                         |
