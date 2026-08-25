// Social card addressing, shared by the page metadata and the generator route
// (app/og/[[...mdxPath]]/route.jsx) so the URLs advertised to crawlers are
// exactly the ones prerendered at build time.

export const OG_SIZE = { width: 1200, height: 630 }

// Cards are addressed as `<page path>.png`; the root page gets `index.png`.
export function toOgSegments(mdxPath) {
  // The root page arrives as [''] from Nextra's static params and as undefined
  // at request time — both mean "no path".
  const segments = (mdxPath ?? []).filter(Boolean)
  if (!segments.length) return ['index.png']
  return [...segments.slice(0, -1), `${segments[segments.length - 1]}.png`]
}

// Absolute URL — Open Graph consumers do not resolve relative paths, and the
// docs live under the /docs basePath.
export function ogImageUrl(mdxPath) {
  return `https://faable.com/docs/og/${toOgSegments(mdxPath).join('/')}`
}
