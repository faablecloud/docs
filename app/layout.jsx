import "../globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export const metadata = {
  title: {
    template: "%s | Faable Docs",
    default: "Faable Docs | Cloud Platform for Modern Developers",
  },
  description:
    "Explore Faable documentation: Zero-config CI/CD with Faable Deploy and scalable identity management with Faable Auth.",
  keywords: [
    "Faable",
    "Faable Deploy",
    "Faable Auth",
    "Zero-config CI/CD",
    "Cloud Hosting",
    "OAuth 2.0",
    "OpenID Connect",
    "OIDC",
    "WAF",
    "Machine-to-Machine",
  ],
  icons: {
    icon: [
      {
        url: "https://faable.com/assets/logo/Emblem.png", // /public path
        href: "https://faable.com/assets/logo/Emblem.png", // /public path
      },
    ],
  },
  authors: [{ name: "Faable Team", url: "https://faable.com" }],
  openGraph: {
    title: "Faable Docs - Empowering Developers to Build and Scale",
    description:
      "Infrastructure for modern applications: Automated deployments, free SSL, and multi-tenant identity servers.",
    url: "https://faable.com/docs",
    siteName: "Faable Documentation",
    images: [
      {
        url: "https://faable.com/assets/brand/FaableLoginSocial.png",
        width: 1200,
        height: 630,
        alt: "Faable Platform: Deploy & Auth",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Faable Docs",
    description: "Zero-config CI/CD and Scalable Auth for modern web apps.",
    creator: "@faable",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>;
const navbar = (
  <Navbar
    logo={
      <div className="flex gap-4">
        <img src="https://faable.com/assets/logo/Emblem.png" width="35" />
        <p className="font-bold text-2xl">Faable Docs</p>
      </div>
    }
    // ... Your additional navbar options
  ></Navbar>
);
const footer = <Footer>{new Date().getFullYear()} © Faable Cloud.</Footer>;

export default async function RootLayout({ children }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head>
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          // banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/faablecloud/docs"
          footer={footer}
          // ... Your additional layout options
        >
          {children}
        </Layout>
        <GoogleAnalytics gaId="G-S8X2QYX44Z" />
      </body>
    </html>
  );
}
