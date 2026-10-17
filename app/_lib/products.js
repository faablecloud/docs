// The two products that have their own corner of the docs (/deploy, /auth).
// Shared by the server (page titles, social cards) and the client brand
// (components/ProductBrand.jsx), so it holds plain data only.
export const PRODUCT_NAMES = {
  deploy: 'Faable Deploy',
  auth: 'Faable Auth'
}

// Product of a docs path or mdxPath segment list, or null for the platform
// pages (/, /cli, /platform, /faq). Paths come without the /docs basePath.
export function productFor(path) {
  const first = Array.isArray(path) ? path[0] : (path ?? '').split('/')[1]
  return Object.hasOwn(PRODUCT_NAMES, first ?? '') ? first : null
}
