import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content')

// Resolve the source file for a docs route (same candidate resolution as the
// sitemap and llms.txt collectors).
export function sourceFileFor(route) {
  const rel = route === '/' ? 'index' : route.replace(/^\//, '')
  const candidates = [
    `${rel}.md`,
    `${rel}.mdx`,
    path.join(rel, 'index.md'),
    path.join(rel, 'index.mdx')
  ]
  for (const candidate of candidates) {
    const abs = path.join(CONTENT_DIR, candidate)
    try {
      if (fs.statSync(abs).isFile()) return abs
    } catch {
      // try next candidate
    }
  }
  return null
}

// All commit dates for a file (newest first) in one git call. Returns
// { published, modified } Dates, or null if git history isn't available.
function gitDates(file) {
  try {
    const out = execFileSync('git', ['log', '--format=%cI', '--', file], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim()
    if (out) {
      const lines = out.split('\n')
      return {
        modified: new Date(lines[0]),
        published: new Date(lines[lines.length - 1])
      }
    }
  } catch {
    // git unavailable (no binary, no history)
  }
  return null
}

// Committed dates manifest (scripts/content-dates.mjs, kept fresh by
// lint-staged). The remote builder works from a GitHub tarball — no .git —
// so without this every date degraded to checkout mtime ≈ build date,
// advertising fake freshness for all pages on every deploy.
let manifestCache
function manifestDates(file) {
  if (manifestCache === undefined) {
    try {
      manifestCache = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'content-dates.json'), 'utf8')
      )
    } catch {
      manifestCache = null
    }
  }
  const entry = manifestCache?.[path.relative(process.cwd(), file)]
  if (!entry) return null
  return {
    published: new Date(entry.published),
    modified: new Date(entry.modified)
  }
}

// Publish + last-modified dates for a route, most accurate source first:
//   1. git commit history of the source file
//   2. the committed content-dates.json manifest (tarball builds — no .git)
//   3. filesystem mtime
//   4. the provided fallback (build date)
// All failures degrade silently so the build never breaks.
export function datesForRoute(route, fallback = new Date()) {
  const file = sourceFileFor(route)
  if (!file) return { published: fallback, modified: fallback }
  const git = gitDates(file)
  if (git) return git
  const manifest = manifestDates(file)
  if (manifest) return manifest
  try {
    const { mtime } = fs.statSync(file)
    return { published: mtime, modified: mtime }
  } catch {
    return { published: fallback, modified: fallback }
  }
}

// Last-modified date only (used by the sitemap).
export function lastModifiedForRoute(route, fallback = new Date()) {
  return datesForRoute(route, fallback).modified
}

// Convenience for the page generator, which receives the mdxPath segment array.
export function datesForMdxPath(mdxPath, fallback = new Date()) {
  const route = mdxPath && mdxPath.length ? `/${mdxPath.join('/')}` : '/'
  return datesForRoute(route, fallback)
}
