// Must match `basePath` in next.config.mjs: a plain <img> in a component does
// not get the prefix that Nextra adds to markdown images.
const BASE_PATH = '/docs'

/**
 * A screen as a desktop browser and a phone show it, side by side. Images live
 * in `public/<dir>/<name>-{desktop,mobile}.webp` — hosted login screens
 * captured at 1024×800 and as an iPhone 13 (390×664). `desktop` and `mobile`
 * are the files' pixel sizes, so the browser reserves the right box before
 * they load; pass them when a capture is cropped (the emails are).
 */
export function ScreenshotPair({
  name,
  alt,
  dir = 'auth/hosted-login',
  desktop = [1440, 1125],
  mobile = [600, 1022]
}) {
  const base = `${BASE_PATH}/${dir}/${name}`
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
          src={`${base}-desktop.webp`}
          alt={`${alt} (desktop)`}
          width={desktop[0]}
          height={desktop[1]}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
      <div className="w-1/2 overflow-hidden rounded-[1.5rem] border-4 border-neutral-800 bg-white shadow-sm sm:w-1/4 dark:border-neutral-600">
        <img
          src={`${base}-mobile.webp`}
          alt={`${alt} (mobile)`}
          width={mobile[0]}
          height={mobile[1]}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
    </figure>
  )
}
