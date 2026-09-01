import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'

/**
 * TopBar — the page header that sits above the content, beside a `SideNav`.
 *
 * Mirrors the Figma component set "Top Bar" (`40004511:34845`), whose `Type`
 * axis is Default | Breadcrumbs. Three slots, laid out the way the file draws
 * them:
 *
 *     <TopBar
 *       breadcrumbs={<Breadcrumbs>…</Breadcrumbs>}
 *       search={<Autocomplete items={…} placeholder="Search…" />}
 *       actions={<><Button …/><ThemeControl … /></>}
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
 * **`Type` is not a prop, because `breadcrumbs` already says it.** Figma models
 * the two arrangements as a variant *and* carries a redundant `Breadcrumbs`
 * boolean beside it. Here the presence of the slot is the switch — the
 * library's rule about deriving a variant from a value that already says it,
 * and it collapses two Figma properties into one.
 *
 * **The bottom rule is a `border-b`, not a `Divider`.** Figma draws it as a
 * Divider instance spanning the full width, and the root additionally carries a
 * `strokeBottomWeight` binding with no stroke paint behind it — a dead binding,
 * and evidence the border is what was meant. A real `Divider` renders
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
   * The trail, usually a `Breadcrumbs`. Present is Figma's `Type=Breadcrumbs`;
   * absent is `Type=Default`, where the search moves to the left edge.
   */
  breadcrumbs?: ReactNode
  /**
   * The search field, usually an `Autocomplete`. A fixed 16rem — Figma draws
   * 259px, which is 3px off `width/w-64` and reads as hand-sizing rather than a
   * decision.
   */
  search?: ReactNode
  /** The controls at the end — a `Button`, a `ThemeControl`. Figma's Action Items. */
  actions?: ReactNode
  className?: string
}

export function TopBar({ breadcrumbs, search, actions, className, ...props }: TopBarProps) {
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
      {breadcrumbs ? (
        <div className="flex min-w-0 flex-1 items-center">{breadcrumbs}</div>
      ) : null}

      {search ? <div className="w-64 shrink-0">{search}</div> : null}

      {/*
        Always rendered, even with nothing in it. It is the right-hand half of
        the pair of `flex-1` ends that centres the search when breadcrumbs are
        present — the same arrangement TopNav uses, and Figma's FILL / FIXED /
        FILL. Dropping it when `actions` is empty would slide the search back to
        the left and quietly change the layout.
      */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{actions}</div>
    </header>
  )
}

TopBar.displayName = 'TopBar'
