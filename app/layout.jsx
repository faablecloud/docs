import "../globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata = {
  metadataBase: new URL("https://faable.com"),
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
  // llms.txt discovery for AI crawlers (llmstxt.org) — emits
  // <link rel="alternate" type="text/plain" title="llms.txt" href=...>
  alternates: {
    types: {
      "text/plain": [
        { url: "https://faable.com/docs/llms.txt", title: "llms.txt" },
        {
          url: "https://faable.com/docs/llms-full.txt",
          title: "llms-full.txt",
        },
      ],
    },
  },
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

// Root layout is intentionally minimal: <html>/<body> + global styles and
// analytics only. The Nextra docs theme chrome lives in app/(site)/layout.jsx
// so non-docs pages (e.g. /badge/[id] credential pages) render clean.
export default function RootLayout({ children }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <body>
        {children}
        <GoogleAnalytics gaId="G-S8X2QYX44Z" />
      </body>
    </html>
  );
}
