import { useLayoutEffect, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'

/**
 * Where an element is in its life: `starting` is the one commit it spends in
 * its entrance styles, `entering` is the entrance transition running, `open`
 * is at rest, `ending` is the exit transition running before it leaves the
 * DOM. A caller that has to do something only *while* the element moves — clip
 * it, say — reads `entering` and `ending`; one that only needs the attributes
 * Base UI would write reads `starting` and `ending`.
 */
export type PresenceStatus = 'starting' | 'entering' | 'open' | 'ending'

/**
 * Keeps an element mounted for the length of its exit transition, and gives
 * its entrance one commit of "starting" styles to transition *from*. Base UI's
 * `data-starting-style` / `data-ending-style` vocabulary for a thing that is
 * not a popup — an in-flow region that has to leave the layout when it closes,
 * which no Base UI part does without also rendering a wrapper that stays.
 *
 * The caller renders the element while `mounted`, writes
 * `data-starting-style` when the status is `starting` and `data-ending-style`
 * when it is `ending`, and puts a `transition-*` class on it. With no
 * transition to wait for the element unmounts in the same tick, which is also
 * what `prefers-reduced-motion` produces in effect: theme.css clamps every
 * transition to 1ms rather than 0, so `getAnimations()` still sees one.
 *
 * **A forced reflow, not `requestAnimationFrame`.** The element is inserted
 * with its starting styles; for the change to its resting styles to be a
 * *change* the transition can observe, the browser has to have computed the
 * starting ones first. Reading layout does that synchronously. A rAF would do
 * it too, one frame later — except in a hidden tab, where rAF never fires and
 * the element would sit in its starting styles until the tab was looked at.
 */
export function usePresence(open: boolean, ref: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<{ mounted: boolean; status: PresenceStatus }>(() => ({
    mounted: open,
    status: 'open',
  }))

  /*
    Derived during render, the way Base UI's own transition-status hook does
    it, so the element's first commit already carries the right attribute.
  */
  if (open && !state.mounted) setState({ mounted: true, status: 'starting' })
  if (!open && state.mounted && state.status !== 'ending') {
    setState({ mounted: true, status: 'ending' })
  }
  if (open && state.mounted && state.status === 'ending') {
    // Reopened mid-exit: back in from wherever the transition got to.
    setState({ mounted: true, status: 'entering' })
  }

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || !state.mounted) return

    if (state.status === 'starting') {
      void element.getBoundingClientRect()
      setState({ mounted: true, status: 'entering' })
      return
    }

    if (state.status === 'entering' || state.status === 'ending') {
      const ending = state.status === 'ending'
      let cancelled = false
      const settle = () => {
        if (cancelled) return
        // flushSync on the way out, so the browser never paints the settled exit frame.
        if (ending) flushSync(() => setState({ mounted: false, status: 'open' }))
        else setState({ mounted: true, status: 'open' })
      }
      // getAnimations() flushes style, so the transition exists to be read.
      const animations = element.getAnimations()
      if (animations.length === 0) settle()
      else void Promise.allSettled(animations.map((animation) => animation.finished)).then(settle)
      return () => {
        cancelled = true
      }
    }
  }, [ref, state.mounted, state.status])

  return state
}
