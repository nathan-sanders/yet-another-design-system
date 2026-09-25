import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'

/**
 * TopBar — the page header that sits above the content, beside a `SideNav`.
 *
 * Mirrors the Figma component "Top Bar" (`40005672:9442`): three slots,
 * `Start`, `Middle` and `End`, each with a `Show …` boolean beside it. Here a
 * slot is shown when you pass it:
 *
 *     <TopBar
 *       start={<Breadcrumbs>…</Breadcrumbs>}
 *       middle={<TopBar.Search><Autocomplete … /></TopBar.Search>}
 *       end={<><Button …/><ThemeControl … /></>}
 *     />
 *
 * **It belongs with `SideNav`, not with `TopNav`.** Nathan's rule, and the
 * layout agrees: this bar and `TopNav` are both full-width strips at the top of
 * the page, and stacking two of them buys a second row of chrome and no
 * information. `TopNav` already has a `utilities` slot for the things that would
 * otherwise go here. Nothing enforces the pairing — a `<header>` over a
 * `<nav>` is legal and occasionally what you want — but if you are reaching for
 * both, put the actions in `TopNav` instead.
 *
 * **Different tier from the navigation components.** `SideNav` and `TopNav`
 * draw from `--nav-*`, which does not follow `.dark`. This one is ordinary
 * semantic tokens, because it is part of the page rather than part of the
 * navigation surface: it sits on whatever is behind it and follows the theme
 * like everything else.
 *
 * **The slots are named for where they sit, not for what goes in them.** The
 * file replaced its `Type` = Default | Breadcrumbs variant with three generic
 * slots, so the bar no longer knows a trail from a title or a search from a
 * segmented control. What the search used to get for free — the wash — now
 * belongs to the content: wrap it in `TopBar.Search`, which is Figma's `Search`
 * frame inside the Middle slot.
 *
 * **The bottom rule is a `border-b`, not a `Divider`.** Figma draws it as a
 * Divider instance spanning the full width. A real `Divider` renders
 * `role="separator"`, which under a toolbar is chrome announced as structure.
 * Same call `Tabs` and `Accordion` both made.
 *
 * **A `<header>`, so it is the page's banner landmark.** With `SideNav`'s
 * `<nav>` beside it that gives a screen reader two named regions and a sensible
 * skip target. Only one `<header>` should be at the top level of a page; nest
 * it inside `<main>` or a `<section>` and it stops being a banner, which is the
 * escape hatch if a page needs two.
 */

export interface TopBarProps
  extends Omit<ComponentPropsWithRef<'header'>, 'children' | 'className'> {
  /**
   * The leading content, usually a `Breadcrumbs`. Figma's Start Slot; leaving
   * it out is `Show Start Slot` off, and the middle moves to the left edge.
   */
  start?: ReactNode
  /**
   * The centred content, usually a search in a `TopBar.Search`. Figma's Middle
   * Slot.
   *
   * The slot fills the space it is given up to **600px** (`max-w-150` — 150
   * spacing steps, the same idiom as the `max-w-100` and `max-w-200` elsewhere
   * in the library). With `start` present the two ends are equal `flex-1`s, so
   * the middle is centred by symmetry rather than by a rule.
   */
  middle?: ReactNode
  /** The trailing controls — a `Button`, a `ThemeControl`. Figma's End Slot. */
  end?: ReactNode
  className?: string
}

export function TopBar({ start, middle, end, className, ...props }: TopBarProps) {
  return (
    <header
      className={cn(
        // min-h-14 = height/h-14 (56px), p-3 = spacing/3 (12px), gap-2 =
        // spacing/2. A min-height so a taller action does not clip.
        'flex min-h-14 w-full items-center gap-2 p-3 font-sans',
        // No background: Figma gives the root no fill, so the bar takes whatever
        // surface it is dropped on and only the rule below it is chrome.
        'border-b border-surface-border',
        className,
      )}
      {...props}
    >
      {start ? <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div> : null}

      {middle ? (
        // Grows into whatever the two ends leave, capped at 600px. Three
        // `flex-1` children make the ends equal, so the cap keeps it centred
        // rather than letting it swallow the bar on a wide screen.
        <div className="flex min-w-0 max-w-150 flex-1 items-center gap-2 *:min-w-0 *:flex-1">
          {middle}
        </div>
      ) : null}

      {/*
        Always rendered, even with nothing in it. It is the right-hand half of
        the pair of `flex-1` ends that centres the middle when `start` is
        present — Figma's End Slot, which is the one FILL child. Dropping it
        when `end` is empty would slide the middle back to the left and quietly
        change the layout.
      */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{end}</div>
    </header>
  )
}

TopBar.displayName = 'TopBar'

export interface TopBarSearchProps extends Omit<ComponentPropsWithRef<'div'>, 'className'> {
  className?: string
}

/**
 * Figma's `Search` frame: the wash a search wears in the Middle slot.
 *
 * A ghost field on a bare bar has no edges, so "centred" is something you have
 * to take on trust — the `surface-overlay-subtle` fill (10% of the neutral, the
 * token the ghost hover uses) and `rounded-md` (8) give it a boundary you can
 * see sitting between the start and the end. Without a `start` there is no
 * centre to demonstrate, which is why the file's bars with no trail pass the
 * field bare.
 */
function TopBarSearch({ className, ...props }: TopBarSearchProps) {
  return <div className={cn('rounded-md bg-surface-overlay-subtle', className)} {...props} />
}

TopBarSearch.displayName = 'TopBar.Search'
TopBar.Search = TopBarSearch
