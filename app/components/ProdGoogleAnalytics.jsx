'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'

// Loads Google Analytics only on the production host, so localhost and the
// *.faable.link preview/origin deploys don't pollute production analytics.
export function ProdGoogleAnalytics({ gaId }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const host = window.location.hostname
    if (host === 'faable.com' || host === 'www.faable.com') {
      // Intentional client-only gate: the production host is only knowable in
      // the browser, so we flip state after mount (server render must stay null
      // to match hydration). This is the correct pattern here, not a cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(true)
    }
  }, [])

  return enabled ? <GoogleAnalytics gaId={gaId} /> : null
}
