'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

const REGISTER_URL =
  'https://dashboard.faable.com/account/register?utm_source=docs&utm_medium=referral&utm_content=docs_navbar_cta'
const DASHBOARD_URL =
  'https://dashboard.faable.com?utm_source=docs&utm_medium=referral&utm_content=docs_navbar_avatar'

// Whether the reader is signed in to the dashboard. Same mechanism as the
// landing's lib/dashboardSession.ts (keep them in step): the session lives in
// dashboard.faable.com's localStorage, and dashboard/public/session-hint.html
// answers a postMessage handshake from faable.com only. The iframe loads only
// when the dashboard's `last-used` login cookie is on .faable.com; that cookie
// survives sign-out, so it gates the check, it doesn't answer it.
const HINT_URL =
  process.env.NEXT_PUBLIC_SESSION_HINT_URL ??
  'https://dashboard.faable.com/session-hint.html'
const HINT_ORIGIN = new URL(HINT_URL).origin
const LAST_USED_COOKIE = /(?:^|;\s*)faableauth-[0-9a-f-]{36}-last-used=/
const TIMEOUT_MS = 3000

// One question per full page load: the navbar remounts on client navigation.
let answer = null

const askDashboard = () =>
  new Promise(resolve => {
    const iframe = document.createElement('iframe')
    iframe.src = HINT_URL
    iframe.hidden = true
    iframe.setAttribute('aria-hidden', 'true')
    iframe.tabIndex = -1

    const done = value => {
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      iframe.remove()
      resolve(value)
    }
    const onMessage = event => {
      if (event.origin !== HINT_ORIGIN || event.source !== iframe.contentWindow)
        return
      if (event.data?.type !== 'faable:session-hint') return
      const { signedIn, name, picture } = event.data
      done(signedIn ? { name: name ?? null, picture: picture ?? null } : null)
    }
    const timer = setTimeout(() => done(null), TIMEOUT_MS)

    window.addEventListener('message', onMessage)
    iframe.onload = () =>
      iframe.contentWindow?.postMessage(
        { type: 'faable:session-hint?' },
        HINT_ORIGIN
      )
    document.body.appendChild(iframe)
  })

function useDashboardSession() {
  const [session, setSession] = useState(null)
  useEffect(() => {
    if (!LAST_USED_COOKIE.test(document.cookie)) return
    answer ??= askDashboard()
    let alive = true
    answer.then(value => alive && setSession(value))
    return () => {
      alive = false
    }
  }, [])
  return session
}

const ctaStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--faable-cta, #2563eb)',
  color: '#fff',
  padding: '6px 14px',
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: 'nowrap'
}

const avatarStyle = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  objectFit: 'cover',
  background: 'rgba(255,255,255,0.3)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12
}

/**
 * Navbar conversion CTA. "Start free" for everyone; once the dashboard says
 * the reader is signed in, "Dashboard" with their avatar instead. Inline-styled
 * so it renders regardless of Tailwind availability; its colour follows the
 * product (--faable-cta, set by ProductTheme).
 */
export function NavbarCta() {
  const session = useDashboardSession()
  if (!session)
    return (
      <a href={REGISTER_URL} target="_blank" rel="noopener" style={ctaStyle}>
        Start free
      </a>
    )
  return (
    <a
      href={DASHBOARD_URL}
      target="_blank"
      rel="noopener"
      style={ctaStyle}
      onClick={() => posthog.capture('docs_navbar_dashboard_avatar_clicked')}
    >
      {session.picture ? (
        <img
          src={session.picture}
          alt=""
          width={20}
          height={20}
          referrerPolicy="no-referrer"
          style={avatarStyle}
        />
      ) : (
        <span style={avatarStyle}>
          {session.name?.trim()[0]?.toUpperCase() ?? '?'}
        </span>
      )}
      Dashboard
    </a>
  )
}
