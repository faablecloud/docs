import posthog from 'posthog-js'

// Only run analytics on the production host. This keeps localhost and the
// *.faable.link preview/origin deploys from polluting production analytics.
const host = typeof window !== 'undefined' ? window.location.hostname : ''
const isProductionHost = host === 'faable.com' || host === 'www.faable.com'

if (isProductionHost) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    // The app is mounted under basePath "/docs", so the ingest rewrite lives at
    // /docs/ingest — a bare "/ingest" resolves against the domain root, which is
    // served by the landing app and 404s.
    api_host: '/docs/ingest',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-01-30',
    capture_exceptions: false,
    debug: false
  })

  // The landing registers `app: "landing"` on the same PostHog project and the
  // same faable.com host, so without this docs traffic is indistinguishable
  // from it in any breakdown.
  posthog.register({
    app: 'docs'
  })
}
