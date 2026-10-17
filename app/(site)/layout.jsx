import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import 'nextra-theme-docs/style.css'
import Link from 'next/link'
import { getPageMap } from 'nextra/page-map'
import { NavbarLogo, ProductTheme } from '../../components/ProductBrand'

const navbar = (
  <Navbar
    // Product name and icon on /deploy and /auth, "Faable Docs" elsewhere.
    logo={<NavbarLogo />}
  >
    {/* Persistent conversion CTA — docs are the paid/organic landing for many
        readers. Inline-styled so it renders regardless of Tailwind availability.
        Its colour follows the product (--faable-cta, set by ProductTheme). */}
    <a
      href="https://dashboard.faable.com/account/register?utm_source=docs&utm_medium=referral&utm_content=docs_navbar_cta"
      target="_blank"
      rel="noopener"
      style={{
        background: 'var(--faable-cta, #2563eb)',
        color: '#fff',
        padding: '6px 14px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 14,
        whiteSpace: 'nowrap'
      }}
    >
      Start free
    </a>
  </Navbar>
)
// The platform-wide pages live here and not in the navbar, which only switches
// product (content/_meta.ts hides them there). Next's <Link> adds the /docs
// basePath.
const PLATFORM_LINKS = [
  ['/cli', 'CLI'],
  ['/platform/pricing', 'Pricing'],
  ['/platform/security-compliance', 'Security'],
  ['/platform/compliance', 'Compliance'],
  ['/platform/sla', 'SLA'],
  ['/faq', 'FAQ'],
  ['/platform/terms-of-service', 'Terms of Service'],
  ['/platform/privacy-policy', 'Privacy Policy']
]

const footer = (
  <Footer className="flex-col items-start gap-4">
    <nav aria-label="Platform" className="flex flex-wrap gap-x-6 gap-y-2">
      {PLATFORM_LINKS.map(([href, label]) => (
        <Link key={href} href={href} className="hover:opacity-75">
          {label}
        </Link>
      ))}
    </nav>
    <span>
      {new Date().getFullYear()} ©{' '}
      <a
        href="https://faable.com?utm_source=docs&utm_medium=referral&utm_content=footer"
        rel="noopener"
        className="hover:nx-opacity-75"
      >
        Faable Cloud
      </a>
      .
    </span>
  </Footer>
)

// Documentation pages render inside the Nextra theme chrome (navbar, sidebar,
// footer). This lives in a (site) route group so standalone pages outside the
// group — e.g. /badge/[id] credential pages — get a clean layout instead.
export default async function SiteLayout({ children }) {
  return (
    <>
      <ProductTheme />
      <Layout
        navbar={navbar}
        pageMap={await getPageMap()}
        docsRepositoryBase="https://github.com/faablecloud/docs"
        footer={footer}
      >
        {children}
      </Layout>
    </>
  )
}
