---
title: The Widget
description: Reference for the Faable Challenge widget — the script tag and the @faable/challenge package, render, getResponse, execute, reset and remove, every option and data attribute, themes, sizes, languages, events, single-page apps and Content Security Policy.
rank: normal
---

# The Widget

The widget is the visible part of Faable Challenge: a small badge in your form that says **Protected against bots**, then **Checking you are human…** while the browser solves the challenge, and **Verified** when the token is ready. It draws itself in a Shadow DOM with inline SVG and CSS, so it neither inherits nor leaks your page's styles.

## Loading it

### Script tag

```html
<script src="https://challenge.faable.com/v1/api.js" async defer></script>
```

The script renders every `.faable-challenge[data-sitekey]` element on the page, and any added later. It also exposes `window.FaableChallenge` with the [functions below](#functions).

| URL parameter      | Effect                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?render=explicit` | Renders nothing on its own. Only `FaableChallenge.render(el, options)` draws a widget.                                                                              |
| `?onload=<name>`   | Calls `window[<name>]()` once the script has run. Without it, `window.onFaableChallengeLoad` is called if it exists. Define the function **before** the script tag. |

```html
<script>
  window.onChallengeReady = () => {
    FaableChallenge.render(document.querySelector('#challenge'), {
      sitekey: 'fcs_pk_…'
    })
  }
</script>
<script
  src="https://challenge.faable.com/v1/api.js?render=explicit&onload=onChallengeReady"
  async
  defer
></script>
```

### npm package

```bash
npm install @faable/challenge
```

```ts
import { execute, getResponse, remove, render, reset } from '@faable/challenge'
```

The package carries the same code as the script, as an ES module, plus `renderAll(root)` and `watch()` — the automatic rendering the script tag does. It is safe to import during server-side rendering; call `render` in the browser.

## Functions

| Function              | Returns           | What it does                                                                                                                       |
| --------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `render(el, options)` | `string` (the id) | Draws the widget in `el` and protects the form around it. Calling it again on the same element returns the same id.                |
| `getResponse(ref?)`   | `string \| null`  | The current token, or `null` while there is none.                                                                                  |
| `execute(ref?)`       | `Promise<string>` | Solves now and resolves with the token (or with the one already there). For `execution: 'manual'`, or to await the token yourself. |
| `reset(ref?)`         | —                 | Drops the token and starts over: the next interaction solves again. Call it after a send in a form that stays on the page.         |
| `remove(ref?)`        | —                 | Removes the widget, its hidden field and its listeners.                                                                            |
| `renderAll(root?)`    | —                 | Renders every `.faable-challenge[data-sitekey]` under `root` (default: `document`). Package only; the script does it for you.      |
| `watch()`             | —                 | Renders the widgets on the page now and any added later. Package only; it is what the script runs unless `?render=explicit`.       |

`ref` is the id `render` returned or the element itself. Without it, the first widget on the page is used.

## Options

The same options can be passed to `render()` or written on the element as `data-*` attributes (for widgets the script renders on its own).

| `render()` option    | Attribute               | Default                     | What it does                                                                                                                                                         |
| -------------------- | ----------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sitekey`            | `data-sitekey`          | — (required)                | The site key, `fcs_pk_…`.                                                                                                                                            |
| `action`             | `data-action`           | none                        | A free label up to 64 characters (`contact`, `booking`). It comes back in the verify response, and verify can require it.                                            |
| `execution`          | `data-execution`        | `interaction`               | When to solve: `interaction` (first focus or keystroke in the form), `load` (at once), or `manual` (only on `execute()`).                                            |
| `responseField`      | `data-response-field`   | `faable-challenge-response` | The name of the hidden field that carries the token.                                                                                                                 |
| `callback`           | `data-callback`         | none                        | Called with the token when it is ready. As an attribute, the name of a global function.                                                                              |
| `'expired-callback'` | `data-expired-callback` | none                        | Called when the token is about to expire and is being renewed.                                                                                                       |
| `'error-callback'`   | `data-error-callback`   | none                        | Called with the error when the challenge could not be obtained or solved.                                                                                            |
| `theme`              | class (see below)       | `auto`                      | `light`, `dark`, or `auto` (follows `prefers-color-scheme`).                                                                                                         |
| `size`               | class (see below)       | fit                         | `normal` (the full badge) or `compact` (a round icon). By default it fits: the full badge when there is room, the round one when there is not, re-decided on resize. |
| `locale`             | `data-lang`             | the page's language         | The language of the badge, as a BCP 47 tag (`es`, `pt-BR`).                                                                                                          |
| `brand`              | class `--no-brand`      | `true`                      | Shows the Faable Challenge mark in the full badge.                                                                                                                   |

A callback that throws never breaks the form.

### Classes

Classes on the element set the look, and win over the `render()` options:

| Class                                           | Effect                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| `faable-challenge--light` · `--dark` · `--auto` | Theme: white badge, black badge, or follow the system. |
| `faable-challenge--normal` · `--compact`        | Always the full badge, or always the round icon.       |
| `faable-challenge--no-brand`                    | Hides the Faable Challenge mark.                       |
| `faable-challenge--lang-<xx>`                   | Language, like `data-lang`.                            |

```html
<div
  class="faable-challenge faable-challenge--dark faable-challenge--compact"
  data-sitekey="fcs_pk_…"
  data-action="booking"
  data-lang="es"
></div>
```

### Languages

The badge speaks **more than 100 languages**, including every official EU language, the regional languages of Spain (Catalan, Basque, Galician), and script and regional variants such as `pt-BR`, `zh-Hant` (also `zh-TW` and `zh-HK`) and `sr-Latn`.

The language is the first of: `data-lang`, a `faable-challenge--lang-<xx>` class, the `locale` option, the closest `lang` attribute (usually your page's `<html lang>`), the browser's language, and English. A region falls back to its base language (`fr-CA` → `fr`), and an unknown language to English.

## How it behaves

- **Solving.** With `interaction`, the first focus or keystroke inside the form starts it. A widget that is not inside a `<form>` solves as soon as it renders. A click on the idle badge also starts it.
- **An early send.** If the form is submitted before the token is ready, the submit is held, the widget finishes, and the form is submitted again on its own — with the same submit button, so its `name` and `value` still arrive.
- **The hidden field.** It is added inside the form, so it travels with a normal submit and with `new FormData(form)`. Without a form, it is placed right after the widget, and `getResponse()` reads it.
- **Renewal.** A token lasts 5 minutes. While the widget is on the page, it is renewed 30 seconds before it expires; `expired-callback` is called and a new token replaces the old one.
- **The native reset.** A `<button type="reset">` (or `form.reset()`) also resets the widget.
- **Errors.** If the challenge cannot be obtained (a site key that does not exist, a domain not on the site, the network), the badge shows **Could not verify**, `error-callback` is called, and a click or Enter on it retries.

## Events

The element emits bubbling DOM events as the badge changes state:

| Event                      | When                                                    |
| -------------------------- | ------------------------------------------------------- |
| `faable-challenge:idle`    | Back to the start (after `reset`, or before a renewal). |
| `faable-challenge:solving` | Solving started.                                        |
| `faable-challenge:done`    | The token is ready.                                     |
| `faable-challenge:error`   | The challenge failed.                                   |

```js
document
  .querySelector('.faable-challenge')
  .addEventListener('faable-challenge:done', () => {
    submitButton.disabled = false
  })
```

The events follow the badge, which keeps **Checking you are human…** on screen for at least 1.2 seconds so it can be read. The token itself does not wait: `callback`, `getResponse()` and `execute()` have it as soon as it exists.

## Single-page apps

A form that stays on the page after a send needs a fresh token for the next one: the token it carried is spent. Call `reset()` after each send, and `remove()` when the component goes away.

```tsx
import { useEffect, useRef } from 'react'
import { getResponse, remove, render, reset } from '@faable/challenge'

export function ContactForm() {
  const box = useRef<HTMLDivElement>(null)
  const id = useRef<string | null>(null)

  useEffect(() => {
    id.current = render(box.current!, {
      sitekey: 'fcs_pk_…',
      action: 'contact'
    })
    return () => remove(id.current!)
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget) // carries faable-challenge-response
    await fetch('/api/contact', { method: 'POST', body: form })
    reset(id.current!)
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="email" type="email" required />
      <div ref={box} />
      <button>Send</button>
    </form>
  )
}
```

The widget holds a send that comes before the token, so `onSubmit` only runs once the hidden field is filled. If you submit without a `<form>`, take the token yourself:

```ts
const token = await execute(id) // solves if needed, then resolves
await fetch('/api/booking', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ...data, token })
})
reset(id)
```

## Content Security Policy

With a CSP, allow Faable Challenge's origin for the script and its two requests:

```
script-src  https://challenge.faable.com;
connect-src https://challenge.faable.com;
worker-src  blob:;
```

`worker-src blob:` lets the solver run in a Web Worker. Without it the widget still works, solving in short batches on the page's main thread. The badge draws itself with an inline `<style>` and a `data:` image inside its shadow root, so a policy that restricts `style-src` or `img-src` must allow those for the badge to look right. With the npm package, `script-src` does not need the origin.

## Accessibility

The badge's text is a polite live region, so a screen reader announces **Checking you are human…** and **Verified**. In the error state it is a focusable button that retries on Enter. With `prefers-reduced-motion`, nothing animates.
