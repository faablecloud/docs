#!/usr/bin/env node
// Post-build sitemap consistency check.
//
// WHY THIS EXISTS: URLs disappearing from the sitemap (or advertised URLs
// that 404) get the site penalized by search engines — pages drop out of the
// index and rankings suffer. That's an SEO regression we consider severe, so
// any sitemap drift fails the build instead of shipping silently.
//
// Asserts that the sitemap `next build` emits is exactly the set of pages the
// build prerendered — in both directions:
//
//   1. Every prerendered page appears in the sitemap. A page silently dropping
//      out of the sitemap (e.g. a route-collection bug in app/sitemap.js)
//      fails the build instead of quietly de-indexing the page.
//   2. Every sitemap URL is backed by a prerendered page. Advertising a URL
//      with no page behind it sends crawlers (and users following indexed
//      links) to 404s.
//
// Exits non-zero (failing `npm run build`) on any mismatch.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const APP_DIR = ".next/server/app"; // where Next writes prerendered HTML
const SITE_URL = "https://faable.com/docs"; // must match SITE_URL in app/sitemap.js

// Framework-internal HTML files that are not site pages.
const isInternalPage = (rel) =>
  rel.split("/").some((segment) => segment.startsWith("_"));

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

// --- Collect the prerendered pages -------------------------------------------

const pageUrls = new Set();
for (const file of walk(APP_DIR)) {
  if (!file.endsWith(".html")) continue;
  const rel = relative(APP_DIR, file).split(sep).join("/");
  if (isInternalPage(rel)) continue;
  const route = rel.replace(/\.html$/, "");
  pageUrls.add(route === "index" ? SITE_URL : `${SITE_URL}/${route}`);
}

// --- Collect the sitemap URLs -------------------------------------------------

let sitemapXml = null;
for (const candidate of ["sitemap.xml.body", "sitemap.xml"]) {
  try {
    sitemapXml = readFileSync(join(APP_DIR, candidate), "utf8");
    break;
  } catch {
    // try next candidate
  }
}

if (!sitemapXml || pageUrls.size === 0) {
  console.error(
    `check-sitemap: no built sitemap/HTML found under ${APP_DIR}. Run \`next build\` first.`
  );
  process.exit(2);
}

const sitemapUrls = new Set(
  [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    // Normalize a trailing slash so `/docs/x/` and `/docs/x` compare equal.
    (m) => m[1].replace(/\/$/, "")
  )
);

// --- Compare both directions ---------------------------------------------------

const missingFromSitemap = [...pageUrls].filter((u) => !sitemapUrls.has(u)).sort();
const ghostInSitemap = [...sitemapUrls].filter((u) => !pageUrls.has(u)).sort();

if (missingFromSitemap.length > 0 || ghostInSitemap.length > 0) {
  console.error("\n✖ Sitemap is out of sync with the built pages\n");
  if (missingFromSitemap.length > 0) {
    console.error(
      `  Pages built but MISSING from the sitemap (${missingFromSitemap.length}):`
    );
    for (const url of missingFromSitemap) console.error(`    ✗ ${url}`);
    console.error("");
  }
  if (ghostInSitemap.length > 0) {
    console.error(
      `  Sitemap URLs with NO page behind them — would 404 (${ghostInSitemap.length}):`
    );
    for (const url of ghostInSitemap) console.error(`    ✗ ${url}`);
    console.error("");
  }
  console.error(
    `Compared ${sitemapUrls.size} sitemap URLs against ${pageUrls.size} prerendered pages.`
  );
  process.exit(1);
}

console.log(
  `✓ check-sitemap: ${sitemapUrls.size} sitemap URLs match the ${pageUrls.size} prerendered pages exactly.`
);
