import nextra from 'nextra'

// Set up Nextra with its configuration
const withNextra = nextra({
  // ... Add Nextra-specific options here
})

// Export the final Next.js config with Nextra included
export default withNextra({
  // ... Add regular Next.js options here
  basePath: '/docs',
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
      {
        source: '/auth/quickstart',
        destination: '/auth/quickstart/react',
        permanent: false
      },
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
