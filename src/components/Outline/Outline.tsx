import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ComponentPropsWithRef, KeyboardEvent, MouseEvent, RefObject } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { depthOf, pickActive, type OutlineItem, type OutlineLevel } from './scrollspy'

/**
 * Outline — the headings on this page, with the one in view marked.
 *
 * A table of contents for documentation, help centers and long settings pages:
 * a `<nav>` of same-page links, indented by heading level, with a 1px track
 * down the left edge and a 2px indicator that slides to the active heading as
 * the page scrolls. Astryx's `Outline`, read at the DOM.
 *
 * Mirrors the Figma component set "Outline" and the "Outline Item" set on
 * `↪ Outline` — node ids in `CLAUDE.md`.
 *
 *     <Outline items={[{ id: 'install', label: 'Installation' }, …]} />
 *
 * **One Tab stop, arrows between the headings — Tabs' pattern, and Astryx's.**
 * Tab lands on the active link (the first, when nothing is active), ↓/↑ move
 * focus with wrap, Home/End jump to the ends, and Enter or Space follows the
 * link. Arrows only move focus: on a tab strip activating on arrow is cheap,
 * but here activation scrolls the page, and scrolling on every arrow press
 * would fight the reader. The tab stop roves — Shift+Tab out and Tab back
 * returns to the link you left — and follows the active heading when the spy
 * moves it. Still a `<nav>` of anchors with `aria-current="location"`: the
 * roving is on `tabindex` alone, and no ARIA role changes.
 *
 * **The indicator slides, and it costs no JavaScript animation.** Tabs' idiom
 * turned on its side: a layout effect reads the active link's `offsetTop` and
 * `offsetHeight` and hands them to CSS as `--outline-indicator-top` and
 * `--outline-indicator-height`; one element transitions `translate` and
 * `height`. The wrapper round the track and the list is `relative`, so the
 * link's offsets are measured against it, and the track — which the indicator
 * paints over — spans exactly that wrapper. A `ResizeObserver` on the list
 * re-measures when a label wraps or the outline is resized.
 *
 * **Scroll-spy is a scroll listener, not an `IntersectionObserver`.** `offset`
 * defines an activation *line* — the top of the scroll root plus the height of
 * whatever overlays it — and the active heading is the last one whose top has
 * reached that line (`pickActive`, tested in Node). Intersection thresholds
 * cannot express a line precisely; Carousel uses an observer because it asks a
 * different question, "which slide is most visible". Scroll events are
 * coalesced with `requestAnimationFrame`, so a frame measures at most once.
 *
 * **`offset` and `scroll-margin-top` compose.** A click scrolls the root itself
 * (`scrollTo`, not `scrollIntoView`, which would drag every scrollable ancestor
 * — Carousel's finding) to put the heading `offset` plus its own
 * `scroll-margin-top` below the root's top edge. The activation line reads the
 * same margin off each heading, so a heading is active exactly where clicking
 * it lands. Leave `offset` at 0 when nothing overlays the content.
 *
 * **A click owns the scroll until it ends.** While a navigation is in flight
 * the spy holds its tongue, or every section the smooth scroll passes would
 * flash active on the way down. `onNavigateEnd` releases it — on `scrollend`
 * where the browser has it, otherwise when scroll events go quiet — and fires
 * exactly once per `onNavigateStart`, including when the user interrupts the
 * scroll, so a "navigating" state can never leak. Reduced motion turns the
 * smooth scroll into a jump, chosen here in JavaScript because a scripted
 * `scrollTo` ignores the `scroll-behavior` CSS that `motion-reduce:scroll-auto`
 * sets.
 *
 * Left out on purpose: Astryx's `density` (this is `size`, the house name, and
 * the two heights are Tabs' 32 and 24); its `label` prop (this
 * is `aria-label`, like every landmark here); `xstyle`. Its
 * `useOutlineFromDOM` is kept, as a sibling export.
 */

const outline = tv({ base: 'font-sans' })

// The track and the list, as one block. The track is absolute against this
// wrapper rather than a flex sibling of the list, because a flex sibling is
// `self-stretch` to the *nav*, and a nav is whatever its parent makes it — in a
// flex row beside a taller outline it is stretched, and the line ran on past
// the last item. A block wrapper is only ever as tall as the list inside it, so
// the line ends where the list does whatever happens to the nav.
//
// pl-1.25 = 5px: Tabs' 1px rule plus its 4px to the tab (Astryx draws 2).
const body = 'relative pl-1.25'

// w-px: Tabs' 1px rule (`before:h-px before:bg-surface-border`), vertical, the
// full height of the list. It is what the indicator slides along.
const track = 'absolute inset-y-0 left-0 w-px rounded-full bg-surface-border'

const indicator = tv({
  base: [
    // w-0.5 = 2px, Tabs' indicator height. It paints over the 1px track and
    // reaches 1px into the gap — the same overlap Tabs' 2px has on its 1px rule.
    'absolute top-0 left-0 w-0.5 rounded-full bg-surface-border-emphasized',
    // The active link's geometry, measured against the wrapper (the list's
    // top is the wrapper's top) and handed over as CSS variables. `top-0` plus
    // a translate rather than `top:` so the move is a composited transform —
    // Tabs' arrangement, vertical.
    'h-(--outline-indicator-height) translate-y-(--outline-indicator-top)',
    // Tailwind v4 compiles translate-y-* to the `translate` property, so that is
    // the property named here. 175ms is what Astryx's own indicator moves at.
    'transition-[translate,height] duration-fast ease-standard',
  ],
  variants: {
    // Nothing active — before the headings exist, or an `activeId` that matches
    // no item — and there is nothing to point at.
    hidden: { true: 'hidden', false: '' },
  },
})

const item = tv({
  base: [
    'flex w-full items-center rounded-md pr-2 text-left',
    // Content/Subtle at rest, Content/Primary on hover: the Breadcrumbs
    // treatment, because an outline is navigation chrome beside the page, not
    // a link inside body copy — so not the blue Action/Link pair.
    'font-sans font-normal text-content-subtle',
    'transition-colors duration-fast-min ease-standard',
    // The 10% wash TreeList's rows hover with; Figma's Surface/Overlay Subtle.
    'hover:bg-surface-overlay-subtle hover:text-content-primary',
    ...focusRing,
  ],
  variants: {
    // Tabs' two sizes: py-1 round text-base's 24px line makes 32 (Tabs'
    // min-h-8), py-0.5 round text-sm's 20px line makes 24 (Tabs' min-h-6, at
    // Tabs' small type). Astryx's `density`, on the house scale.
    size: {
      default: 'py-1 text-base',
      small: 'py-0.5 text-sm',
    },
    // 12px base (spacing/3) plus 16px (spacing/4) per step. Fixed classes
    // rather than a computed padding so each depth is a variant the token guard
    // and the Figma set can both see.
    depth: {
      0: 'pl-3',
      1: 'pl-7',
      2: 'pl-11',
      3: 'pl-15',
      4: 'pl-19',
    },
    // The active link goes semibold and Content/Emphasized, Tabs' active
    // treatment. Unlike a tab, a link here is `w-full` in a column, so the
    // heavier weight moves nothing and needs no invisible twin.
    active: {
      true: 'font-semibold text-content-emphasized',
      false: '',
    },
  },
  defaultVariants: {
    size: 'default',
    depth: 0,
    active: false,
  },
})

type OutlineVariants = VariantProps<typeof item>
export type OutlineSize = NonNullable<OutlineVariants['size']>

export type { OutlineItem, OutlineLevel }

export interface OutlineProps extends Omit<ComponentPropsWithRef<'nav'>, 'onChange'> {
  /** Ordered headings. Each `id` is the `id` of a heading element on the page. */
  items: readonly OutlineItem[]
  /** Row height: `default` is 32px at 14px type, `small` 24px at 12px — Tabs' two sizes. */
  size?: OutlineSize
  /**
   * The active heading's id. Providing it makes the outline controlled and
   * turns the built-in scroll-spy off — your own scroll logic owns the mark.
   */
  activeId?: string
  /** The active heading on first render, when uncontrolled. The spy takes over from there. */
  defaultActiveId?: string
  /** Fires when the active heading changes, from the scroll-spy or from a click. */
  onActiveChange?: (id: string) => void
  /**
   * The element the content scrolls in. Without it, the nearest scrollable
   * ancestor of the first heading, and failing that the window. Pass it when
   * the content scrolls inside a panel, drawer or split pane, so the outline
   * does not have to guess.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>
  /**
   * Height in px of a fixed header overlaying the top of the scroll root.
   * Shifts the activation line and the scroll landing by the same amount, so a
   * heading activates exactly where navigating to it puts it — below the
   * header, not underneath it. Composes with each heading's own
   * `scroll-margin-top`; it does not replace it.
   */
  offset?: number
  /**
   * Whether a click scrolls to the heading. Off, the outline still marks the
   * item, updates the hash and fires the navigate callbacks, but leaves the
   * scrolling to you — a router, or virtualized content.
   */
  scrollOnClick?: boolean
  /** Fires with the heading's id when a click begins navigating, before the scroll starts. */
  onNavigateStart?: (id: string) => void
  /**
   * Fires with the heading's id once the navigation resolves — when the scroll
   * settles, or at once when reduced motion made it a jump. Exactly once per
   * `onNavigateStart`, including when the user interrupts the scroll, so it does
   * not mean "arrived".
   */
  onNavigateEnd?: (id: string) => void
}

/** A hook's freshest callback, without resubscribing every time a caller passes a new arrow function. */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}

/**
 * The nearest ancestor that scrolls vertically, or null when it is the page.
 * `html` and `body` are skipped: their scrolling is the window's, and
 * `window.scrollTo` is the call that moves it.
 */
function scrollParentOf(node: Element | null): HTMLElement | null {
  for (let element = node?.parentElement; element && element !== document.body; element = element.parentElement) {
    const { overflowY } = getComputedStyle(element)
    if ((overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight) {
      return element
    }
  }
  return null
}

type ScrollRoot = HTMLElement | Window

/** The root's top edge in viewport pixels — the line the `offset` is measured down from. */
function rootTop(root: ScrollRoot) {
  return root instanceof Window ? 0 : root.getBoundingClientRect().top
}

/** The root's bottom edge in viewport pixels. */
function rootBottom(root: ScrollRoot) {
  return root instanceof Window ? window.innerHeight : root.getBoundingClientRect().bottom
}

/**
 * Whether the root is scrolled as far as it goes. False for a root that does
 * not scroll at all — "the end" means nothing there, and the last heading
 * must not win by default.
 */
function atScrollEnd(root: ScrollRoot) {
  const [position, viewport, extent] =
    root instanceof Window
      ? [window.scrollY, window.innerHeight, document.documentElement.scrollHeight]
      : [root.scrollTop, root.clientHeight, root.scrollHeight]
  return extent > viewport + 1 && position + viewport >= extent - 1
}

/** A heading's top edge in viewport pixels, less its own `scroll-margin-top`. */
function headingTop(heading: HTMLElement) {
  return heading.getBoundingClientRect().top - (parseFloat(getComputedStyle(heading).scrollMarginTop) || 0)
}

export function Outline({
  items,
  size = 'default',
  activeId: activeProp,
  defaultActiveId,
  onActiveChange,
  scrollContainerRef,
  offset = 0,
  scrollOnClick = true,
  onNavigateStart,
  onNavigateEnd,
  'aria-label': ariaLabel = 'Table of contents',
  className,
  style,
  ...props
}: OutlineProps) {
  const listRef = useRef<HTMLUListElement>(null)

  // TreeList's controlled/uncontrolled pair: the prop wins when given, the
  // state is only written when it is not, and the change handler fires either
  // way — but only on a change, so a click on the already-active link and a
  // scroll that lands where it started are silent.
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultActiveId ?? null)
  const activeId = activeProp !== undefined ? activeProp : uncontrolled
  const activeRef = useLatest(activeId)
  const onActiveChangeRef = useLatest(onActiveChange)
  const commit = useCallback(
    (next: string) => {
      if (next === activeRef.current) return
      if (activeProp === undefined) setUncontrolled(next)
      onActiveChangeRef.current?.(next)
    },
    [activeProp, activeRef, onActiveChangeRef],
  )

  // Item identity, not array identity: an `items` literal in a render body is
  // a new array each render, and resubscribing the spy each render would be
  // wasteful.
  const idsKey = items.map((entry) => entry.id).join('\n')
  const ids = useMemo(() => idsKey.split('\n').filter(Boolean), [idsKey])

  /** The element the content scrolls in, resolved fresh each time it is needed. */
  const resolveRoot = useCallback((): ScrollRoot => {
    const given = scrollContainerRef?.current
    if (given) return given
    const first = ids[0] ? document.getElementById(ids[0]) : null
    return scrollParentOf(first) ?? window
  }, [ids, scrollContainerRef])

  // ---- Roving tabindex ----------------------------------------------------
  // The link Tab lands on: the last one focused, else the active one, else the
  // first. `focusedId` resets whenever the active heading changes, so the tab
  // stop follows the spy until the keyboard says otherwise.
  const [focusedId, setFocusedId] = useState<string | null>(null)
  useEffect(() => setFocusedId(null), [activeId])
  const tabStopId =
    (focusedId && ids.includes(focusedId) ? focusedId : null) ??
    (activeId && ids.includes(activeId) ? activeId : null) ??
    ids[0] ??
    null

  // True from onNavigateStart to onNavigateEnd. The spy reads it.
  const navigatingRef = useRef(false)
  // The spy's measure, for a finished navigation to call once.
  const measureRef = useRef<(prefer?: string) => void>(() => {})

  // ---- Scroll-spy ---------------------------------------------------------
  const spy = activeProp === undefined
  useEffect(() => {
    if (!spy || ids.length === 0) {
      measureRef.current = () => {}
      return
    }
    const root = resolveRoot()
    let frame = 0

    /**
     * `prefer` is the heading a navigation just scrolled to. It wins while it
     * is on screen below the line — the case is a heading near the end of the
     * content, which the scroll had to clamp short of: the end-of-scroll rule
     * would mark the last heading, and the reader clicked this one.
     */
    const measure = (prefer?: string) => {
      frame = 0
      if (navigatingRef.current) return
      // Headings that are not on the page (yet) are left out rather than given
      // a fake position: an absent heading in the middle of the list must not
      // block the ones after it, nor count as reached.
      const present: { id: string; top: number }[] = []
      for (const id of ids) {
        const heading = document.getElementById(id)
        if (heading) present.push({ id, top: headingTop(heading) })
      }
      const line = rootTop(root) + offset
      const preferred = prefer ? present.find((entry) => entry.id === prefer) : undefined
      if (preferred && preferred.top > line + 1 && preferred.top < rootBottom(root)) {
        commit(preferred.id)
        return
      }
      const index = pickActive(
        present.map((entry) => entry.top),
        line,
        atScrollEnd(root),
      )
      if (index >= 0) commit(present[index].id)
    }
    measureRef.current = measure
    const schedule = () => {
      // A navigation's own scroll events are not the reader's; the measure at
      // its end is the one that counts.
      if (navigatingRef.current) return
      if (!frame) frame = requestAnimationFrame(() => measure())
    }

    measure()
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      measureRef.current = () => {}
    }
  }, [spy, ids, offset, resolveRoot, commit])

  // ---- Click --------------------------------------------------------------
  const onNavigateStartRef = useLatest(onNavigateStart)
  const onNavigateEndRef = useLatest(onNavigateEnd)

  const navigate = useCallback(
    (id: string) => {
      commit(id)
      navigatingRef.current = true
      onNavigateStartRef.current?.(id)

      let ended = false
      const end = () => {
        if (ended) return
        ended = true
        navigatingRef.current = false
        // Where did the scroll actually stop? Landed, clamped, or interrupted.
        measureRef.current(id)
        onNavigateEndRef.current?.(id)
      }

      // The hash, without the browser's own jump — that would ignore `offset`
      // and land the heading under the header.
      if (typeof history !== 'undefined' && window.location.hash !== `#${id}`) {
        history.pushState(null, '', `#${id}`)
      }

      const heading = document.getElementById(id)
      if (!scrollOnClick || !heading) {
        end()
        return
      }

      const root = resolveRoot()
      const delta = headingTop(heading) - rootTop(root) - offset
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // A jump, or nothing to move: the navigation resolves on the next frame,
      // after the browser has applied the scroll.
      if (reduced || Math.abs(delta) < 1) {
        if (root instanceof Window) window.scrollBy({ top: delta, behavior: 'auto' })
        else root.scrollBy({ top: delta, behavior: 'auto' })
        requestAnimationFrame(end)
        return
      }

      // `scrollend` where the browser has it; otherwise quiet scroll events. The
      // timer is the fallback for a scroll the browser clamps to nothing — a
      // heading below the fold of a root that is already scrolled to its end
      // fires no scroll events at all.
      // Feature-detected once. (Kept out of the handler: TypeScript treats
      // `'onscrollend' in window` as a narrowing, and `window` is `never` after it.)
      const hasScrollEnd = 'onscrollend' in window
      let quiet = 0
      let fallback = 0
      const cleanup = () => {
        root.removeEventListener('scrollend', settle)
        root.removeEventListener('scroll', onScroll)
        clearTimeout(quiet)
        clearTimeout(fallback)
      }
      const settle = () => {
        cleanup()
        end()
      }
      const onScroll = () => {
        clearTimeout(fallback)
        if (hasScrollEnd) return
        clearTimeout(quiet)
        quiet = window.setTimeout(settle, 120)
      }
      root.addEventListener('scrollend', settle)
      root.addEventListener('scroll', onScroll, { passive: true })
      fallback = window.setTimeout(settle, 400)

      if (root instanceof Window) window.scrollBy({ top: delta, behavior: 'smooth' })
      else root.scrollBy({ top: delta, behavior: 'smooth' })
    },
    [commit, offset, onNavigateEndRef, onNavigateStartRef, resolveRoot, scrollOnClick],
  )

  // ---- Indicator ----------------------------------------------------------
  const [geometry, setGeometry] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const link = list.querySelector<HTMLElement>('a[aria-current]')
      setGeometry((previous) => {
        if (!link) return null
        const next = { top: link.offsetTop, height: link.offsetHeight }
        return previous && previous.top === next.top && previous.height === next.height ? previous : next
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [activeId, idsKey, size])

  // ---- Keys ---------------------------------------------------------------
  // On the list, so one handler serves every link. Arrows and Home/End move
  // focus and wrap, Tabs' way; Space follows the link, which an anchor does
  // not do on its own (Enter already does). Everything else is the browser's.
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLUListElement>) => {
      const list = listRef.current
      if (!list) return
      const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('a[href]'))
      const index = links.indexOf(document.activeElement as HTMLAnchorElement)
      if (index < 0) return
      let next: number
      switch (event.key) {
        case 'ArrowDown':
          next = (index + 1) % links.length
          break
        case 'ArrowUp':
          next = (index - 1 + links.length) % links.length
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = links.length - 1
          break
        case ' ':
          event.preventDefault()
          navigate(ids[index])
          return
        default:
          return
      }
      event.preventDefault()
      links[next].focus()
    },
    [ids, navigate],
  )

  const indicatorStyle = geometry
    ? ({
        '--outline-indicator-top': `${geometry.top}px`,
        '--outline-indicator-height': `${geometry.height}px`,
      } as CSSProperties)
    : undefined

  return (
    <nav aria-label={ariaLabel} className={cn(outline(), className)} style={style} {...props}>
      <div className={body}>
        <span aria-hidden className={track}>
          <span className={indicator({ hidden: geometry === null })} style={indicatorStyle} />
        </span>
        {/* min-w-0 so a long label truncates the list, not the outline. */}
        <ul ref={listRef} className="flex min-w-0 flex-col gap-0.5" onKeyDown={onKeyDown}>
          {items.map((entry) => (
            <li key={entry.id}>
              <OutlineLink
                id={entry.id}
                size={size}
                depth={depthOf(entry.level)}
                active={entry.id === activeId}
                tabStop={entry.id === tabStopId}
                onFocus={setFocusedId}
                onNavigate={navigate}
              >
                {entry.label}
              </OutlineLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

interface OutlineLinkProps {
  id: string
  size: OutlineSize
  depth: ReturnType<typeof depthOf>
  active: boolean
  /** Whether this is the one link in the tab order. */
  tabStop: boolean
  onFocus: (id: string) => void
  onNavigate: (id: string) => void
  children: OutlineItem['label']
}

/**
 * One heading link. A plain `<a href="#id">` rather than `useRender`: a
 * same-page hash never goes through a router, so there is nothing to swap the
 * element for — and a bare anchor is what "a `<nav>` of anchors" means.
 */
function OutlineLink({ id, size, depth, active, tabStop, onFocus, onNavigate, children }: OutlineLinkProps) {
  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // A modified click is the user asking for a new tab; let the browser have it.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      event.preventDefault()
      onNavigate(id)
    },
    [id, onNavigate],
  )

  return (
    <a
      href={`#${id}`}
      // "location", not "page": the link points within the page, not at it.
      // Spread only when set — an explicit undefined is still an attribute to
      // some prop mergers, and this way the DOM is exactly what it says.
      {...(active ? { 'aria-current': 'location' as const } : {})}
      className={item({ size, depth, active })}
      tabIndex={tabStop ? 0 : -1}
      onFocus={() => onFocus(id)}
      onClick={onClick}
    >
      {children}
    </a>
  )
}
