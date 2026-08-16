#!/usr/bin/env node
// Maintains content-dates.json: real published/modified dates per content
// file, committed to the repo.
//
// WHY: the remote builder works from a GitHub tarball — no .git — so the
// git-based dates in app/_lib/last-modified.js silently degrade to checkout
// mtime there, advertising "modified today" for all 90 pages on every deploy
// (fake freshness for Google, and the IndexNow lastmod filter passes
// everything). This manifest carries the real dates into tarball builds.
//
// Modes:
//   --all             rebuild every entry from git history (bootstrap/repair)
//   <files...>        lint-staged mode: stamp the staged content files with
//                     "now" as modified (preserving published), then stage
//                     the manifest so it rides along in the same commit.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const MANIFEST = path.join(ROOT, 'content-dates.json')

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'))
  } catch {
    return {}
  }
}

function saveManifest(manifest) {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
  )
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n')
}

function gitDates(rel) {
  try {
    const out = execFileSync('git', ['log', '--format=%cI', '--', rel], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim()
    if (out) {
      const lines = out.split('\n')
      return { modified: lines[0], published: lines[lines.length - 1] }
    }
  } catch {
    // git unavailable
  }
  return null
}

function walkContent(dir = CONTENT_DIR) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkContent(full))
    else if (/\.(md|mdx)$/.test(entry.name)) out.push(full)
  }
  return out
}

const args = process.argv.slice(2)
const manifest = loadManifest()

if (args[0] === '--all') {
  const rebuilt = {}
  for (const abs of walkContent()) {
    const rel = path.relative(ROOT, abs)
    const dates = gitDates(rel)
    if (dates) rebuilt[rel] = dates
    else {
      const now = new Date().toISOString()
      rebuilt[rel] = manifest[rel] ?? { published: now, modified: now }
    }
  }
  saveManifest(rebuilt)
  console.log(
    `content-dates: rebuilt ${Object.keys(rebuilt).length} entries from git`
  )
} else {
  // lint-staged passes absolute paths of the staged files.
  const now = new Date().toISOString()
  let touched = 0
  for (const arg of args) {
    const rel = path.relative(ROOT, path.resolve(arg))
    if (!rel.startsWith('content' + path.sep)) continue
    try {
      statSync(path.resolve(arg))
    } catch {
      delete manifest[rel] // file deleted/renamed away
      touched++
      continue
    }
    manifest[rel] = {
      published: manifest[rel]?.published ?? now,
      modified: now
    }
    touched++
  }
  if (touched > 0) {
    saveManifest(manifest)
    execFileSync('git', ['add', MANIFEST], { cwd: ROOT })
    console.log(`content-dates: stamped ${touched} file(s)`)
  }
}
