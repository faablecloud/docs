import nextra from 'nextra'

// Set up Nextra with its configuration
const withNextra = nextra({
  // ... Add Nextra-specific options here
})

// Export the final Next.js config with Nextra included
export default withNextra({
  // ... Add regular Next.js options here
  basePath: '/docs',
  async headers() {
    // Fastly purges by Surrogate-Key (this app's id) on every deployment
    // promote, so a long s-maxage never serves a stale release. Browsers get
    // max-age=0 + ETag: they revalidate at the edge and pick up new deploys
    // immediately, since the purge only clears Fastly. Sources are relative to
    // basePath; /_next/static keeps Next's own immutable header.
    return [
      {
        source: '/:path((?!_next/|_pagefind/|badges/|certs/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800'
          }
        ]
      },
      {
        source: '/:path(_pagefind/.*|badges/.*|certs/.*)',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=3600, s-maxage=604800, stale-while-revalidate=604800'
          }
        ]
      }
    ]
  },
  async redirects() {
    // Paths with real inbound traffic (GA/Search Console) that 404 otherwise.
    // Sources/destinations are relative to basePath (/docs). TEMPORARY (302) on
    // purpose, same policy as the landing: 301/308 get cached hard by
    // browsers/CDNs, which would block serving a real page here later.
    return [
      // Section roots: folders without an index page
      { source: '/auth', destination: '/auth/get-started', permanent: false },
      {
        source: '/deploy',
        destination: '/deploy/get-started',
        permanent: false
      },
      {
        source: '/platform',
        destination: '/platform/pricing',
        permanent: false
      },
      {
        source: '/auth/guides',
        destination: '/auth/guides/migrate-from-auth0',
        permanent: false
      },
      // NOTE: /auth/quickstart is NOT here — it has a real index page now, and
      // a redirect would shadow it. This is why these are 302s.
      {
        source: '/auth/extensibility',
        destination: '/auth/extensibility/actions',
        permanent: false
      },
      {
        source: '/deploy/domains',
        destination: '/deploy/domains/custom-domain',
        permanent: false
      },
      {
        source: '/deploy/guides',
        destination: '/deploy/guides/migrate-from-vercel',
        permanent: false
      },
      // Old flat URLs for pages that live under /auth/oauth-flows (indexed/linked externally)
      {
        source: '/auth/authorization-code',
        destination: '/auth/oauth-flows/authorization-code',
        permanent: false
      },
      {
        source: '/auth/refresh-token',
        destination: '/auth/oauth-flows/refresh-token',
        permanent: false
      },
      {
        source: '/auth/client-credentials',
        destination: '/auth/oauth-flows/client-credentials',
        permanent: false
      },
      {
        source: '/auth/device-code',
        destination: '/auth/oauth-flows/device-code',
        permanent: false
      },
      {
        source: '/auth/token-exchange',
        destination: '/auth/oauth-flows/token-exchange',
        permanent: false
      },
      // Academy pages linked without the /academy prefix
      {
        source: '/auth/exam',
        destination: '/auth/academy/exam',
        permanent: false
      },
      {
        source: '/auth/lab',
        destination: '/auth/academy/lab',
        permanent: false
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*'
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*'
      }
    ]
  },
  skipTrailingSlashRedirect: true
})
