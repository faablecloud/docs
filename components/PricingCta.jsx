'use client'

import posthog from 'posthog-js'

const SIGNUP_URL = 'https://dashboard.faable.com'

/**
 * Call to action for the pricing pages.
 *
 * Two problems at once. The pricing pages were a dead end — 74 people read a
 * price in 90 days with nowhere to click — and a `$pageview` alone can't tell
 * someone who bounced from someone who decided. This is both the way out and
 * the only intent signal these pages produce.
 *
 * `product` is the pricing page it sits on (deploy / auth / platform), so the
 * signal is attributable to a page rather than to "the docs".
 */
export function PricingCta({ product, href = SIGNUP_URL, children }) {
  return (
    <a
      href={href}
      // Same shape as the landing's CTA captures: event + where it happened.
      // On non-production hosts posthog is never initialised and this no-ops.
      onClick={() =>
        posthog.capture('docs_pricing_cta_clicked', { product, href })
      }
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white no-underline transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:ring-offset-neutral-900"
    >
      {children}
      <span aria-hidden="true">→</span>
    </a>
  )
}
