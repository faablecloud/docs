import { getPageMap } from 'nextra/page-map'
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = 'https://faable.com/docs'
const CONTENT_DIR = path.join(process.cwd(), 'content')

// Recursively collect every page route from Nextra's page map
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

// Resolve the source file for a route and return its last-modified date.
// Folder routes without an index file fall back to the build date.
function lastModifiedFor(route, fallback) {
  const rel = route === '/' ? 'index' : route.replace(/^\//, '')
  const candidates = [
    `${rel}.md`,
    `${rel}.mdx`,
    path.join(rel, 'index.md'),
    path.join(rel, 'index.mdx'),
  ]
  for (const candidate of candidates) {
    try {
      const stat = fs.statSync(path.join(CONTENT_DIR, candidate))
      if (stat.isFile()) return stat.mtime
    } catch {
      // file doesn't exist, try next candidate
    }
  }
  return fallback
}

export default async function sitemap() {
  const pageMap = await getPageMap()
  const routes = collectRoutes(pageMap)

  const buildDate = new Date()

  return [...routes].sort().map((route) => ({
    // route already starts with "/", strip it to avoid a double slash
    url: `${SITE_URL}${route === '/' ? '' : route}`,
    lastModified: lastModifiedFor(route, buildDate),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}
