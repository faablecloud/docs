'use client'

import { useEffect, useState } from 'react'
import { GoogleTagManager } from '@next/third-parties/google'

// Loads the same GTM container as the landing (cookie banner, GA4
// G-LF4NC4LKWN with Consent Mode, and the Google Ads tag) only on the
// production host, so localhost and the *.faable.link preview/origin
// deploys don't pollute production analytics.
export function ProdGoogleTagManager({ gtmId }) {
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

  return enabled ? <GoogleTagManager gtmId={gtmId} /> : null
}
