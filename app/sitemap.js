import { getPageMap } from 'nextra/page-map'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { lastModifiedForRoute, sourceFileFor } from './_lib/last-modified'

const SITE_URL = 'https://faable.com/docs'

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

export default async function sitemap() {
  const pageMap = await getPageMap()
  // Folders without an index page have a route in the page map but no actual
  // page behind it — advertising them would send crawlers to 404s.
  const routes = [...collectRoutes(pageMap)].filter(route =>
    sourceFileFor(route)
  )

  const buildDate = new Date()

  // Credential pages (app/badge/[id]) are prerendered from public/certs and
  // publicly verifiable — advertise them so the sitemap stays exactly the set
  // of prerendered pages (check-sitemap enforces both directions).
  const badges = readdirSync(join(process.cwd(), 'public', 'certs'))
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({
      url: `${SITE_URL}/badge/${f.replace(/\.json$/, '')}`,
      lastModified: buildDate,
      changeFrequency: 'yearly',
      priority: 0.3
    }))

  return badges.concat(
    routes.sort().map(route => ({
      // route already starts with "/", strip it to avoid a double slash.
      // The root advertises the trailing-slash form: /docs and /docs/ both
      // resolve, and Google picked /docs/ as the canonical — advertising
      // /docs made GSC report the sitemap URL as a non-indexed duplicate.
      url: `${SITE_URL}${route === '/' ? '/' : route}`,
      lastModified: lastModifiedForRoute(route, buildDate),
      changeFrequency: 'weekly',
      priority: route === '/' ? 1 : 0.7
    }))
  )
}
