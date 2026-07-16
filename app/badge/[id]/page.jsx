import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import path from 'path'

// Achievement catalog. Phase 1 only ships the Integrator credential; new tracks
// add an entry here. `image` paths include the /docs basePath so they resolve in
// dev (localhost:3000/docs/...) and prod alike.
const ACHIEVEMENTS = {
  integrator: {
    name: 'Faable Auth Integrator',
    short: 'Integrator',
    description:
      'Demonstrated the ability to integrate applications with Faable Auth: OAuth 2.0 / OpenID Connect, tenant modelling, login flows, and the Management API.',
    badge: '/docs/badges/integrator.svg',
    badgePng: '/docs/badges/integrator.png',
    ogImage: '/docs/badges/integrator-og.png',
    criteriaUrl: 'https://faable.com/docs/auth/academy/exam',
    curriculumUrl: 'https://faable.com/docs/auth/academy'
  }
}

// LinkedIn Company Page binding. Prefer the numeric organizationId (shows the
// Faable logo on the cert entry); fall back to organizationName until the id is
// configured. See Ops in the plan — get it from the faablecloud page admin.
const LINKEDIN_ORG_ID = process.env.NEXT_PUBLIC_LINKEDIN_ORG_ID || '80306063'
const LINKEDIN_ORG_NAME = 'Faable'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

// Credential ids are used to read a file from disk — restrict to a safe charset
// to avoid path traversal.
const SAFE_ID = /^[A-Za-z0-9._-]+$/

async function loadCredential(id) {
  if (!id || !SAFE_ID.test(id)) return null
  try {
    const file = path.join(process.cwd(), 'public', 'certs', `${id}.json`)
    const cred = JSON.parse(await readFile(file, 'utf8'))
    const achievement = ACHIEVEMENTS[cred.achievement]
    if (!achievement) return null
    return { cred, achievement }
  } catch {
    return null
  }
}

function formatIssued(issued) {
  // "2026-06" -> { label: "June 2026", year: "2026", month: "6" }
  const [year, month] = String(issued || '').split('-')
  const idx = parseInt(month, 10) - 1
  return {
    label: MONTHS[idx] ? `${MONTHS[idx]} ${year}` : year || '',
    year: year || '',
    month: String(parseInt(month, 10) || '')
  }
}

function linkedInAddUrl(cred, achievement) {
  const issued = formatIssued(cred.issued)
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: achievement.name,
    issueYear: issued.year,
    issueMonth: issued.month,
    certUrl: cred.credential_url,
    certId: cred.id
  })
  if (LINKEDIN_ORG_ID) params.set('organizationId', LINKEDIN_ORG_ID)
  else params.set('organizationName', LINKEDIN_ORG_NAME)
  return `https://www.linkedin.com/profile/add?${params.toString()}`
}

export async function generateMetadata(props) {
  const { id } = await props.params
  const data = await loadCredential(id)
  if (!data) return { title: 'Credential not found | Faable' }
  const { cred, achievement } = data
  const title = `${achievement.name} — ${cred.recipient_name}`
  const description = `${cred.recipient_name} earned the ${achievement.name} credential, issued by Faable.`
  return {
    title,
    description,
    alternates: { canonical: cred.credential_url },
    openGraph: {
      title,
      description,
      url: cred.credential_url,
      type: 'article',
      images: [
        {
          url: achievement.ogImage,
          width: 1200,
          height: 630,
          alt: achievement.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [achievement.ogImage]
    }
  }
}

export default async function BadgePage(props) {
  const { id } = await props.params
  const data = await loadCredential(id)
  if (!data) notFound()
  const { cred, achievement } = data
  const issued = formatIssued(cred.issued)
  const addUrl = linkedInAddUrl(cred, achievement)
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    cred.credential_url
  )}`

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B1020 0%, #1E1B4B 100%)',
        color: '#E2E8F0',
        fontFamily:
          "'Segoe UI', Roboto, Helvetica, Arial, system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 24,
          padding: '40px',
          boxShadow: '0 24px 60px rgba(2,6,23,0.5)',
          textAlign: 'center'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={achievement.badge}
          alt={`${achievement.name} badge`}
          width={220}
          height={220}
          style={{ width: 220, height: 220 }}
        />

        <p
          style={{
            margin: '8px 0 0',
            letterSpacing: 3,
            fontSize: 14,
            fontWeight: 600,
            color: '#A5B4FC',
            textTransform: 'uppercase'
          }}
        >
          Faable Auth Academy
        </p>
        <h1
          style={{
            margin: '6px 0 4px',
            fontSize: 40,
            fontWeight: 800,
            color: '#fff'
          }}
        >
          {achievement.name}
        </h1>

        <p style={{ margin: '0 0 4px', fontSize: 20, color: '#CBD5E1' }}>
          Awarded to{' '}
          <strong style={{ color: '#fff' }}>{cred.recipient_name}</strong>
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#94A3B8' }}>
          <span aria-hidden="true" style={{ color: '#22C55E', marginRight: 6 }}>
            ✓
          </span>
          Issued by Faable · {issued.label}
        </p>

        <p
          style={{
            margin: '0 auto 28px',
            maxWidth: 540,
            fontSize: 15,
            lineHeight: 1.6,
            color: '#CBD5E1'
          }}
        >
          {achievement.description}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center'
          }}
        >
          <a
            href={addUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={btnPrimary}
          >
            Add to LinkedIn profile
          </a>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={btnSecondary}
          >
            Share
          </a>
          <a href={achievement.badgePng} download style={btnSecondary}>
            Download badge
          </a>
        </div>

        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid rgba(148,163,184,0.18)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#94A3B8'
          }}
        >
          <span>
            Credential ID: <code style={{ color: '#CBD5E1' }}>{cred.id}</code>
          </span>
          <a
            href={achievement.criteriaUrl}
            style={{ color: '#818CF8', textDecoration: 'none' }}
          >
            How this credential is earned →
          </a>
        </div>
      </div>

      <a
        href={achievement.curriculumUrl}
        style={{
          marginTop: 24,
          fontSize: 13,
          color: '#818CF8',
          textDecoration: 'none'
        }}
      >
        Learn more about the Faable Auth Academy
      </a>
    </main>
  )
}

const btnBase = {
  display: 'inline-block',
  padding: '12px 22px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer'
}
const btnPrimary = {
  ...btnBase,
  background: '#0A66C2',
  color: '#fff'
}
const btnSecondary = {
  ...btnBase,
  background: 'rgba(255,255,255,0.08)',
  color: '#E2E8F0',
  border: '1px solid rgba(148,163,184,0.25)'
}
