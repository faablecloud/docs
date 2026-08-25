import { ImageResponse } from 'next/og'
import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_SIZE, toOgSegments } from '../../_lib/og'

// Social card generator: /docs/og/<page path>.png renders the card for that
// docs page, with its own frontmatter title. It mirrors the page route's
// params and is force-static, so every card is a PNG baked at build time —
// crawlers never make the origin render an image.
//
// It cannot live as an `opengraph-image` file next to the page: Next refuses
// metadata image files after an optional catch-all segment. The URL is wired
// by hand in the page's generateMetadata instead.
export const dynamic = 'force-static'
// Only the prerendered set exists: anything else 404s instead of rendering an
// image on the origin (the metadata never points anywhere else).
export const dynamicParams = false

// The prerendered set has to match what ogImageUrl() puts in the metadata.
const pageParams = generateStaticParamsFor('mdxPath')

export async function generateStaticParams() {
  const pages = await pageParams()
  return pages.map(({ mdxPath }) => ({ mdxPath: toOgSegments(mdxPath) }))
}

// Brand: same palette as the hand-made card (assets/brand/FaableLoginSocial.png)
// — slate-900 canvas, DM Sans (the landing's typeface), gradient emblem.
const BG = '#0f172a'
const CYAN = '#22d3ee'
const MAGENTA = '#c026d3'

const SECTIONS = {
  deploy: 'Faable Deploy',
  auth: 'Faable Auth',
  platform: 'Faable Platform'
}

const ACRONYMS = { oauth: 'OAuth', api: 'API', cli: 'CLI', faq: 'FAQ' }

function prettify(slug) {
  return String(slug)
    .split('-')
    .map(w => ACRONYMS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// The title is the only variable-length element, so it drives the type scale:
// the longer it is, the smaller it gets, so real titles never need cutting.
// Beyond ~160 characters the clamp below ellipsizes rather than let the text
// crowd the eyebrow and the footer.
function titleSize(title) {
  const n = title.length
  if (n <= 22) return 84
  if (n <= 34) return 72
  if (n <= 52) return 60
  if (n <= 80) return 50
  if (n <= 120) return 42
  return 36
}

export async function GET(request, ctx) {
  const params = await ctx.params
  // The route is served as `<path>.png` so crawlers that sniff the extension
  // (and humans sharing the link) see an image; strip it before resolving the
  // MDX page.
  const raw = (params.mdxPath ?? []).map((s, i, arr) =>
    i === arr.length - 1 ? s.replace(/\.png$/, '') : s
  )
  const segments = raw.length === 1 && raw[0] === 'index' ? [] : raw

  let title = 'Faable Docs'
  try {
    const { metadata } = await importPage(segments)
    if (metadata?.title) title = metadata.title
    else if (segments.length) title = prettify(segments[segments.length - 1])
  } catch {
    // Unknown path (only reachable off the prerendered set): fall back to the
    // generic card instead of failing the request.
  }

  const eyebrow = [
    SECTIONS[segments[0]] ?? 'Faable Docs',
    segments.length > 2 ? prettify(segments[1]) : null
  ]
    .filter(Boolean)
    .join(' · ')

  const [bold, regular, emblem] = await Promise.all([
    readFile(join(process.cwd(), 'app/_og/DMSans-Bold.ttf')),
    readFile(join(process.cwd(), 'app/_og/DMSans-Regular.ttf')),
    readFile(join(process.cwd(), 'app/_og/emblem.png'))
  ])
  const emblemSrc = `data:image/png;base64,${emblem.toString('base64')}`

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: BG,
        fontFamily: 'DM Sans',
        position: 'relative'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 0 72px 80px',
          width: 800
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#818cf8'
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -1,
            color: '#ffffff',
            // Hard ceiling on the title block: 4 lines, then an ellipsis.
            // Satori reads `lineClamp` on a block element.
            display: 'block',
            lineClamp: '4'
          }}
        >
          {title}
        </div>

        <div style={{ fontSize: 26, fontWeight: 400, color: '#64748b' }}>
          faable.com/docs
        </div>
      </div>

      {/* Satori draws this into the PNG — next/image and alt text do not
          apply inside an ImageResponse. */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={emblemSrc}
        width={220}
        height={220}
        style={{ position: 'absolute', right: 90, top: 205 }}
      />

      {/* Brand gradient rule, the one nod the static card does not have */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: OG_SIZE.width,
          height: 8,
          background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`
        }}
      />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'DM Sans', data: bold, weight: 700, style: 'normal' },
        { name: 'DM Sans', data: regular, weight: 400, style: 'normal' }
      ]
    }
  )
}
