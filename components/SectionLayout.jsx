'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Layout } from 'nextra-theme-docs'

// Sections with their own tree of pages: the two products and the platform
// policies. CLI, FAQ and the home are single pages.
const SECTIONS = new Set(['deploy', 'auth', 'platform'])

// Nextra's mobile menu renders the whole page map, so every page used to ship
// a link to every other page — an Auth page carried 45 links to Deploy, hidden
// only by CSS, and crawlers read links whatever the CSS says. The page map is
// pruned per route instead: the current section keeps its tree, every other
// section keeps only its first page, which is what its navbar tab and its
// entry in the mobile menu link to. The desktop sidebar was already per
// section (content/_meta.ts); llms.txt and the sitemap read the full page map
// on the server and are not affected.
function prune(pageMap, keep) {
  return pageMap.map(item => {
    if (!item.children || item.route === `/${keep}`) return item
    const name = item.route?.slice(1)
    if (!SECTIONS.has(name)) return item
    const meta = item.children.filter(child => 'data' in child)
    const first = item.children.find(child => !('data' in child))
    return { ...item, children: first ? [...meta, first] : meta }
  })
}

// Rendered on the server too (usePathname is known at prerender time), so the
// static HTML already carries the pruned menu.
export function SectionLayout({ pageMap, ...props }) {
  const pathname = usePathname()
  const section = pathname.split('/')[1]
  const pruned = useMemo(
    () => prune(pageMap, SECTIONS.has(section) ? section : null),
    [pageMap, section]
  )
  return <Layout pageMap={pruned} {...props} />
}
