import { collectPages } from '../_lib/llms'

export const dynamic = 'force-static'

const HEADER = `# Faable Docs — Full Text

> Complete documentation for Faable (Faable Deploy + Faable Auth), concatenated as a single document for LLM ingestion. European cloud platform with zero-ops hosting and a multi-tenant identity server, hosted 100% in Europe under GDPR.

Faable Deploy builds and runs a GitHub repository as a public HTTPS service with no Dockerfile and no CI configuration. Common workloads: REST and JSON APIs in Python (Flask, FastAPI, Django) and Node.js (Express, NestJS); WhatsApp and Telegram bots in webhook mode, in Node.js or Python; and web apps in Next.js, Vite and static frameworks. Supported runtimes: Node.js 20, 22, 24 and Python 3.11, 3.12.
`

export async function GET() {
  const grouped = await collectPages()

  const parts = [HEADER]
  for (const [section, pages] of grouped) {
    if (!pages.length) continue
    parts.push(`\n# ${section}\n`)
    for (const page of pages) {
      parts.push(
        `\n---\n\n## ${page.title}\n\nSource: ${page.url}\n\n${page.body}\n`
      )
    }
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
