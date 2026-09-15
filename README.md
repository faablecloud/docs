# Faable Docs

The public documentation at [faable.com/docs](https://faable.com/docs) — Faable Deploy,
Faable Auth, the CLI and the platform policies. Next.js + [Nextra](https://nextra.site),
hosted on Faable Deploy: **every push to `main` builds and goes live**, no workflow to run.

Everything published is in English.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # also runs the three post-build gates below
```

`npm run build` fails, on purpose, when:

- `check-links` finds an internal link with no page behind it;
- `check-sitemap` finds a page missing from the sitemap, or a sitemap URL that would 404;
- a page declares a `rank` that does not exist (see below).

## Writing a page

Pages live in `content/`, and the route mirrors the path: `content/auth/clients.md` is
`/docs/auth/clients`. Each folder's `_meta.ts` sets the sidebar labels, the separators and
**the order** — which is also the order pages appear in `llms.txt`, so it is worth getting
right.

Frontmatter:

```yaml
---
title: Deploy a Next.js App
description:
  Deploy a Next.js application to Faable Deploy from GitHub. Zero-config build
  and start, automatic standalone output (~150 MB images), environment variables…
rank: high # optional
schema: faq # optional, renders FAQPage structured data
---
```

`title` and `description` are required. A description with a colon followed by a space
breaks the YAML parser — use a dash instead.

**Front-load what makes the page different.** Search engines cut the description around 155
characters and `llms.txt` clips it by rank, so an opening sentence that only restates the
title ("Deploy a Next.js application to Faable Deploy from GitHub.") spends the whole budget
saying nothing.

## `rank` — how much weight a page carries

One optional field decides how the page is treated by the two automated readers of this
site: the LLM files (`/docs/llms.txt`, `/docs/llms-full.txt`) and the sitemap. Omit it and
the page is reference material, which is the right default for most pages.

| `rank`      | `llms.txt`                                  | sitemap       |
| ----------- | ------------------------------------------- | ------------- |
| `entry`     | listed under "Start here", full description | `0.9` weekly  |
| `high`      | top of its section, first 140 characters    | `0.8` weekly  |
| _(omitted)_ | after those, first 80 characters            | `0.6` monthly |
| `low`       | under "Optional", title only                | `0.3` yearly  |
| `none`      | **not listed at all**                       | `0.4` monthly |

Use `high` for integration guides, comparisons, conceptual explanations and feature pages;
`entry` only for the handful of pages that are a genuine way in; `low` for legal and policy
pages; `none` for anything that is not product documentation, such as the Academy course
and its exam.

`none` is not `noindex`: the page stays in the sitemap, in `robots.txt`, in the navigation
and in the site search. It only stops competing with the product docs inside the file that
an LLM reads to decide what to fetch.

The table above lives in `app/_lib/pages.js`, which is also where `llms.txt`, `llms-full.txt`
and `sitemap.xml` all get their list of pages.
