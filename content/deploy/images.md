---
title: Image Optimization
description: Faable resizes and re-encodes your images at the edge of your app, on every Faable Deploy project. Automatic for Next.js, and available to any framework through a single URL.
---

# Image Optimization

Faable serves optimized images for your app. A request for an image goes to the
platform's image optimizer, which resizes it, picks a format the visitor's
browser accepts, caches the result and serves it — **without waking your app**
once the image is cached.

There is nothing to install, nothing to configure and nothing to pay for
separately.

## Next.js: nothing to do

If your app uses `next/image`, this is already happening. Your HTML keeps
emitting the same `/_next/image?url=…&w=…&q=…` URLs, and Faable answers them
instead of your app's own optimizer. Your code, your `srcset` and your
`next.config.js` stay exactly as they are.

What you get out of it:

- **Your app stops spending CPU on images.** Image encoding is expensive and it
  runs in the same process that renders your pages, so a burst of image requests
  slows down everything else your app is doing. That work now happens somewhere
  else.
- **Your cache volume stays small**, because your app no longer writes optimized
  images to disk.
- **Cached images are served while your app sleeps**, so a visitor who lands on a
  page with images does not wait for anything to start.

A few Next.js configurations keep using your app's own optimizer, and they keep
working exactly as before:

| Your configuration                                | What happens                                                 |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `images.remotePatterns` (images hosted elsewhere) | Your app optimizes them, as it does today                    |
| `images.loader: 'custom'` or `images.unoptimized` | Untouched — your HTML never points at the platform optimizer |
| `basePath` or `assetPrefix`                       | Your app optimizes them                                      |

## Any other framework

The same optimizer is available on every Faable app under a URL you can write by
hand, whatever you build your site with:

```
/.faable/image?url=<path>&w=<width>[&q=<quality>][&fm=<format>]
```

| Parameter |                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `url`     | **Required.** An absolute path on your own site, such as `/images/hero.png`. Full URLs are not accepted                                    |
| `w`       | **Required.** The width in pixels, from the standard set: `16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840` |
| `q`       | Quality, 1–100. Defaults to `75`                                                                                                           |
| `fm`      | `webp`, `jpeg` or `png`, when you would rather state the format than let the browser negotiate it                                          |

In plain HTML:

```html
<img
  src="/.faable/image?url=/images/hero.png&w=1200"
  srcset="
    /.faable/image?url=/images/hero.png&w=640   640w,
    /.faable/image?url=/images/hero.png&w=1200 1200w,
    /.faable/image?url=/images/hero.png&w=1920 1920w
  "
  sizes="100vw"
  alt=""
/>
```

In Astro, SvelteKit, Nuxt or anything else, build the same URL from your own
component. If you prefer to point `next/image` at it explicitly, use a custom
loader:

```js
// faable-loader.js
export default ({ src, width, quality }) =>
  `/.faable/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
```

```js
// next.config.js
module.exports = {
  images: { loader: 'custom', loaderFile: './faable-loader.js' }
}
```

## What the optimizer does, and what it refuses to do

- **It never enlarges an image.** If you ask for a width above the original's,
  you get the original's width. Asking for `w=2048` and `w=3840` on a 1920px
  source returns the same bytes, from the same cache entry.
- **It never converts to a heavier format.** If your source is already WebP or
  AVIF and the browser has not said it prefers something else, you get your file
  as it is — never a bigger one in a different format.
- **It never serves more bytes than it started with.** When re-encoding an image
  would not make it smaller, you get your original file back, untouched.
- **It converts when it pays off.** A JPEG or PNG served to a browser that
  accepts WebP comes back as WebP.
- **SVG is passed through untouched**, with a restrictive `Content-Security-Policy`.
- **Animated images (GIF, animated WebP) are passed through untouched.**
- Sources above 25 MB or 50 megapixels are served as they are.

## Caching

Optimized images are served with:

```
Cache-Control: public, max-age=2592000, must-revalidate
ETag: "…"
Vary: Accept
```

An `X-Faable-Image` response header tells you where the answer came from, which
is useful when you are checking your own pages:

| Value   |                                                                          |
| ------- | ------------------------------------------------------------------------ |
| `HIT`   | Served from the platform cache                                           |
| `MISS`  | Built for this request and cached                                        |
| `PASS`  | Your original file, served unchanged (nothing to gain by re-encoding it) |
| `PROXY` | Handed to your app's own optimizer                                       |

Deploying a new version does not throw the cache away: images are cached by
their content, so anything you did not change stays cached across deploys.
