import { useSyncExternalStore } from 'react'

/**
 * Whether the user is on an Apple platform — the one thing `Kbd` needs in order
 * to draw `mod` as ⌘ rather than ⌃.
 *
 * The awkward part is not the detection, it is *when* it is allowed to happen.
 * `navigator` does not exist while a page is being rendered on the server, so a
 * component that reads it during render either crashes there or disagrees with
 * itself at hydration. `useSyncExternalStore` is the primitive built for exactly
 * this shape: the server snapshot and the first client render agree (both say
 * Apple, so the ⌘ is what paints first), and React swaps in the real answer
 * immediately after mount for everyone else.
 *
 * `subscribe` is a no-op that returns a no-op: the value cannot change while the
 * page is open. It is declared at module scope because a fresh function on every
 * render would make React resubscribe on every render.
 */
const subscribe = () => () => {}

/** Server and first paint both assume Apple, so ⌘ is what renders before mount. */
const getServerSnapshot = () => true

/**
 * `navigator.platform` is deprecated but is still the only thing that reports a
 * Mac in every browser; `userAgentData.platform` is the modern replacement and
 * is Chromium-only, so it is tried first and fallen back from. Returning a
 * boolean rather than an object matters — `useSyncExternalStore` compares
 * snapshots by identity, and a fresh object each call would loop forever.
 */
function getSnapshot() {
  if (typeof navigator === 'undefined') return true
  const { userAgentData } = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = userAgentData?.platform ?? navigator.platform ?? ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/** `true` on macOS, iOS and iPadOS. Safe to call during SSR — see above. */
export function useIsApplePlatform() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
