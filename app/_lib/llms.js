import { getPageMap } from 'nextra/page-map'
import fs from 'node:fs'
import path from 'node:path'

export const SITE_URL = 'https://faable.com/docs'
const CONTENT_DIR = path.join(process.cwd(), 'content')

// Top-level sections in display order, with human-friendly labels.
const SECTIONS = [
  { prefix: '/deploy', title: 'Faable Deploy' },
  { prefix: '/auth', title: 'Faable Auth' },
  { prefix: '/cli', title: 'CLI' },
  { prefix: '/platform', title: 'Platform & Policies' },
]

// Recursively collect every page route from Nextra's page map.
function collectRoutes(items, routes = new Set()) {
  for (const item of items) {
    if (item.children) {
      if (item.route) routes.add(item.route)
      collectRoutes(item.children, routes)
    } else if (item.route && item.name !== 'meta') {
      routes.add(item.route)
    }
  }
  return routes
}

// Resolve the source file for a route (same candidate resolution as the sitemap).
function sourceFileFor(route) {
  const rel = route === '/' ? 'index' : route.replace(/^\//, '')
  const candidates = [
    `${rel}.md`,
    `${rel}.mdx`,
    path.join(rel, 'index.md'),
    path.join(rel, 'index.mdx'),
  ]
  for (const candidate of candidates) {
    const abs = path.join(CONTENT_DIR, candidate)
    try {
      if (fs.statSync(abs).isFile()) return abs
    } catch {
      // try next candidate
    }
  }
  return null
}

// Minimal frontmatter parser — frontmatter here is simple single-line YAML.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  const meta = {}
  if (!match) return { meta, body: raw }
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  return { meta, body: raw.slice(match[0].length) }
}

function firstHeading(body) {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

// Returns the ordered list of documentation pages with title, description and body.
export async function collectPages() {
  const pageMap = await getPageMap()
  const routes = [...collectRoutes(pageMap)]

  const pages = routes
    .map((route) => {
      const file = sourceFileFor(route)
      if (!file) return null
      const raw = fs.readFileSync(file, 'utf8')
      const { meta, body } = parseFrontmatter(raw)
      return {
        route,
        url: `${SITE_URL}${route === '/' ? '' : route}`,
        title: meta.title || firstHeading(body) || route,
        description: meta.description || '',
        body: body.trim(),
      }
    })
    .filter(Boolean)

  // Assign each page to a section (anything else goes to "Overview").
  const grouped = new Map([['Overview', []]])
  for (const { title } of SECTIONS) grouped.set(title, [])

  for (const page of pages) {
    const section = SECTIONS.find((s) => page.route.startsWith(s.prefix))
    grouped.get(section ? section.title : 'Overview').push(page)
  }

  for (const list of grouped.values()) list.sort((a, b) => a.route.localeCompare(b.route))

  return grouped
}
