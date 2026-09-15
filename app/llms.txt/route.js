import { SITE_URL, groupedPages, pageLine } from '../_lib/llms'

export const dynamic = 'force-static'

// This file is served at BOTH faable.com/llms.txt (Fastly rewrites the Host to
// this app for the two llms paths) and faable.com/docs/llms.txt. The root is
// the canonical one — it is where the convention puts it and where agents
// actually fetch it — so that is what the file advertises about itself.
const SITE_ROOT = SITE_URL.replace(/\/docs$/, '')

// Above this, the `## Optional` section is dropped rather than shipped: those
// pages are the ones this file says can be skipped when context is short.
const MAX_BYTES = 40_000

const INTRO = `# Faable

> Faable is a European cloud platform that converges zero-ops application hosting (Faable Deploy) and a multi-tenant identity server (Faable Auth) into a single abstraction layer. Ship apps and AI agents straight from a Git repository — automatic deployments, free SSL, a built-in WAF and turnkey authentication — with no servers, pipelines or infrastructure to manage. Hosting is 100% European with full GDPR data sovereignty, and support comes from the engineers who build the platform.

One subscription covers both products: Free (0 €), Hobby (15 €/month) and Pro (99 €/month), each a flat monthly fee.

**What Faable Deploy is for**

Faable Deploy builds and runs a GitHub repository as a public HTTPS service, with no Dockerfile and no CI configuration. Push, and it detects the stack, installs dependencies, builds, and serves the app at \`https://<app>.faable.link\` with a valid certificate and a WAF in front. It suits, in particular:

- **REST and JSON APIs** in Python (Flask, FastAPI, Django) or Node.js (Express, NestJS) — the most common workload on the platform.
- **LLM apps and AI chatbots** in Node.js or Python. Streaming responses (Server-Sent Events) pass through unbuffered: the platform's 60-second limit is on time-to-first-byte, not on how long a generation streams.
- **Webhook endpoints and bots** driven by inbound HTTP — Stripe, GitHub Apps, WhatsApp, Telegram, Discord and Slack. Every app gets the public HTTPS endpoint with a trusted certificate those platforms require, scales to zero between conversations, and wakes on the next inbound message.
- **Web apps and sites** in Next.js, Vite and static frameworks.

Supported runtimes: Node.js 20, 22 and 24; Python 3.11 and 3.12. Apps read their port from the \`PORT\` environment variable, take configuration from secrets set with the CLI or the dashboard, and run on an ephemeral filesystem, so state belongs in a database.

**What Faable Auth is for**

Faable Auth is a managed, multi-tenant identity server built on OAuth 2.0 and OpenID Connect. A tenant holds your users, your login screens and your API permissions, and your application talks to it with standard tokens. Multi-tenancy is by host: each tenant answers on its own domain. It covers:

- **How people sign in**: email and password, passwordless magic link or 6-digit OTP, social login (Google, GitHub and Microsoft Entra ID preconfigured), any other provider through custom OAuth 2.0, and external OIDC issuers such as GitHub Actions. Universal Login puts every enabled connection on one hosted screen.
- **The five OAuth 2.0 grants**: Authorization Code with PKCE (\`S256\` enforced), Client Credentials, Device Code (RFC 8628), Refresh Token, and Token Exchange (RFC 8693) for keyless CI/CD.
- **OpenID Connect Core 1.0**: discovery at \`/.well-known/openid-configuration\`, RS256 ID tokens against a rotating JWKS, UserInfo, RP-Initiated and Front-Channel Logout, and Dynamic Client Registration (RFC 7591).
- **Your APIs, users and teams**: audience-scoped access tokens with a permission catalog per API, the account lifecycle (signup, email change, two-step verification, suspension, team invitations), and Actions, webhooks and audit logs to extend and inspect it.

Client libraries: \`@faable/auth-js\` for browser and native apps, \`@faable/auth-sdk\` for server-side code and the Management API.

The full documentation as a single plain-text file is available at ${SITE_ROOT}/llms-full.txt.`

// Not pages under content/, so they cannot come from the page map — and they
// are the two things this file would lose by replacing the hand-written index
// the landing used to serve at faable.com/llms.txt.
const PACKAGES = `## SDKs & Libraries

- [@faable/auth-js](https://www.npmjs.com/package/@faable/auth-js): Browser and React Native auth client — Authorization Code + PKCE, session storage, token refresh, multi-tab sync.
- [@faable/auth-helpers-react](https://www.npmjs.com/package/@faable/auth-helpers-react): React provider and hooks (\`SessionContextProvider\`, \`useSession\`, \`useUser\`) on top of @faable/auth-js.
- [@faable/auth-sdk](https://www.npmjs.com/package/@faable/auth-sdk): Node.js server SDK — verify access tokens and call the Auth Management API with client credentials.
- [@faable/deploy-sdk](https://www.npmjs.com/package/@faable/deploy-sdk): Node.js client for the Faable Deploy API — manage apps, deployments, domains and secrets programmatically.
- [@faable/faable](https://www.npmjs.com/package/@faable/faable): The Faable CLI — \`npm i -g @faable/faable\` to deploy and manage apps from the terminal.`

const COMPANY = `## Company

- [Dashboard / Console](https://dashboard.faable.com): Sign in and manage your apps and identity tenants.
- [GitHub](https://github.com/faablecloud)
- [LinkedIn](https://www.linkedin.com/company/faablecloud)
- [YouTube](https://www.youtube.com/channel/UCntzOA0TcsxWdne1EFZDu2g)`

function section(title, pages, budget) {
  const lines = pages.map(page => pageLine(page, budget?.(page)))
  return `## ${title}\n\n${lines.join('\n')}`
}

// Both products open with a page titled "Get Started": out of its section, an
// entry point needs the product name to be worth anything.
function qualified(sectionTitle, page) {
  const redundant =
    sectionTitle === 'Overview' || page.title.includes(sectionTitle)
  return redundant
    ? page
    : { ...page, title: `${sectionTitle} — ${page.title}` }
}

export async function GET() {
  const grouped = await groupedPages()

  // Entry points are repeated in "Start here" and kept in their own section:
  // whoever reads only "## Faable Auth" must still find the quickstart there.
  const start = []
  const optional = []
  const sections = []

  for (const [title, pages] of grouped) {
    const listed = []
    for (const page of pages) {
      if (page.rank === 'entry') start.push(qualified(title, page))
      if (page.rank === 'low') optional.push(page)
      else listed.push(page)
    }
    if (listed.length)
      sections.push(
        section(title, listed, page => (page.rank === 'entry' ? 0 : undefined))
      )
  }

  const parts = [INTRO]
  if (start.length) parts.push(section('Start here', start))
  parts.push(...sections, PACKAGES, COMPANY)

  if (optional.length) {
    const listing = section('Optional', optional)
    const withOptional = `${[...parts, listing].join('\n\n')}\n`
    parts.push(
      Buffer.byteLength(withOptional) <= MAX_BYTES
        ? listing
        : `## Optional\n\n- [Legal and policy pages](${SITE_ROOT}/llms-full.txt): omitted here for length; they are included in the full-text file.`
    )
  }

  const body = `${parts.join('\n\n')}\n`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
