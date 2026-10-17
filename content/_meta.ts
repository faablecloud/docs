// Every top-level entry is a `type: 'page'`, with its own sidebar. That is what
// splits the docs per product — inside /deploy or /auth the sidebar shows only
// that product. A plain `doc` entry here would show up in every product's
// sidebar too (Nextra treats the root as under every docs tree), so the
// platform pages are pages as well.
//
// The navbar only switches product. The home (/) is reached from the logo and
// the platform pages (CLI, policies, FAQ) from the footer
// (app/(site)/layout.jsx), so they are hidden here.
export default {
  index: {
    type: 'page',
    title: 'Overview',
    display: 'hidden',
    theme: { sidebar: false }
  },
  deploy: { type: 'page', title: 'Faable Deploy' },
  auth: { type: 'page', title: 'Faable Auth' },
  cli: {
    type: 'page',
    title: 'CLI',
    display: 'hidden',
    theme: { sidebar: false }
  },
  platform: {
    type: 'page',
    title: 'Platform & Policies',
    display: 'hidden',
    theme: { sidebar: false }
  },
  faq: {
    type: 'page',
    title: 'FAQ',
    display: 'hidden',
    theme: { sidebar: false }
  }
}
