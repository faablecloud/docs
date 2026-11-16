'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { hasSessionHint } from '@faable/auth-js/session-hint'
import posthog from 'posthog-js'

const REGISTER_URL =
  'https://dashboard.faable.com/account/register?utm_source=docs&utm_medium=referral&utm_content=docs_navbar_cta'
const DASHBOARD_URL =
  'https://dashboard.faable.com?utm_source=docs&utm_medium=referral&utm_content=docs_navbar_avatar'

// Whether the reader is signed in to the dashboard — same as the landing's
// lib/dashboardSession.ts, keep them in step. The answer is auth-js's session
// hint: the dashboard client writes `faableauth-<clientId>-session-hint=1` on
// .faable.com while it holds a session and removes it when it loses it, a
// plain cookie that works in every browser. The framed
// dashboard/public/session-hint.html stays only for the avatar: Safari gives
// it an empty, partitioned storage, so it cannot decide who is signed in.
const DASHBOARD_CLIENT_ID = '7cb62eab-d817-44f9-a5a7-93aafe82b082'
const HINT_URL =
  process.env.NEXT_PUBLIC_SESSION_HINT_URL ??
  'https://dashboard.faable.com/session-hint.html'
const HINT_ORIGIN = new URL(HINT_URL).origin
const TIMEOUT_MS = 3000

// One question per full page load: the navbar remounts on client navigation.
let avatar = null

const askAvatar = () =>
  askDashboard().then(({ session, answer }) => {
    posthog.capture('dashboard_session_hint', { surface: 'docs', answer })
    return session
  })

const askDashboard = () =>
  new Promise(resolve => {
    const iframe = document.createElement('iframe')
    iframe.src = HINT_URL
    iframe.hidden = true
    iframe.setAttribute('aria-hidden', 'true')
    iframe.tabIndex = -1

    const done = (session, answer) => {
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      iframe.remove()
      resolve({ session, answer })
    }
    const onMessage = event => {
      if (event.origin !== HINT_ORIGIN || event.source !== iframe.contentWindow)
        return
      if (event.data?.type !== 'faable:session-hint') return
      const { signedIn, name, picture } = event.data
      done(
        signedIn ? { name: name ?? null, picture: picture ?? null } : null,
        signedIn ? 'signed_in' : 'signed_out'
      )
    }
    const timer = setTimeout(() => done(null, 'timeout'), TIMEOUT_MS)

    window.addEventListener('message', onMessage)
    iframe.onload = () =>
      iframe.contentWindow?.postMessage(
        { type: 'faable:session-hint?' },
        HINT_ORIGIN
      )
    document.body.appendChild(iframe)
  })

// The cookie is read on the client only: the server snapshot is `false`, so
// the navbar hydrates as "Start free" and switches once mounted.
const noSubscribe = () => () => {}
const readHint = () => hasSessionHint({ clientId: DASHBOARD_CLIENT_ID })

function useDashboardSession() {
  const hinted = useSyncExternalStore(noSubscribe, readHint, () => false)
  const [known, setKnown] = useState(null)
  useEffect(() => {
    if (!hinted) return
    avatar ??= askAvatar()
    let alive = true
    avatar.then(value => alive && value && setKnown(value))
    return () => {
      alive = false
    }
  }, [hinted])
  return hinted ? (known ?? { name: null, picture: null }) : null
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
      ) : session.name ? (
        <span style={avatarStyle}>{session.name.trim()[0]?.toUpperCase()}</span>
      ) : null}
      Dashboard
    </a>
  )
}
