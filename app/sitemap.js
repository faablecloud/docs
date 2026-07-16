import { getPageMap } from 'nextra/page-map'
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

  return routes.sort().map(route => ({
    // route already starts with "/", strip it to avoid a double slash
    url: `${SITE_URL}${route === '/' ? '' : route}`,
    lastModified: lastModifiedForRoute(route, buildDate),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.7
  }))
}
