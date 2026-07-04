#!/usr/bin/env node
// Post-build broken-link check.
//
// Crawls the static HTML that `next build` emits into `.next/server/app`,
// resolves every internal <a href> exactly the way a browser would (relative
// to each page's real URL — which, for directory/index pages, has NO trailing
// slash), and asserts the target resolves to a real route or public asset.
//
// This catches the classic Nextra failure mode where an in-content relative
// link like `[x](authorization-code.md)` on an index page (served at
// `/docs/auth/oauth-flows`, no trailing slash) resolves to
// `/docs/auth/authorization-code` — a 404 — instead of
// `/docs/auth/oauth-flows/authorization-code`.
//
// Exits non-zero (failing `npm run build`) when any internal link is broken.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const APP_DIR = ".next/server/app"; // where Next writes prerendered HTML
const PUBLIC_DIR = "public"; // static assets served from the site root
const BASE_PATH = "/docs"; // must match `basePath` in next.config.mjs

// Files under app/ that are routes but not crawlable HTML pages.
const IGNORED_HTML = new Set(["_not-found.html"]);

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// Turn a file path into the URL path it is served at (basePath included, no
// trailing slash, no `.html`). e.g.
//   .next/server/app/auth/oauth-flows.html        -> /docs/auth/oauth-flows
//   .next/server/app/index.html                   -> /docs
//   public/quickstart/login_button.webp           -> /docs/quickstart/login_button.webp
function urlForAppFile(file) {
  let rel = relative(APP_DIR, file).split(sep).join("/");
  rel = rel.replace(/\.html$/, "");
  if (rel === "index") rel = "";
  return rel ? `${BASE_PATH}/${rel}` : BASE_PATH;
}

function urlForPublicFile(file) {
  const rel = relative(PUBLIC_DIR, file).split(sep).join("/");
  return `${BASE_PATH}/${rel}`;
}

function normalize(pathname) {
  // Treat `/docs/x` and `/docs/x/` as the same route.
  if (pathname.length > BASE_PATH.length && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

// --- Build the set of valid destinations ------------------------------------

const validTargets = new Set();

for (const file of walk(APP_DIR)) {
  if (!file.endsWith(".html")) continue;
  if (IGNORED_HTML.has(relative(APP_DIR, file))) continue;
  validTargets.add(normalize(urlForAppFile(file)));
}
for (const file of walk(PUBLIC_DIR)) {
  validTargets.add(normalize(urlForPublicFile(file)));
}

// Dynamic route: /docs/badge/[id] renders on demand for any id.
const dynamicPrefixes = [`${BASE_PATH}/badge/`];

function isValidTarget(pathname) {
  if (validTargets.has(pathname)) return true;
  if (dynamicPrefixes.some((p) => pathname.startsWith(p))) return true;
  return false;
}

// --- Crawl every page and check its internal links --------------------------

const anchorRe = /<a\b[^>]*?\shref="([^"]*)"[^>]*>/gi;
const broken = [];
let pagesChecked = 0;
let linksChecked = 0;

for (const file of walk(APP_DIR)) {
  if (!file.endsWith(".html")) continue;
  if (IGNORED_HTML.has(relative(APP_DIR, file))) continue;

  const pageUrl = urlForAppFile(file);
  // A fake origin lets us use the URL parser for browser-accurate resolution.
  const pageBase = `https://x${pageUrl}`;
  const html = readFileSync(file, "utf8");
  pagesChecked++;

  const seen = new Set();
  let m;
  while ((m = anchorRe.exec(html))) {
    const raw = m[1];
    if (!raw) continue;
    // Skip external, protocol-relative, anchors, and non-navigational schemes.
    if (
      /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|mailto:|tel:)/i.test(raw) ||
      raw.startsWith("//")
    ) {
      continue;
    }

    let resolved;
    try {
      resolved = new URL(raw, pageBase);
    } catch {
      continue;
    }
    // Only check same-site links.
    if (resolved.origin !== "https://x") continue;

    const target = normalize(decodeURI(resolved.pathname));
    if (seen.has(target)) continue;
    seen.add(target);
    linksChecked++;

    // Everything under the site must live below the basePath.
    if (target !== BASE_PATH && !target.startsWith(`${BASE_PATH}/`)) {
      broken.push({ pageUrl, raw, target });
      continue;
    }
    if (!isValidTarget(target)) {
      broken.push({ pageUrl, raw, target });
    }
  }
}

// --- Report -----------------------------------------------------------------

if (validTargets.size === 0 || pagesChecked === 0) {
  console.error(
    `check-links: no built HTML found under ${APP_DIR}. Run \`next build\` first.`
  );
  process.exit(2);
}

if (broken.length > 0) {
  // Group broken links by the page they appear on.
  const byPage = new Map();
  for (const b of broken) {
    if (!byPage.has(b.pageUrl)) byPage.set(b.pageUrl, []);
    byPage.get(b.pageUrl).push(b);
  }
  console.error(
    `\n✖ Broken internal links: ${broken.length} across ${byPage.size} page(s)\n`
  );
  for (const [page, links] of [...byPage].sort()) {
    console.error(`  ${page}`);
    for (const { raw, target } of links) {
      console.error(`    ✗ href="${raw}"  →  ${target}  (404)`);
    }
    console.error("");
  }
  console.error(
    `Checked ${linksChecked} internal links across ${pagesChecked} pages.`
  );
  process.exit(1);
}

console.log(
  `✓ check-links: ${linksChecked} internal links across ${pagesChecked} pages all resolve.`
);
