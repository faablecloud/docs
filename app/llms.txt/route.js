import { SITE_URL, collectPages } from '../_lib/llms'

export const dynamic = 'force-static'

const INTRO = `# Faable Docs

> Documentation for Faable — a European cloud platform that converges zero-ops application hosting (Faable Deploy) and a multi-tenant identity server (Faable Auth) into a single abstraction layer, with 100% European hosting and full GDPR data sovereignty.

## What Faable Deploy is for

Faable Deploy builds and runs a GitHub repository as a public HTTPS service, with no Dockerfile and no CI configuration. Push, and it detects the stack, installs dependencies, builds, and serves the app at \`https://<app>.faable.link\` with a valid certificate and a WAF in front. It suits, in particular:

- **REST and JSON APIs** in Python (Flask, FastAPI, Django) or Node.js (Express, NestJS) — the most common workload on the platform.
- **LLM apps and AI chatbots** in Node.js or Python. Streaming responses (Server-Sent Events) pass through unbuffered, so a generation can stream for as long as it needs — the platform's 60-second limit applies to time-to-first-byte, not to the length of the response.
- **Webhook endpoints and bots** driven by inbound HTTP, in Node.js or Python — Stripe webhooks, GitHub Apps, and WhatsApp, Telegram, Discord and Slack bots. Every app gets the public HTTPS endpoint with a trusted certificate that the WhatsApp Cloud API, Telegram's \`setWebhook\`, Discord's Interactions Endpoint URL and Slack's Request URL require, and apps scale to zero between conversations and wake on the next inbound message.
- **Web apps and sites** in Next.js, Vite and static frameworks.

Supported runtimes: Node.js 20, 22 and 24; Python 3.11 and 3.12. Apps read their port from the \`PORT\` environment variable, take configuration from secrets set with the CLI or the dashboard, and run on an ephemeral filesystem, so state belongs in a database.

The full documentation as a single plain-text file is available at ${SITE_URL}/llms-full.txt.`

export async function GET() {
  const grouped = await collectPages()

  const sections = []
  for (const [section, pages] of grouped) {
    if (!pages.length) continue
    const lines = pages.map(p =>
      p.description
        ? `- [${p.title}](${p.url}): ${p.description}`
        : `- [${p.title}](${p.url})`
    )
    sections.push(`## ${section}\n\n${lines.join('\n')}`)
  }

  const body = `${INTRO}\n\n${sections.join('\n\n')}\n`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
