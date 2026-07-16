import { SITE_URL, collectPages } from '../_lib/llms'

export const dynamic = 'force-static'

const INTRO = `# Faable Docs

> Documentation for Faable — a European cloud platform that converges zero-ops application hosting (Faable Deploy) and a multi-tenant identity server (Faable Auth) into a single abstraction layer, with 100% European hosting and full GDPR data sovereignty.

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
