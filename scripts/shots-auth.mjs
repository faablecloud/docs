// Screenshots for the auth docs, reproducible in one command.
//
// A stale screenshot is worse than none, and the only way to keep them
// current is for retaking them to cost nothing. Each entry below names the
// page, what to wait for, and the file it lands in under public/.
//
//   DASHBOARD_URL=https://dashboard.faable.com \
//   AUTH_TENANT_URL=https://acme.auth.staging.faable.link \
//   DASHBOARD_STATE=./.shots/dashboard-state.json \   # Playwright storageState of a signed-in staff session
//   node scripts/shots-auth.mjs [name ...]
//
// Eight shots: four for login-experience, four for login-flows.
// Take them against STAGING with a canary tenant of the Faable Staff project
// (arch/deploy/canary-apps.md): no real users, and the account has a
// `webauthn_rp_id` so the passkey ceremony works in the capture browser.
// 1280×800, light theme, WebP ≤ 200 KB. The hosted screens are captured on
// the tenant's auth domain; the dashboard ones need the signed-in state.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const DASHBOARD_URL =
  process.env.DASHBOARD_URL ?? 'https://dashboard.faable.com'
const AUTH_TENANT_URL = process.env.AUTH_TENANT_URL
const DASHBOARD_STATE = process.env.DASHBOARD_STATE
const PROJECT = process.env.SHOTS_PROJECT_ID
const ACCOUNT = process.env.SHOTS_ACCOUNT_ID
const CLIENT_ID = process.env.SHOTS_CLIENT_ID

const dashboardPath = sub =>
  `${DASHBOARD_URL}/auth/${PROJECT}/account/${ACCOUNT}/${sub}`

// name → { url, needs, ready, clip, out }
const SHOTS = {
  'login-methods': {
    url: () => dashboardPath('authentication'),
    needs: 'dashboard',
    ready: async page => page.getByText('Login methods').waitFor(),
    clip: async page =>
      page
        .getByText('Login methods')
        .locator('xpath=ancestor::div[1]')
        .boundingBox(),
    out: 'auth/login-experience/login-methods.webp'
  },
  'passkey-settings': {
    url: () => dashboardPath('authentication'),
    needs: 'dashboard',
    ready: async page =>
      page.getByText('Offer to create a passkey after sign-in').waitFor(),
    clip: async page =>
      page
        .getByText('Passkeys', { exact: true })
        .locator('xpath=ancestor::div[1]')
        .boundingBox(),
    out: 'auth/login-experience/passkey-settings.webp'
  },
  'passkey-autofill': {
    url: () => `${AUTH_TENANT_URL}/flow/login?client_id=${CLIENT_ID}`,
    needs: 'tenant',
    // Conditional UI is drawn by the browser, not the page: focus the email
    // field so the suggestion sheet shows, then capture the viewport.
    ready: async page => {
      await page.getByRole('textbox', { name: /email/i }).click()
      await page.waitForTimeout(800)
    },
    out: 'auth/login-experience/passkey-autofill.webp'
  },
  'default-flow': {
    url: () => dashboardPath('loginflow'),
    needs: 'dashboard',
    ready: async page => page.getByTestId('flow-node-end').waitFor(),
    clip: async page => page.getByTestId('flow-canvas').boundingBox(),
    out: 'auth/login-flows/default-flow.webp'
  },
  'client-binding': {
    url: () =>
      `${DASHBOARD_URL}/auth/${PROJECT}/account/${ACCOUNT}/client/${process.env.SHOTS_CLIENT_DOC_ID}`,
    needs: 'dashboard',
    ready: async page => page.getByTestId('login-flow-binding').waitFor(),
    clip: async page => page.getByTestId('login-flow-binding').boundingBox(),
    out: 'auth/login-flows/client-binding.webp'
  },
  editor: {
    // A materialised flow with a condition selected: click the Draft view,
    // then the first condition node, so the properties panel is filled.
    url: () => dashboardPath('loginflow'),
    needs: 'dashboard',
    ready: async page => {
      await page.getByTestId('flow-view-draft').click()
      await page.locator('[data-testid^="flow-node-"]').first().click()
      await page.getByTestId('flow-properties').waitFor()
    },
    out: 'auth/login-flows/editor.webp'
  },
  preview: {
    // The hosted login reached with a preview token: run "Try this flow" by
    // hand first and paste the opened URL in SHOTS_PREVIEW_URL.
    url: () => process.env.SHOTS_PREVIEW_URL,
    needs: 'tenant',
    ready: async page => page.getByRole('heading').first().waitFor(),
    out: 'auth/login-flows/preview.webp'
  },
  'passkey-offer': {
    // Reached only through a real login: sign in with the canary user's
    // password first, and the tenant's offer parks the flow here.
    url: () => `${AUTH_TENANT_URL}/flow/login?client_id=${CLIENT_ID}`,
    needs: 'tenant-login',
    ready: async page => {
      await page
        .getByRole('textbox', { name: /email/i })
        .fill(process.env.SHOTS_USER_EMAIL)
      await page.getByLabel(/password/i).fill(process.env.SHOTS_USER_PASSWORD)
      await page
        .getByRole('button', { name: /sign in|continue/i })
        .first()
        .click()
      await page.getByTestId('passkey-offer-create').waitFor()
    },
    out: 'auth/login-experience/passkey-offer.webp'
  }
}

const wanted = process.argv.slice(2)
const names = wanted.length ? wanted : Object.keys(SHOTS)

const browser = await chromium.launch()
try {
  for (const name of names) {
    const shot = SHOTS[name]
    if (!shot)
      throw new Error(
        `unknown shot "${name}" — one of ${Object.keys(SHOTS).join(', ')}`
      )
    if (
      shot.needs !== 'tenant' &&
      shot.needs !== 'tenant-login' &&
      !DASHBOARD_STATE
    ) {
      throw new Error(
        `"${name}" needs DASHBOARD_STATE (a signed-in Playwright storageState)`
      )
    }
    if (shot.needs !== 'dashboard' && !AUTH_TENANT_URL) {
      throw new Error(`"${name}" needs AUTH_TENANT_URL`)
    }
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
      deviceScaleFactor: 2,
      ...(shot.needs === 'dashboard' ? { storageState: DASHBOARD_STATE } : {})
    })
    const page = await context.newPage()
    await page.goto(shot.url(), { waitUntil: 'networkidle' })
    await shot.ready(page)
    const out = path.join('public', shot.out)
    await mkdir(path.dirname(out), { recursive: true })
    const clip = shot.clip ? await shot.clip(page) : undefined
    await page.screenshot({
      path: out,
      type: 'jpeg',
      quality: 90,
      ...(clip ? { clip } : {})
    })
    console.log(`${name} → ${out}`)
    await context.close()
  }
} finally {
  await browser.close()
}

// Playwright writes PNG/JPEG only; convert to WebP afterwards (≤ 200 KB):
//   for f in public/auth/login-experience/*.jpeg; do cwebp -q 82 "$f" -o "${f%.jpeg}.webp"; done
