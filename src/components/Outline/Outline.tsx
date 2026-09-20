import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ComponentPropsWithRef, MouseEvent, RefObject } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { depthOf, pickActive, type OutlineItem, type OutlineLevel } from './scrollspy'

/**
 * Outline — the headings on this page, with the one in view marked.
 *
 * A table of contents for documentation, help centers and long settings pages:
 * a `<nav>` of same-page links, indented by heading level, with a 2px track
 * down the left edge and a 2px indicator that slides to the active heading as
 * the page scrolls. Astryx's `Outline`, read at the DOM.
 *
 * Mirrors the Figma component set "Outline" and the "Outline Item" set on
 * `↪ Outline` — node ids in `CLAUDE.md`.
 *
 *     <Outline items={[{ id: 'install', label: 'Installation' }, …]} />
 *
 * **It is a `<nav>` of anchors, not a widget.** Astryx makes its outline a
 * single Tab stop and moves between headings with the arrow keys. This one
 * follows the Nav record instead: every link is its own Tab stop, the active one
 * carries `aria-current="location"`, and there is no key handling to maintain.
 * The same rule that keeps Breadcrumbs and SideNav plain — a set of links is a
 * landmark, and Tab already walks it.
 *
 * **The indicator slides, and it costs no JavaScript animation.** Tabs' idiom
 * turned on its side: a layout effect reads the active link's `offsetTop` and
 * `offsetHeight` and hands them to CSS as `--outline-indicator-top` and
 * `--outline-indicator-height`; one element transitions `translate` and
 * `height`. The list is `relative`, so the link's offsets are measured against
 * it, and the track — which the indicator paints over — starts at the same top
 * edge in the flex row. A `ResizeObserver` on the list re-measures when a label
 * wraps or the outline is resized.
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
 * the two heights are NavItem's 40 and TreeList's 32); its `label` prop (this
 * is `aria-label`, like every landmark here); `xstyle`. Its
 * `useOutlineFromDOM` is kept, as a sibling export.
 */

const outline = tv({
  // gap-0.5 = 2px between the track and the list, as Astryx draws it; with the
  // 2px track that puts the list 4px in, so the indicator at left-0 of the
  // track sits exactly on it.
  base: 'flex gap-0.5 font-sans',
})

// w-0.5 = 2px (border-width/border-2). The track is the rule the indicator
// slides along; `relative` so the indicator is positioned against it.
const track = 'relative w-0.5 shrink-0 self-stretch rounded-full bg-surface-border'

const indicator = tv({
  base: [
    'absolute top-0 left-0 w-0.5 rounded-full bg-surface-border-emphasized',
    // The active link's geometry, measured against the list and handed over as
    // CSS variables. `top-0` plus a translate rather than `top:` so the move is
    // a composited transform — Tabs' arrangement, vertical.
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
    'font-sans text-base font-normal text-content-subtle',
    'transition-colors duration-fast-min ease-standard',
    // The 10% wash TreeList's rows hover with; Figma's Surface/Overlay Subtle.
    'hover:bg-surface-overlay-subtle hover:text-content-primary',
    ...focusRing,
  ],
  variants: {
    // The rows sit on the 24px text-base line: py-2 makes 40 (NavItem's
    // height), py-1 makes 32 (TreeList's). Astryx's `density`, on the house
    // scale.
    size: {
      default: 'py-2',
      small: 'py-1',
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
  /** Row height: `default` is 40px, `small` 32px. Same 14px type. */
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

  // True from onNavigateStart to onNavigateEnd. The spy reads it.
  const navigatingRef = useRef(false)

  // ---- Scroll-spy ---------------------------------------------------------
  const spy = activeProp === undefined
  useEffect(() => {
    if (!spy || ids.length === 0) return
    const root = resolveRoot()
    let frame = 0

    const measure = () => {
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
      const index = pickActive(
        present.map((entry) => entry.top),
        rootTop(root) + offset,
      )
      if (index >= 0) commit(present[index].id)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
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

  const indicatorStyle = geometry
    ? ({
        '--outline-indicator-top': `${geometry.top}px`,
        '--outline-indicator-height': `${geometry.height}px`,
      } as CSSProperties)
    : undefined

  return (
    <nav aria-label={ariaLabel} className={cn(outline(), className)} style={style} {...props}>
      <span aria-hidden className={track}>
        <span className={indicator({ hidden: geometry === null })} style={indicatorStyle} />
      </span>
      {/* min-w-0 so a long label truncates the list, not the outline. */}
      <ul ref={listRef} className="relative flex min-w-0 flex-1 flex-col gap-0.5">
        {items.map((entry) => (
          <li key={entry.id}>
            <OutlineLink
              id={entry.id}
              size={size}
              depth={depthOf(entry.level)}
              active={entry.id === activeId}
              onNavigate={navigate}
            >
              {entry.label}
            </OutlineLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface OutlineLinkProps {
  id: string
  size: OutlineSize
  depth: ReturnType<typeof depthOf>
  active: boolean
  onNavigate: (id: string) => void
  children: OutlineItem['label']
}

/**
 * One heading link. A plain `<a href="#id">` rather than `useRender`: a
 * same-page hash never goes through a router, so there is nothing to swap the
 * element for — and a bare anchor is what "a `<nav>` of anchors" means.
 */
function OutlineLink({ id, size, depth, active, onNavigate, children }: OutlineLinkProps) {
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
      onClick={onClick}
    >
      {children}
    </a>
  )
}
