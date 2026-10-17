'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRODUCT_NAMES, productFor } from '../app/_lib/products'

// Each product has its own corner of the docs: /deploy/* and /auth/* show only
// that product in the sidebar (content/_meta.ts makes them `type: 'page'`), and
// carry its name, icon and colour. Everything else (/, /cli, /platform, /faq)
// is the platform and keeps the Faable brand.
//
// Colours and icons follow the landing (landing/components/base/ProductsMenu.tsx):
// Deploy is indigo with a rocket, Auth is emerald with a shield. The colours
// are Tailwind's -600 (light) and -400 (dark), as HSL for Nextra's
// --nextra-primary-* variables.
//
// Rendered on the server too: usePathname() is known at prerender time, so the
// static HTML Fastly serves already has the right brand — no flash on load.

const ROCKET = (
  <>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </>
)

const SHIELD_CHECK = (
  <>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </>
)

const PRODUCTS = {
  deploy: {
    name: PRODUCT_NAMES.deploy,
    icon: ROCKET,
    tile: 'linear-gradient(135deg, #6366f1, #4338ca)',
    light: { hue: 243, saturation: 75, lightness: 59 },
    dark: { hue: 234, saturation: 89, lightness: 74 }
  },
  auth: {
    name: PRODUCT_NAMES.auth,
    icon: SHIELD_CHECK,
    tile: 'linear-gradient(135deg, #10b981, #047857)',
    light: { hue: 161, saturation: 94, lightness: 30 },
    dark: { hue: 158, saturation: 64, lightness: 52 }
  }
}

function ProductIcon({ product }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm sm:h-9 sm:w-9"
      style={{ background: PRODUCTS[product].tile }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {PRODUCTS[product].icon}
      </svg>
    </span>
  )
}

export function NavbarLogo() {
  const product = productFor(usePathname())

  if (!product) {
    return (
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
    )
  }

  const { name } = PRODUCTS[product]
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <ProductIcon product={product} />
      <p className="font-bold text-lg sm:text-2xl whitespace-nowrap">
        {/* Narrow screens: the navbar also carries the product tabs and the
            CTA, so the name drops the "Faable" prefix there. */}
        <span className="hidden sm:inline">Faable </span>
        {name.replace(/^Faable /, '')}
      </p>
    </div>
  )
}

function vars({ hue, saturation, lightness }) {
  return `--nextra-primary-hue:${hue}deg;--nextra-primary-saturation:${saturation}%;--nextra-primary-lightness:${lightness}%;`
}

// Overrides the primary colour that <Head> from nextra/components sets on
// :root and .dark, and sets --faable-cta for the navbar's "Start free" button:
// the -600 tone in both modes, since the dark-mode -400 is too light under
// white text. `html:root` / `html.dark` outrank those selectors whatever
// the order the two <style> tags end up in.
export function ProductTheme() {
  const product = productFor(usePathname())
  if (!product) return null
  const { light, dark } = PRODUCTS[product]
  return (
    <style
      // Static values from the table above, never user input.
      dangerouslySetInnerHTML={{
        __html: `html:root{${vars(light)}--faable-cta:hsl(${light.hue} ${light.saturation}% ${light.lightness}%);}html.dark{${vars(dark)}}`
      }}
    />
  )
}

const CARDS = [
  {
    product: 'deploy',
    href: '/deploy/get-started',
    tagline:
      'Zero-config hosting from Git. Push code and Faable builds, scales and serves it.',
    bullets: [
      'Node.js, Python and Dockerfile apps, built from your repository',
      'Custom domains with free SSL, HTTP/3 and a built-in WAF',
      'Logs, secrets, releases and a CLI and MCP for agents'
    ],
    accent: 'text-indigo-600 dark:text-indigo-400',
    border: 'hover:border-indigo-400 dark:hover:border-indigo-500'
  },
  {
    product: 'auth',
    href: '/auth/get-started',
    tagline:
      'Multi-tenant identity, hosted in the EU. Users, sessions and tokens, with the login screen hosted for you.',
    bullets: [
      'OAuth 2.0 and OpenID Connect, machine-to-machine included',
      'Social login, passwordless, two-step verification and SSO',
      'Quickstarts for Next.js, React, React Native and more'
    ],
    accent: 'text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-400 dark:hover:border-emerald-500'
  }
]

// The product picker on the docs home (content/index.mdx).
export function ProductCards() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {CARDS.map(({ product, href, tagline, bullets, accent, border }) => (
        <Link
          key={product}
          href={href}
          className={`group flex flex-col gap-3 rounded-xl border border-gray-200 p-6 no-underline! transition-colors dark:border-neutral-800 ${border}`}
        >
          <div className="flex items-center gap-3">
            <ProductIcon product={product} />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {PRODUCTS[product].name}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{tagline}</p>
          <ul className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
            {bullets.map(b => (
              <li key={b} className="flex gap-2">
                <span className={accent}>✓</span>
                {b}
              </li>
            ))}
          </ul>
          <span className={`mt-auto pt-2 font-semibold ${accent}`}>
            Read the {PRODUCTS[product].name} docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}
