import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

const navbar = (
  <Navbar
    logo={
      <div className="flex items-center gap-2 sm:gap-4">
        <img
          src="https://faable.com/assets/logo/Emblem.png"
          width="35"
          height="35"
          alt="Faable"
          className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
        />
        <p className="font-bold text-lg sm:text-2xl">Faable Docs</p>
      </div>
    }
  >
    <a
      href="https://dashboard.faable.com?utm_source=docs&utm_medium=referral&utm_content=navbar"
      target="_blank"
      rel="noopener"
      className="nx-text-sm nx-font-medium hover:nx-opacity-75"
    >
      Dashboard
    </a>
    {/* Persistent conversion CTA — docs are the paid/organic landing for many
        readers but previously offered no signup action beyond the Dashboard
        link. Inline-styled so it renders regardless of Tailwind availability. */}
    <a
      href="https://dashboard.faable.com/account/register?utm_source=docs&utm_medium=referral&utm_content=docs_navbar_cta"
      target="_blank"
      rel="noopener"
      style={{
        background: "#2563eb",
        color: "#fff",
        padding: "6px 14px",
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      Start free
    </a>
  </Navbar>
);
const footer = (
  <Footer>
    <span>
      {new Date().getFullYear()} ©{" "}
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
);

// Documentation pages render inside the Nextra theme chrome (navbar, sidebar,
// footer). This lives in a (site) route group so standalone pages outside the
// group — e.g. /badge/[id] credential pages — get a clean layout instead.
export default async function SiteLayout({ children }) {
  return (
    <>
      <Head />
      <Layout
        navbar={navbar}
        pageMap={await getPageMap()}
        docsRepositoryBase="https://github.com/faablecloud/docs"
        footer={footer}
      >
        {children}
      </Layout>
    </>
  );
}
