import { Children, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Button } from '../Button'

/**
 * Carousel — steps through a set of items one screen at a time, with pagination
 * for moving between them.
 *
 * Mirrors the Figma component `Carousel` (node `40004591:43045`) on
 * `↪ Carousel (In Progress)`, together with `Carousel - Pagination`
 * (`40004379:66099`) and `Carousel Pagination Button` (`40004379:66086`) from the
 * pagination page. Those last two ship as internal parts rather than exports:
 * Figma models them separately because a canvas has to draw a dot somewhere, but
 * nothing outside a carousel has a use for a 24px dot that grows into a pill.
 *
 * ## It needed no animation library, and that is the headline
 *
 * The root `CLAUDE.md` has listed Carousel since the motion tokens landed as
 * "the one plausible candidate left on the roadmap" for a JS animation library —
 * the last thing that might want FLIP, drag or springs. It does not. Astryx's
 * own carousel was read at the DOM level rather than from its docs, and its
 * scroll container is `overflow-x: auto` with `scroll-behavior: smooth` and
 * nothing else: the browser owns the easing, the momentum and the snap.
 *
 * That is the second time this answer has come back the same shape. `Tabs` was
 * the other candidate, and `Tabs.Indicator` turned out to publish the geometry
 * the slide needed, so the animation was a CSS transition. **Check whether the
 * platform already does the thing before assuming it needs JavaScript** is now a
 * rule with two cases behind it, and no motion library in the dependency list.
 *
 * ## Where Figma and Astryx disagree, and who wins
 *
 * They are describing two different components under one name. Astryx's is a
 * continuous strip — several items visible at once, buttons floating over the
 * track on an anchor layer, gradient fades at both edges, no dots. Figma's is a
 * gallery: one full-width item per view, dots and arrows in a row *below* the
 * track, no fade.
 *
 * **Figma decides what it looks like; Astryx decides how it works.** So the
 * layout, the dots and the button placement are Figma's, and the scroll engine
 * and the whole ARIA contract are Astryx's, copied from their rendered output
 * rather than paraphrased. `hasEdgeFade` is not ported — the dots and arrows
 * already say there is more, and a fade over a full-bleed image is ink that
 * means nothing here.
 *
 * ## Accessibility is the APG carousel pattern, without auto-rotation
 *
 * The root is a labelled `region` carrying `aria-roledescription="carousel"`,
 * each item is a `group` named "Slide N of M", and the scroll container is a tab
 * stop so a keyboard can pan it with the arrow keys. `aria-label` is **required**
 * rather than defaulted: Astryx falls back to the string `'Carousel'`, and a
 * region announced as "Carousel, carousel" tells a screen-reader user nothing
 * they could not already guess. `Popover`'s `label` is the precedent.
 *
 * There is no auto-advance and there will not be one. It is one of Astryx's own
 * "don't"s, it is the reason the APG pattern carries a pause button, and a
 * carousel that moves on its own takes the timing away from the reader.
 */

/**
 * The gap between items. Figma draws `gap-2`, and the scale is Astryx's own
 * `gap` prop trimmed to the steps a carousel actually uses.
 *
 * Written out in full, and that is not stylistic. Tailwind finds classes by
 * scanning source text, so `` `gap-${n}` `` generates no CSS whatsoever — and the
 * failure is silent, because a missing gap looks like a design decision rather
 * than a broken class. `focus.ts`, `AspectRatio` and `BentoGrid` all carry the
 * same warning from the same cause.
 */
const GAP = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
} as const

const viewport = tv({
  base: [
    'flex w-full overflow-x-auto',
    // The browser owns the animation. `scroll-smooth` is what makes a
    // `scrollTo` from a button or a dot glide instead of jump, and it is the
    // whole of this component's motion.
    //
    // `motion-reduce:scroll-auto` is required rather than belt-and-braces.
    // Section 5 of theme.css honours prefers-reduced-motion globally by clamping
    // animation-duration and transition-duration to 1ms — and `scroll-behavior`
    // is neither of those. It is the one piece of motion in this library the
    // global rule cannot reach, so the component turns it off itself.
    'scroll-smooth motion-reduce:scroll-auto',
    // The container is a tab stop (see `tabIndex` below), so it has to show
    // focus. axe's `scrollable-region-focusable` requires the tab stop; the ring
    // is what makes it honest.
    ...focusRing,
    // Figma's `overflow-clip`, ported — and it is the first time. The root
    // CLAUDE.md records eleven components where that property was deliberately
    // dropped, because the focus ring paints outside the component and clipping
    // would slice it off. Here the clip *is* the component: a carousel with no
    // overflow is a row.
    //
    // The cost is real and is paid with `py-1`. CSS will not let `overflow-x:
    // auto` sit beside `overflow-y: visible` — the used value becomes `auto` on
    // both axes — so a focus ring on something inside a slide would be clipped
    // top and bottom. The ring reaches 4px, which is exactly `py-1`, so the
    // padding buys it back. A card inside a slide can take focus and keep its
    // ring.
    'py-1',
    // The dots and the arrows are the affordance; a scrollbar under a gallery is
    // a second, uglier one saying the same thing. Firefox and WebKit spell it
    // differently and both are needed.
    '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  ],

  variants: {
    /**
     * Scroll-snap. Figma's carousel is one full-width item per view, which only
     * reads correctly if each item lands on the edge — so this defaults **on**,
     * the opposite of Astryx's `hasSnap`, whose default strip is continuous.
     */
    snap: {
      true: 'snap-x snap-mandatory',
      false: '',
    },
  },

  defaultVariants: {
    snap: true,
  },
})

/**
 * One slide.
 *
 * `shrink-0` on both, because a flex item defaults to shrinking and a track of
 * squashed slides is the failure mode this component exists to avoid.
 *
 * The width is the whole of the `layout` decision, and it cannot be derived.
 * CSS gives no way to say "full width unless the child asked for one": a
 * content-sized wrapper round a `w-full` child — which is what `AspectRatio`
 * is — resolves circularly and collapses to nothing, which AspectRatio's own
 * record already warns about. So the caller has to say, and `hug` / `fill` is
 * the word pair `Tabs` and `SegmentedControl` already use for exactly this
 * question.
 */
const slide = tv({
  base: 'shrink-0',
  variants: {
    layout: {
      // Figma's gallery: one item per view, so the slide is the viewport.
      fill: 'w-full',
      // Astryx's strip: the child brought its own width, and forcing one here
      // would throw it away.
      hug: '',
    },
    snap: {
      true: 'snap-start',
      false: '',
    },
  },
  defaultVariants: {
    layout: 'fill',
    snap: true,
  },
})

/**
 * The dot's hit box: 24x24, growing to 36x24 when it is the current slide, with
 * an 8px radius that the focus ring inherits.
 *
 * Figma draws the growth on the *indicator* inside, but the box has to grow with
 * it or the pill would overflow a 24px button. Both numbers are the Figma set's,
 * measured from `width/w-6` and `width/w-9`.
 */
const dot = tv({
  base: [
    'relative flex shrink-0 cursor-pointer items-center justify-center',
    'h-6 rounded-md',
    ...focusRing,
    'transition-[width] duration-fast ease-standard',
  ],
  variants: {
    current: {
      true: 'w-9',
      false: 'w-6',
    },
  },
  defaultVariants: {
    current: false,
  },
})

/**
 * The mark inside the dot: a 12px circle that becomes a 24x12 pill on the
 * current slide.
 *
 * The border is on every state, not just the unselected one. On the selected
 * pill it sits on `Surface/Background Emphasized` — the same token as the fill —
 * so it is invisible in both themes and contributes nothing but a stable size,
 * which is what stops the mark jumping by 2px as it is selected.
 *
 * 175ms on `ease-standard` is the pair `Tabs` transitions its own indicator at,
 * and Astryx's number for the same move.
 */
const indicator = tv({
  base: [
    'h-3 rounded-full border border-surface-border-emphasized',
    'transition-[width,background-color,box-shadow] duration-fast ease-standard',
  ],
  variants: {
    current: {
      true: 'w-6 bg-surface-background-emphasized',
      // Hover lives here rather than on the button so it can be scoped to the
      // uncurrent dot: Figma draws no hover for `Selected=True`, and painting
      // one would move the selected mark off its own token.
      false: [
        'w-3 bg-surface-background-primary',
        'group-hover:bg-surface-background-subtle group-hover:shadow-low',
      ],
    },
  },
  defaultVariants: {
    current: false,
  },
})

export type CarouselGap = keyof typeof GAP

type SlideVariants = VariantProps<typeof slide>
export type CarouselLayout = NonNullable<SlideVariants['layout']>

/**
 * Astryx's `CarouselHandle`, same five methods. It is the escape hatch for a
 * caller that has to drive the carousel from something outside it — a thumbnail
 * strip, a "start over" button at the end of a flow.
 */
export interface CarouselHandle {
  /** Scroll to the next slide. Wraps to the first when `hasLoop` is set. */
  scrollNext: () => void
  /** Scroll to the previous slide. Wraps to the last when `hasLoop` is set. */
  scrollPrev: () => void
  /** Scroll to a slide by its zero-based index. */
  scrollTo: (index: number) => void
  /** Whether `scrollNext` would move. Always true under `hasLoop`. */
  canScrollNext: () => boolean
  /** Whether `scrollPrev` would move. Always true under `hasLoop`. */
  canScrollPrev: () => boolean
}

export interface CarouselProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'aria-label'> {
  /**
   * The items. Each child is wrapped in a slide — a `group` named "Slide N of
   * M" — so pass the content itself and let the carousel do the labelling.
   */
  children: ReactNode
  /**
   * Required: names the region, which is announced as "<label>, carousel".
   *
   * Astryx defaults this to `'Carousel'`; here it is required, because a region
   * whose name repeats its own role description says nothing. Describe the
   * contents — "Featured products", "Team members".
   */
  'aria-label': string
  /**
   * The dots and the previous/next buttons below the track. Figma's
   * `hasPagination`, same spelling and same default.
   */
  hasPagination?: boolean
  /**
   * Snap each item to the start edge. On by default, because Figma's carousel
   * shows one full item at a time — turn it off for a continuous strip that a
   * reader pans freely, which is Astryx's default shape.
   */
  hasSnap?: boolean
  /**
   * Wrap around: next at the last slide goes to the first, previous at the first
   * goes to the last. The buttons then never disable.
   */
  hasLoop?: boolean
  /**
   * How wide a slide is. `fill` makes each one the width of the carousel, which
   * is Figma's one-item-per-view gallery; `hug` lets each child keep the width
   * it brought, which is Astryx's continuous strip of cards.
   *
   * The same word pair `Tabs` and `SegmentedControl` use, asking the same
   * question. It has to be a prop rather than something derived from the
   * children: CSS cannot express "full width unless the child asked for one".
   */
  layout?: CarouselLayout
  /** Space between items, on the spacing scale. Figma draws `2` (8px). */
  gap?: CarouselGap
  /** Astryx's imperative handle, for driving the carousel from outside it. */
  handleRef?: Ref<CarouselHandle>
  className?: string
}

export function Carousel({
  children,
  hasPagination = true,
  hasSnap = true,
  hasLoop = false,
  layout = 'fill',
  gap = 2,
  handleRef,
  className,
  ...props
}: CarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)

  const items = Children.toArray(children)
  const count = items.length

  /**
   * Which slide is showing.
   *
   * An `IntersectionObserver` rather than scroll arithmetic, because the slide
   * can change in six ways — an arrow, a dot, a trackpad swipe, shift+wheel, the
   * arrow keys on the focused container, and a snap settling after a flick — and
   * only one of those is a scroll position this component chose. Measuring what
   * is actually on screen answers all six with the same code, and it does not
   * have to re-derive the snap points to do it.
   *
   * The threshold list is what makes "most visible" meaningful: with a single
   * threshold the callback fires only at the boundary and a half-scrolled
   * carousel reports whichever slide crossed it last.
   */
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const ratios = new Map<Element, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio)

        let best = -1
        let bestIndex = 0
        // Walk the DOM order rather than the entry list, so a tie between two
        // equally visible slides always resolves to the earlier one instead of
        // to whichever the observer happened to report first.
        Array.from(node.children).forEach((child, index) => {
          const ratio = ratios.get(child) ?? 0
          if (ratio > best) {
            best = ratio
            bestIndex = index
          }
        })

        setCurrent(bestIndex)
      },
      { root: node, threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    for (const child of Array.from(node.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [count])

  const scrollTo = useCallback((index: number) => {
    const node = viewportRef.current
    const target = node?.children[index]
    if (!node || !target) return

    // `scrollTo` on the container rather than `scrollIntoView` on the item.
    // `scrollIntoView` walks up and scrolls every ancestor that can scroll, so a
    // carousel inside a scrolling page drags the whole page sideways and often
    // vertically too. This moves exactly one element.
    node.scrollTo({
      left: (target as HTMLElement).offsetLeft - node.offsetLeft,
      behavior: 'smooth',
    })
  }, [])

  const canPrev = hasLoop ? count > 1 : current > 0
  const canNext = hasLoop ? count > 1 : current < count - 1

  const goPrev = useCallback(() => {
    if (!canPrev) return
    scrollTo(current === 0 ? count - 1 : current - 1)
  }, [canPrev, current, count, scrollTo])

  const goNext = useCallback(() => {
    if (!canNext) return
    scrollTo(current === count - 1 ? 0 : current + 1)
  }, [canNext, current, count, scrollTo])

  useImperativeHandle(
    handleRef,
    () => ({
      scrollNext: goNext,
      scrollPrev: goPrev,
      scrollTo,
      canScrollNext: () => canNext,
      canScrollPrev: () => canPrev,
    }),
    [goNext, goPrev, scrollTo, canNext, canPrev],
  )

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      <div
        ref={viewportRef}
        // The scroll container is a tab stop, which is Astryx's shape and the
        // APG's: a region you can only pan by dragging is unreachable from a
        // keyboard, and axe fails it as `scrollable-region-focusable`. With the
        // tabindex the browser's own arrow-key panning does the rest, so there
        // is no key handler here at all.
        tabIndex={0}
        className={cn(viewport({ snap: hasSnap }), GAP[gap])}
      >
        {items.map((item, index) => (
          <div
            // The index is the key because these are slides, not records: the
            // carousel does not own the items and has nothing stabler to use.
            // eslint-disable-next-line react-x/no-array-index-key
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${count}`}
            className={slide({ layout, snap: hasSnap })}
          >
            {item}
          </div>
        ))}
      </div>

      {hasPagination && (
        <div className="flex w-full items-center">
          {/* px-3 is Figma's, and it lines the first dot up with the content
              inside a slide rather than with the slide's own edge. */}
          <div className="flex min-w-px flex-1 items-center px-3">
            {items.map((_, index) => (
              <button
                // eslint-disable-next-line react-x/no-array-index-key
                key={index}
                type="button"
                // `group` so the indicator inside can scope its own hover — the
                // mark is what changes, and only when it is not the current one.
                className={cn('group', dot({ current: index === current }))}
                aria-label={`Slide ${index + 1}`}
                // `aria-current="true"`, not `aria-selected`. These are buttons,
                // not tabs: `aria-selected` is only meaningful inside a
                // `tablist`, and a `tablist` here would fight the scroll
                // container for the same keyboard.
                aria-current={index === current ? 'true' : undefined}
                onClick={() => scrollTo(index)}
              >
                <span className={indicator({ current: index === current })} />
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Previous slide"
              disabled={!canPrev}
              onClick={goPrev}
            />
            <Button
              appearance="ghost"
              startIcon={ArrowRight}
              aria-label="Next slide"
              disabled={!canNext}
              onClick={goNext}
            />
          </div>
        </div>
      )}
    </div>
  )
}

Carousel.displayName = 'Carousel'
