---
title: Web Application Firewall (WAF)
description: Faable Deploy filters hostile requests at the edge, before they reach your app — on every plan. See what the platform blocks for you, add your own rules by path, user-agent or query parameter, and read what was stopped.
---

# Web Application Firewall

**Every Faable app sits behind an edge firewall that stops hostile requests before they reach your code — on every plan, including Free.** Faable maintains rulesets against the traffic every site on the internet receives (scanners hunting for `.env` files, Git metadata, credentials, admin panels and known exploits), and you can add your own rules by path, user-agent or query parameter, from the CLI or the dashboard.

A blocked request is answered at the edge. It never runs your code, never wakes an app that is scaled to zero, and does not count as traffic in your Metrics.

## What Faable blocks for you

These rulesets are maintained by Faable and applied automatically. When we add a rule, every app gets it without a redeploy.

| Ruleset                  | Applies to                       | Stops                                                                                                                                 |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Sensitive files          | Every app                        | `.env` files, `.git/` and other VCS metadata, cloud and SSH credentials, Terraform state, source maps, `phpinfo`, `phpMyAdmin`…       |
| Secret scanners          | Every app                        | Credential and config files requested by name, backups and dumps, framework debug endpoints                                           |
| Command-injection probes | Every app                        | Query parameters used to try to run commands on the server                                                                            |
| PHP scanners             | Every app that does not run PHP  | Any `.php` request, `/wp-*`, `/xmlrpc`, Magento, Joomla and OpenCart fingerprints — on an app that cannot serve PHP, these are probes |
| WordPress probes         | Every app that does not run PHP  | WordPress REST API probes sent as query parameters                                                                                    |
| WordPress                | WordPress sites hosted on Faable | XML-RPC, `wp-config.php` and its backup copies, debug logs, the web installer, PHP in `uploads/`, and user enumeration by `?author=`  |

Some paths are also refused for every app because scanners request them by the thousand: archives (`.zip`, `.tar.gz`, `.sql`, `.bak`…), dotfiles (`/.env`, `/.git/`… — `/.well-known/` stays open) and configuration files. If your app really serves one of them, [allow that path](#allow-a-path-faable-blocks).

The rulesets in effect for your app are listed in the **Firewall** tab of the app and by `faable deploy waf list`. Their exact patterns are not published, so they cannot be used as a map around them.

## What it does not do

The firewall matches requests by **path, `User-Agent` and query parameter name**. Be clear about what that leaves out:

- It does **not** read request bodies, other headers or the values of query parameters.
- It is **not** a signature engine such as the OWASP Core Rule Set: it does not detect SQL injection or cross-site scripting in your forms and APIs.
- There is no monitor (log-only) mode: a rule blocks as soon as it is in place.

It removes the noise every public site receives and shuts the doors scanners try first. It does not replace validating input in your code, and it does not cover the OWASP Top 10 on its own.

## Your own rules

Add rules for the traffic that is specific to your app. A rule selects requests and decides what they get back:

| Action  | Answer     | Use it when                                                                                   |
| ------- | ---------- | --------------------------------------------------------------------------------------------- |
| `block` | `403`      | You want the request refused: a scanner probe, an admin path that should not be public        |
| `sink`  | `404`      | Your app does not serve that path anyway. Faable answers the same 404 without waking your app |
| `allow` | your app's | Faable blocks that path for every app (a `.zip`, a dotfile) and your app really serves it     |

A rule matches on:

| Selector                     | Example                             | Matches                             |
| ---------------------------- | ----------------------------------- | ----------------------------------- |
| Path                         | `'^/wp-admin'`                      | that path, from anyone              |
| User-Agent                   | `--user-agent YisouSpider`          | that client, on **every** path      |
| Query parameter              | `--query rest_route`                | any request carrying that parameter |
| Path **and** User-Agent      | `'^/api/' --user-agent YisouSpider` | both must match                     |
| Path **and** query parameter | `'^/$' --query author`              | both must match                     |

Paths and user-agents are regular expressions (RE2: no lookahead or backreferences). A query selector is a parameter **name**, matched by its presence, not a regex. Rules take about 20 seconds to reach the edge.

### From the CLI

```bash
faable deploy waf block '^/\.well-known/'           # 403 at the edge
faable deploy waf sink '^/robots\.txt$'             # 404 without waking the app
faable deploy waf block --user-agent YisouSpider    # a crawler, on every path
faable deploy waf block --query rest_route          # any request with ?rest_route=
faable deploy waf list                              # platform rulesets and your rules
faable deploy waf rm '^/robots\.txt$'               # remove a rule as you created it
```

**Quote patterns in your shell**: `$`, `\` and `?` are shell metacharacters. The full reference, with output and every option, is in the [CLI docs](../cli.md#edge-rules-waf).

### From the dashboard

Open your app and go to the **Firewall** tab. **Add rule** offers the same selectors and actions. Each rule shows its description, so the reason for it stays with it, and can be edited or removed.

### Allow a path Faable blocks

```bash
faable deploy waf allow '^/downloads/.*\.zip$'
```

An `allow` rule lets one path through the platform's refusal of archives, dotfiles and config files. It is a path rule only: a user-agent or query exception could be claimed by anyone sending that header. Your own `block` and `sink` rules still win over it. Keep the pattern as narrow as what you serve.

### Safeguards and limits

Some rules would take your app offline or break the platform, and are refused with the reason:

- a path pattern that matches your site root `/`, or a user-agent pattern that matches a real browser;
- a user-agent pattern that matches Faable's own platform traffic (certificate renewal);
- an `allow` pattern that covers `/`, `/.well-known/acme-challenge/`, `/.faable/` or `/_next/`.

Search engines, AI crawlers, uptime monitors and query parameters that carry a sign-in flow are refused until you confirm with `--force` (**Add anyway** in the dashboard). Certificate renewal always gets through: `/.well-known/acme-challenge/` stays reachable even under a broad rule.

Each app can have up to **50 rules**, with at most 10 user-agent patterns, 10 query parameters and 4,000 bytes of patterns in total.

## See what was stopped

The **Firewall** tab shows the requests stopped over the last 24 hours, 7 days or 30 days: blocked (`403`) and sunk (`404`) over time, the most-blocked paths and the user-agents behind them. These requests never reached your app, so they are not in Metrics.

## Troubleshooting

- **A legitimate request gets a `403` it should not.** Check `faable deploy waf list` for a rule of yours that covers it, and remove or narrow it. If it is a path Faable blocks for every app (an archive, a dotfile, a config file), [allow it](#allow-a-path-faable-blocks). Otherwise, contact support with the URL: platform rulesets are only tuned by Faable.
- **A rule does not seem to apply.** Wait about 20 seconds, then test with `curl -s -o /dev/null -w '%{http_code}\n' https://<your-app>/<path>`. Path patterns match the path only, without the query string: use `--query` for parameters.
- **Your error rate in Metrics shows scanner 404s.** Those requests reached your app because no rule covered them. A `sink` rule answers them at the edge and keeps them out of Metrics.

## Related

- [CLI reference: edge rules](../cli.md#edge-rules-waf)
- [Get Started with Faable Deploy](get-started.md)
- [Custom domains](domains/custom-domain.md) · [SSL certificates](domains/ssl-certificates.md)
- [Faable Deploy vs Vercel, Render & Railway](compare.mdx): the firewall is included, not an add-on
