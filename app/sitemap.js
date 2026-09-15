import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { lastModifiedForRoute } from './_lib/last-modified'
import { RANKS, SITE_URL, collectPages } from './_lib/pages'

export default async function sitemap() {
  // Every documentation page, ranked by its `rank` frontmatter field. Note the
  // sitemap advertises ALL of them, `rank: none` included: check-sitemap.mjs
  // fails the build when a prerendered page is missing here, and dropping a
  // page from the sitemap without a noindex is an SEO regression, not a
  // filter. The rank only weighs the page — it never removes it.
  const pages = await collectPages()

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
    pages
      .map(({ route, rank }) => ({
        // route already starts with "/", strip it to avoid a double slash.
        // The root advertises the trailing-slash form: /docs and /docs/ both
        // resolve, and Google picked /docs/ as the canonical — advertising
        // /docs made GSC report the sitemap URL as a non-indexed duplicate.
        url: `${SITE_URL}${route === '/' ? '/' : route}`,
        lastModified: lastModifiedForRoute(route, buildDate),
        changeFrequency: RANKS[rank].changeFrequency,
        priority: route === '/' ? 1 : RANKS[rank].priority
      }))
      .sort((a, b) => a.url.localeCompare(b.url))
  )
}
