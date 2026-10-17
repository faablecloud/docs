// Every top-level entry is a `type: 'page'`: a tab in the navbar with its own
// sidebar. That is what splits the docs per product — inside /deploy or /auth
// the sidebar shows only that product. A plain `doc` entry here would show up
// in every product's sidebar too (Nextra treats the root as under every docs
// tree), so the platform pages are pages as well.
//
// The home (/) picks a product; the logo links to it, so it needs no tab.
// Single pages have nothing to put in a sidebar.
export default {
  index: {
    type: 'page',
    title: 'Overview',
    display: 'hidden',
    theme: { sidebar: false }
  },
  deploy: { type: 'page', title: 'Faable Deploy' },
  auth: { type: 'page', title: 'Faable Auth' },
  cli: { type: 'page', title: 'CLI', theme: { sidebar: false } },
  platform: { type: 'page', title: 'Platform & Policies' },
  faq: { type: 'page', title: 'FAQ', theme: { sidebar: false } }
}
