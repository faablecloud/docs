// IndexNow ping on deploy — no CI involved: push-to-deploy is server-side, so
// "deploy finished" is this server booting. register() runs once per boot,
// waits out the promote grace period, reads its own (new) sitemap via
// localhost, and submits recently-modified URLs to IndexNow (Bing/Seznam/
// Yandex — Google ignores the protocol; sitemaps cover it).
//
// Cold-state wakes re-run this, but the lastmod filter means a wake without
// recent content changes submits nothing, and repeated submissions of the
// same URL are deduped server-side by IndexNow anyway.

// Public by design: the landing serves this same value at
// https://faable.com/<key>.txt — one key covers the whole host, /docs included.
const INDEXNOW_KEY = '869d36ec4fa49bbead7829ef30b96184'
const HOST = 'faable.com'
const SITEMAP_PATH = '/docs/sitemap.xml'
// Only URLs whose <lastmod> falls in this window get submitted.
const RECENT_WINDOW_MS = 48 * 60 * 60 * 1000
// The pod boots before traffic is promoted to it; give the promote time to
// land so IndexNow's crawl can't hit the previous version for a new URL.
const PROMOTE_GRACE_MS = 5 * 60 * 1000

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const dryRun = process.env.INDEXNOW_DRY_RUN === '1'
  if (process.env.NODE_ENV !== 'production' && !dryRun) return

  const timer = setTimeout(
    () => {
      pingIndexNow(dryRun).catch(err =>
        console.error('[indexnow] ping failed:', err)
      )
    },
    dryRun ? 3000 : PROMOTE_GRACE_MS
  )
  // Never keep the process alive just for the ping.
  timer.unref?.()
}

async function pingIndexNow(dryRun: boolean) {
  const port = process.env.PORT ?? '3000'
  const res = await fetch(`http://127.0.0.1:${port}${SITEMAP_PATH}`)
  if (!res.ok) throw new Error(`own sitemap fetch: HTTP ${res.status}`)
  const xml = await res.text()

  const cutoff = Date.now() - RECENT_WINDOW_MS
  const urlList: string[] = []
  for (const [, entry] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]
    const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]
    if (!loc) continue
    // No lastmod → can't tell if it changed; skip rather than spam.
    if (!lastmod || Date.parse(lastmod) < cutoff) continue
    urlList.push(loc)
  }

  if (urlList.length === 0) {
    console.log('[indexnow] no recently modified URLs, skipping ping')
    return
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList
  }

  if (dryRun) {
    console.log('[indexnow] DRY RUN, would submit:', JSON.stringify(payload))
    return
  }

  const submit = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  })
  console.log(
    `[indexnow] submitted ${urlList.length} URLs → HTTP ${submit.status}`
  )
}
