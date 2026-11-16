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
      // Consent Mode default before GTM loads. The Faable Cookies installer in
      // the container pushes the same default, but as a Custom HTML tag it runs
      // after the Initialization tags: Google Ads wrote _gcl_au and pinged
      // doubleclick with no consent state, even after "Reject optionals".
      // Same values as the landing's _document and cookies-overlay's
      // CONSENT_DEFAULTS (src/lib/consentDefaults.ts).
      window.dataLayer = window.dataLayer || []
      ;(function () {
        // gtag's consent commands only count when the real `arguments` object
        // is pushed, not an array.
        window.dataLayer.push(arguments)
      })('consent', 'default', {
        ad_storage: 'denied',
        personalization_storage: 'denied',
        analytics_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        functionality_storage: 'granted',
        security_storage: 'granted'
      })
      // Intentional client-only gate: the production host is only knowable in
      // the browser, so we flip state after mount (server render must stay null
      // to match hydration). This is the correct pattern here, not a cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(true)
    }
  }, [])

  return enabled ? <GoogleTagManager gtmId={gtmId} /> : null
}
