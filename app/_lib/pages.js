import { getPageMap } from 'nextra/page-map'
import fs from 'node:fs'
import { sourceFileFor } from './last-modified'

export const SITE_URL = 'https://faable.com/docs'

// A page's `rank` frontmatter field weighs it for the two automated readers of
// these docs: the LLM files (llms.txt, llms-full.txt) and the sitemap.
//
//   entry  — the short path into a product; listed under "Start here"
//   high   — integration guides, comparisons, concepts and features
//   normal — product reference: correct, but not where anyone starts (default)
//   low    — secondary pages (legal); safe to skip when context is short
//   none   — not product documentation (the Academy course and its exam). Kept
//            out of the LLM files entirely, where it would compete with the
//            product docs. It still ships in the sitemap, in robots.txt, in the
//            navigation and in search: "none" is not "noindex".
//
// `order` sorts pages inside a section; `priority`/`changeFrequency` are the
// sitemap hints (Google ignores both since 2015, other crawlers still read
// them — it costs nothing to be accurate here).
export const RANKS = {
  entry: { order: 0, priority: 0.9, changeFrequency: 'weekly' },
  high: { order: 1, priority: 0.8, changeFrequency: 'weekly' },
  normal: { order: 2, priority: 0.6, changeFrequency: 'monthly' },
  low: { order: 3, priority: 0.3, changeFrequency: 'yearly' },
  none: { order: 4, priority: 0.4, changeFrequency: 'monthly' }
}

const DEFAULT_RANK = 'normal'

// Recursively collect every page route from Nextra's page map. Insertion order
// is the depth-first walk of the page map, which Nextra returns already sorted
// by _meta.ts — i.e. the navigation order, which is a curated priority in
// itself. Callers rely on it, so keep the Set (insertion-ordered).
function collectRoutes(items, routes = new Set()) {
  for (const item of items) {
    if (item.children) {
      // Folder: it may itself be a page (has a route) and contains children
      if (item.route) routes.add(item.route)
      collectRoutes(item.children, routes)
    } else if (item.route && item.name !== 'meta') {
      routes.add(item.route)
    }
  }
  return routes
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

// Nothing validates frontmatter in this repo — no tests, no linter over
// content/**. Both llms routes are force-static, so throwing here turns a typo
// into a failed `next build` instead of a page silently ranked as reference.
function rankOf(meta, file) {
  const rank = meta.rank || DEFAULT_RANK
  if (!RANKS[rank]) {
    throw new Error(
      `${file}: unknown rank "${rank}". Use one of: ${Object.keys(RANKS).join(', ')}.`
    )
  }
  return rank
}

// Every documentation page, in navigation order, with its frontmatter and rank.
// Deliberately unfiltered: the sitemap must advertise every prerendered page
// (check-sitemap.mjs fails the build otherwise), so dropping `rank: none` is
// the LLM files' business, not this collector's.
export async function collectPages() {
  const pageMap = await getPageMap()

  return [...collectRoutes(pageMap)]
    .map(route => {
      // Folders without an index page have a route but no page behind them.
      const file = sourceFileFor(route)
      if (!file) return null
      const raw = fs.readFileSync(file, 'utf8')
      const { meta, body } = parseFrontmatter(raw)
      return {
        route,
        url: `${SITE_URL}${route === '/' ? '' : route}`,
        title: meta.title || firstHeading(body) || route,
        description: meta.description || '',
        rank: rankOf(meta, file),
        body: body.trim()
      }
    })
    .filter(Boolean)
}
