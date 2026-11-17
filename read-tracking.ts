import type { PostHog } from 'posthog-js'

// Which sections of a docs page a reader actually had on screen, and for how
// long. PostHog's own $pageleave only fires when the page unloads, so a reader
// who leaves the tab open, closes the whole browser or locks the phone never
// sends it — and a scroll percentage on a 400-line guide doesn't say which
// step they read anyway. This sends `docs_page_read` whenever the tab is hidden
// or the route changes. A page view can send it more than once (the reader goes
// away and comes back): each send carries only what happened since the previous
// one, numbered by `read_part`, so a read's totals are the SUM over its
// `read_id` and no row repeats time another row already counted. Sections are
// counted per part (5 s on screen within that part). Rows without `read_part`
// (16-11-2026 18:16 to the deploy of this change) were cumulative instead.

export const READ_EVENT = 'docs_page_read'

const TICK_MS = 1000
// A tick longer than this means the timer was throttled or the machine slept;
// don't count the gap as reading.
const MAX_TICK_MS = 2500
// No scroll, key, pointer or touch for this long and the reader is away.
const IDLE_MS = 60_000
// A section counts as read from this much time on screen.
const MIN_SECTION_MS = 5000
// The section being read is the last heading above this line of the viewport.
const READING_LINE = 0.3
const INTRO = { id: '', title: '(intro)' }

type Section = { id: string; title: string; ms: number; order: number }

type PageRead = {
  readId: string
  path: string
  part: number
  visibleMs: number
  maxScrollPct: number
  sections: Map<string, Section>
  lastOrder: number
}

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const newPage = (readId = randomId(), part = 1): PageRead => ({
  readId,
  path: window.location.pathname,
  part,
  visibleMs: 0,
  maxScrollPct: 0,
  sections: new Map(),
  lastOrder: -1
})

const headings = () =>
  Array.from(document.querySelectorAll<HTMLElement>('main h2[id], main h3[id]'))

// Heading text without the trailing anchor-link glyph Nextra adds.
const headingTitle = (h: HTMLElement) =>
  (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)

function currentSection(): { id: string; title: string; order: number } {
  const line = window.innerHeight * READING_LINE
  const list = headings()
  let found = { ...INTRO, order: 0 }
  list.forEach((h, i) => {
    if (h.getBoundingClientRect().top <= line) {
      found = { id: h.id, title: headingTitle(h), order: i + 1 }
    }
  })
  return found
}

function scrollPct(): number {
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100
  return Math.min(100, Math.round((window.scrollY / scrollable) * 100))
}

export function startReadTracking(posthog: PostHog) {
  if (typeof window === 'undefined') return

  let page = newPage()
  let lastTick = Date.now()
  let lastActivity = Date.now()

  const markActive = () => {
    lastActivity = Date.now()
  }
  for (const ev of [
    'scroll',
    'keydown',
    'pointerdown',
    'pointermove',
    'touchstart',
    'wheel'
  ]) {
    window.addEventListener(ev, markActive, { passive: true })
  }

  const flush = (reason: string) => {
    if (page.visibleMs < 1000) return
    const sections = Array.from(page.sections.values())
      .filter(s => s.ms >= MIN_SECTION_MS)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        id: s.id,
        title: s.title,
        seconds: Math.round(s.ms / 1000)
      }))
    const last = Array.from(page.sections.values()).find(
      s => s.order === page.lastOrder
    )
    const properties = {
      read_id: page.readId,
      read_part: page.part,
      page_path: page.path,
      visible_seconds: Math.round(page.visibleMs / 1000),
      max_scroll_pct: page.maxScrollPct,
      last_section: last?.title ?? null,
      last_section_id: last?.id ?? null,
      sections_read: sections,
      sections_read_count: sections.length,
      sections_total: headings().length,
      flush_reason: reason
    }
    posthog.capture(READ_EVENT, properties, {
      transport: 'sendBeacon',
      send_instantly: true
    })
    // What was just sent is counted: the next send starts from zero, under the
    // same read_id. (A pagehide right after hidden then has nothing to send.)
    page = newPage(page.readId, page.part + 1)
  }

  const tick = () => {
    const now = Date.now()
    const elapsed = now - lastTick
    lastTick = now

    // Client-side navigation: close the previous page, start the new one.
    if (window.location.pathname !== page.path) {
      flush('navigate')
      page = newPage()
      return
    }

    if (document.visibilityState !== 'visible') return
    if (elapsed > MAX_TICK_MS) return
    if (now - lastActivity > IDLE_MS) return

    page.visibleMs += elapsed
    page.maxScrollPct = Math.max(page.maxScrollPct, scrollPct())

    const cur = currentSection()
    const s = page.sections.get(cur.id) ?? { ...cur, ms: 0 }
    s.ms += elapsed
    s.title = cur.title
    page.sections.set(cur.id, s)
    page.lastOrder = Math.max(page.lastOrder, cur.order)
  }

  window.setInterval(tick, TICK_MS)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      tick()
      flush('hidden')
    } else {
      // Coming back: don't count the time away as one long tick.
      lastTick = Date.now()
      markActive()
    }
  })
  window.addEventListener('pagehide', () => flush('pagehide'))
}
