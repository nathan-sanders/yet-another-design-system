import { useSyncExternalStore } from 'react'

/**
 * Tailwind's own `max-md` expression — `@media (width < 48rem)` — spelled the
 * same so the JavaScript boundary and the CSS one cannot drift apart. 768 is
 * the library's one phone boundary; see `ResponsiveNav`.
 */
const QUERY = '(width < 48rem)'

let list: MediaQueryList | null = null

function media() {
  if (typeof window === 'undefined') return null
  return (list ??= window.matchMedia(QUERY))
}

/** Module scope, `platform.ts`'s reason: a fresh function each render would resubscribe each render. */
function subscribe(callback: () => void) {
  const query = media()
  if (!query) return () => {}
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

/** A boolean, so `useSyncExternalStore`'s identity compare works. */
function getSnapshot() {
  return media()?.matches ?? false
}

/** The server does not know, and a wide layout is the safer guess. */
function getServerSnapshot() {
  return false
}

/**
 * Whether the viewport is below 768 — a phone.
 *
 * **This is the library's one JavaScript reader of the phone boundary, and it
 * is for popups only.** Every responsive swap that paints on first load —
 * `ResponsiveNav`, `AppShell`, `BentoGrid`, `Panel` — is CSS-only, because a
 * `matchMedia` hook renders nothing useful on the server and then flashes the
 * wrong layout at hydration. That reason does not reach a `Drawer`: a closed
 * drawer paints nothing at all, so there is no first paint to get wrong, and
 * by the time somebody opens it the hook has its real answer. The one residue
 * is a `defaultOpen` drawer rendered on a server, which is a side drawer for
 * the hydration frame and a sheet the next; the Drawer record carries that.
 *
 * Do not reach for this from a component that is visible on load. Render both
 * branches and hide one with `md:` instead.
 */
export function usePhone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
