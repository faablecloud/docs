import { RANKS, SITE_URL, collectPages } from './pages'

export { SITE_URL }

// Top-level sections in display order, with human-friendly labels.
const SECTIONS = [
  { prefix: '/deploy', title: 'Faable Deploy' },
  { prefix: '/auth', title: 'Faable Auth' },
  { prefix: '/cli', title: 'CLI' },
  { prefix: '/platform', title: 'Platform & Policies' }
]

// The documentation pages an LLM should read, grouped by section and ordered by
// rank inside each one: entry points first, then guides and comparisons, then
// reference, then the secondary pages. Within a rank the navigation order from
// _meta.ts is preserved. `rank: none` pages are not documentation of the
// product and never reach this list.
export async function groupedPages() {
  const pages = (await collectPages()).filter(page => page.rank !== 'none')

  // Anything outside the known sections goes to "Overview".
  const grouped = new Map([['Overview', []]])
  for (const { title } of SECTIONS) grouped.set(title, [])

  for (const page of pages) {
    const section = SECTIONS.find(s => page.route.startsWith(s.prefix))
    grouped.get(section ? section.title : 'Overview').push(page)
  }

  // Array.prototype.sort is stable, so equal ranks keep navigation order.
  for (const list of grouped.values())
    list.sort((a, b) => RANKS[a.rank].order - RANKS[b.rank].order)

  return grouped
}

// How many characters of description each rank earns in llms.txt. The file is
// an index, not the documentation — llms-full.txt carries the full text — and
// descriptions were 64% of its bytes. Entry points keep theirs whole under
// "Start here", guides and comparisons keep their first sentence, reference
// pages keep enough of a clause to be told apart, and the secondary ones are
// just a title and a URL.
const DESCRIPTION_BUDGET = {
  entry: 260,
  high: 140,
  normal: 80,
  low: 0
}

// Fit a description into its budget. Ending on the first sentence reads better
// than a clip, but only when that sentence carries its weight: many of these
// descriptions open by restating the title ("Deploy a Next.js application to
// Faable Deploy from GitHub.") and put what distinguishes the page in the
// clause after it — exactly what an index has to keep.
function summarize(description, budget) {
  if (!budget) return ''
  if (description.length <= budget) return description
  // A period followed by a capital: an initial or a version number is safe.
  const sentence = description.match(/^[\s\S]*?[a-z0-9)\]]\.(?=\s+[A-Z])/)
  if (sentence && sentence[0].length >= budget * 0.6) return sentence[0]
  const clipped = description
    .slice(0, budget)
    // An unclosed parenthesis or a dangling function word reads as a glitch.
    .replace(/\s*\([^)]*$/, '')
    .replace(/\s+\S*$/, '')
    .replace(
      /(?:\s+(?:and|or|the|a|an|of|for|with|in|on|to|by|from|that|which|plus))+$/i,
      ''
    )
    .replace(/[\s,;:—-]+$/, '')
  return `${clipped}…`
}

// One llms.txt link line. Pass a budget to override the page's rank — an entry
// point spends its full description in "Start here", so the copy that keeps it
// listed in its own product section is a bare link.
export function pageLine(page, budget = DESCRIPTION_BUDGET[page.rank]) {
  const description = summarize(page.description, budget)
  return description
    ? `- [${page.title}](${page.url}): ${description}`
    : `- [${page.title}](${page.url})`
}
