import { readFileSync } from 'node:fs'
import { sourceFileFor } from './last-modified'
import { PRODUCT_NAMES } from './products'

const SITE_URL = 'https://faable.com/docs'
const OG_IMAGE = 'https://faable.com/assets/brand/FaableLoginSocial.png'

const publisher = {
  '@type': 'Organization',
  name: 'Faable',
  url: 'https://faable.com',
  logo: 'https://faable.com/assets/logo/Emblem.png'
}

// The home's canonical is /docs/ (trailing slash): Google picked that form,
// and the sitemap and the page's <link rel=canonical> advertise it.
const urlForRoute = route => `${SITE_URL}${route === '/' ? '/' : route}`

// Slug words that are acronyms or brand-cased, so "oauth-flows" reads
// "OAuth Flows" and not "Oauth Flows".
const SLUG_WORDS = { oauth: 'OAuth', oidc: 'OIDC' }

function humanize(slug) {
  return slug
    .split(/[-_]/)
    .map(w => SLUG_WORDS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// schema.org BreadcrumbList from the page path. The leaf uses the real page
// title; intermediate segments are named after the product or humanized from
// their slug. A segment with no page of its own (/auth/guides, /deploy/domains,
// /platform…) is left out: those URLs are 302s, and a breadcrumb has to point
// at pages.
export function buildBreadcrumb(mdxPath, leafTitle) {
  const segments = mdxPath ?? []
  if (segments.length === 0) return null // homepage: a one-item breadcrumb is noise

  const items = [{ name: 'Docs', url: urlForRoute('/') }]
  let acc = ''
  segments.forEach((segment, i) => {
    acc += `/${segment}`
    const isLast = i === segments.length - 1
    if (!isLast && !sourceFileFor(acc)) return
    items.push({
      name:
        isLast && leafTitle
          ? leafTitle
          : (PRODUCT_NAMES[segment] ?? humanize(segment)),
      url: urlForRoute(acc)
    })
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  }
}

// TechArticle for a docs page — gives AI engines and search a verifiable,
// dated, attributed unit they can cite. dates are ISO strings.
export function buildArticle({
  route,
  title,
  description,
  published,
  modified
}) {
  if (!title) return null
  const url = urlForRoute(route)
  const iso = d => (d instanceof Date ? d.toISOString() : d)
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    ...(description ? { description } : {}),
    inLanguage: 'en',
    url,
    mainEntityOfPage: url,
    image: OG_IMAGE,
    datePublished: iso(published),
    dateModified: iso(modified),
    author: publisher,
    publisher
  }
}

function stripFrontmatter(raw) {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?/)
  return m ? raw.slice(m[0].length) : raw
}

function stripInlineMarkdown(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\s+/g, ' ')
    .trim()
}

// Parse "## Question?" / "### Question?" + following body into Q&A pairs.
// Only headings that read as questions (end with "?") are treated as FAQ
// entries, so sections like "## Related" are ignored. H3 support lets pages
// keep their FAQ under a single "## FAQ" section (e.g. the oauth-flow pages).
function parseFaq(body) {
  const faqs = []
  const matches = [...body.matchAll(/^###?\s+(.+?)\s*$/gm)]
  for (let i = 0; i < matches.length; i++) {
    // Headings carry decorative emoji and inline code; the schema question is
    // what search shows as text, so keep only the words.
    const question = stripInlineMarkdown(
      matches[i][1].replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    )
    if (!question.endsWith('?')) continue
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length
    const answer = stripInlineMarkdown(body.slice(start, end))
    if (answer) faqs.push({ question, answer })
  }
  return faqs
}

// FAQPage built from the page's own source, so the schema and the visible
// content never drift. Returns null if the page has no question headings.
export function buildFaqPage(route) {
  const file = sourceFileFor(route)
  if (!file) return null
  let body
  try {
    body = stripFrontmatter(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
  const faqs = parseFaq(body)
  if (faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  }
}
