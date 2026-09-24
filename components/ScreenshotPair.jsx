// Must match `basePath` in next.config.mjs: a plain <img> in a component does
// not get the prefix that Nextra adds to markdown images.
const BASE = '/docs/auth/hosted-login'

/**
 * A hosted login screen as a desktop browser and a phone show it, side by
 * side. Images live in `public/auth/hosted-login/<name>-{desktop,mobile}.webp`
 * — desktop captured at 1024×800, mobile as an iPhone 13 (390×664).
 */
export function ScreenshotPair({ name, alt }) {
  return (
    <figure className="not-prose mt-4 mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
      <div className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm sm:w-3/4 dark:border-neutral-700">
        <div
          aria-hidden="true"
          className="flex gap-1.5 border-b border-neutral-200 bg-neutral-100 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
        <img
          src={`${BASE}/${name}-desktop.webp`}
          alt={`${alt} (desktop)`}
          width={1440}
          height={1125}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
      <div className="w-1/2 overflow-hidden rounded-[1.5rem] border-4 border-neutral-800 bg-white shadow-sm sm:w-1/4 dark:border-neutral-600">
        <img
          src={`${BASE}/${name}-mobile.webp`}
          alt={`${alt} (mobile)`}
          width={600}
          height={1022}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
    </figure>
  )
}
