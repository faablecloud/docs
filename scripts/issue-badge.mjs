#!/usr/bin/env node
// Faable Auth Academy — Phase 1 credential generator (no signing, no Mongo).
//
// Creates a per-recipient credential record under public/certs/<id>.json and
// prints the LinkedIn "Add to profile" deep link. Phase 2 will replace this with
// a thin API client that requests a signed Open Badges VC-JWT from the auth
// server; the page + JSON shape stay the same.
//
// Usage:
//   node scripts/issue-badge.mjs --name "Marc Pomar" [--achievement integrator]
//        [--issued 2026-06] [--org-id 12345678]
//
// --org-id is the numeric LinkedIn Company Page id for faablecloud (makes the
// Faable logo show on the cert entry). Without it we fall back to the org name.

import { readdir, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CERTS_DIR = path.join(ROOT, "public", "certs");
const SITE = "https://faable.com/docs";

const ACHIEVEMENTS = {
  integrator: { prefix: "FA-INT", name: "Faable Auth Integrator" },
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function nextSequence(prefix, year) {
  let files = [];
  try {
    files = await readdir(CERTS_DIR);
  } catch {
    /* dir may not exist yet */
  }
  const re = new RegExp(`^${prefix}-${year}-(\\d+)\\.json$`);
  let max = 0;
  for (const f of files) {
    const m = f.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return String(max + 1).padStart(4, "0");
}

function linkedInAddUrl(cred, achievement, orgId) {
  const [year, month] = cred.issued.split("-");
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: achievement.name,
    issueYear: year,
    issueMonth: String(parseInt(month, 10)),
    certUrl: cred.credential_url,
    certId: cred.id,
  });
  if (orgId) params.set("organizationId", orgId);
  else params.set("organizationName", "Faable");
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const name = args.name;
  const achievementKey = args.achievement || "integrator";
  const issued = args.issued || currentYearMonth();
  const orgId =
    args["org-id"] || process.env.NEXT_PUBLIC_LINKEDIN_ORG_ID || "80306063";

  const achievement = ACHIEVEMENTS[achievementKey];
  if (!name || !achievement) {
    console.error(
      `Usage: node scripts/issue-badge.mjs --name "Full Name" [--achievement ${Object.keys(
        ACHIEVEMENTS
      ).join("|")}] [--issued YYYY-MM] [--org-id <num>]`
    );
    process.exit(1);
  }

  const [year] = issued.split("-");
  const seq = await nextSequence(achievement.prefix, year);
  const id = `${achievement.prefix}-${year}-${seq}`;
  const cred = {
    id,
    achievement: achievementKey,
    recipient_name: name,
    issued,
    credential_url: `${SITE}/badge/${id}`,
  };

  await mkdir(CERTS_DIR, { recursive: true });
  const file = path.join(CERTS_DIR, `${id}.json`);
  await writeFile(file, JSON.stringify(cred, null, 2) + "\n");

  console.log(`\n✅ Credential issued: ${id}`);
  console.log(`   File:        public/certs/${id}.json`);
  console.log(`   Credential:  ${cred.credential_url}`);
  console.log(`\n🔗 Send this LinkedIn "Add to profile" link to ${name}:\n`);
  console.log(linkedInAddUrl(cred, achievement, orgId));
  console.log(
    `\nNext: commit public/certs/${id}.json to the docs repo so the page goes live.\n`
  );
}

main();
