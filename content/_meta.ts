// Every top-level entry is a `type: 'page'`, with its own sidebar. That is what
// splits the docs per product — inside /deploy or /auth the sidebar shows only
// that product. A plain `doc` entry here would show up in every product's
// sidebar too (Nextra treats the root as under every docs tree), so the
// platform pages are pages as well.
//
// The navbar only switches product. The home (/) is reached from the logo and
// the platform pages (CLI, policies, FAQ) from the footer
// (app/(site)/layout.jsx), so they are hidden here — Platform through CSS.
export default {
  // No "Last updated" from Nextra: the page renders its own (app/(site)/
  // [[...mdxPath]]/page.jsx), from the same dates as the structured data, and
  // the two disagreed. `*` is the fallback every entry and its children inherit.
  '*': { theme: { timestamp: false } },
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
  // Not `display: 'hidden'`: Nextra drops the sidebar of a hidden folder, and
  // the policies keep theirs. Its navbar tab is hidden in globals.css instead.
  platform: { type: 'page', title: 'Platform & Policies' },
  faq: {
    type: 'page',
    title: 'FAQ',
    display: 'hidden',
    theme: { sidebar: false }
  }
}
