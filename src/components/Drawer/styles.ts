import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { backdrop } from '../Dialog/styles'

/**
 * The scrim: Dialog's, reused rather than copied — Base UI's `Drawer.Backdrop`
 * is a Dialog backdrop with a swipe progress on it, and `surface-drop-shadow`
 * is the one token that darkens in both themes (Dialog's record has the
 * measurement). The one addition is the swipe: as the user drags the drawer
 * toward its edge the scrim thins with it, and while they are dragging the
 * transition is off so it follows the finger.
 */
export const drawerBackdrop = () =>
  cn(backdrop(), 'opacity-[calc(1-var(--drawer-swipe-progress,0))]', 'data-swiping:transition-none')

/**
 * Where in the viewport the popup sits. `overflow-clip`, MobileNav's finding
 * one step on: a popup translated off-screen for its entrance must not
 * create a scrollbar on the viewport it is entering — and `hidden` is still a
 * scroll container, so a `focus()` into the popup while it is still sliding
 * in scrolls the viewport sideways to reach it and leaves every level of a
 * stack 36px off for good. `clip` cannot be scrolled by anything. Non-modal,
 * the viewport lets pointer events through to the page and only the popup
 * takes them back.
 */
export const drawerViewport = tv({
  base: [
    'fixed inset-0 flex overflow-clip',
    // Behind a nested drawer, what the pointer meets on the peeking edge of the
    // level behind is this viewport, and a press on it goes back a level: say
    // so. The popup resets it, so its own controls keep their cursors.
    'data-nested:cursor-pointer',
  ],
  variants: {
    side: {
      right: 'items-stretch justify-end',
      left: 'items-stretch justify-start',
      bottom: 'items-end justify-center',
    },
    modal: {
      true: '',
      false: 'pointer-events-none',
    },
  },
  defaultVariants: {
    side: 'right',
    modal: true,
  },
})

/**
 * The surface.
 *
 * **Flush to the viewport edge, rounded on the inner corners only.** The
 * shell's docked rule: a thing hard against the window edge squares the edge
 * it touches and keeps the corners that face the page — the MobileNav sheet is
 * exactly this at the bottom. An 8px-inset drawer would be a second card
 * floating on a scrim, which is a Dialog.
 *
 * **The bleed is a pseudo-element, not a bigger box.** A swipe in the
 * *wrong* direction — pulling a right drawer toward the page — is damped by
 * Base UI to the square root of the distance, so a 900px pull moves the
 * drawer 30px and would show 30px of scrim between it and the edge. Base UI's
 * demos cover that by making the popup 3rem wider than it looks, with a
 * negative margin, which puts the box's edge 48px past the viewport and
 * makes every measurement of it lie. Here the same 48px is an `::after`
 * painted past the edge in the surface color: the popup's box is exactly the
 * 384 it says, flush with the viewport, and the viewport's `overflow-hidden`
 * hides the bleed until a pull reveals it.
 *
 * **`translate`, not `transform`.** Tailwind v4's `translate-*` writes the
 * standalone `translate` property (the Nav record found this the hard way),
 * so the swipe offset, the entrance and the exit all land on one property
 * and cannot fight.
 *
 * **A drawer inside a drawer stacks, on Base UI's variables.** A nested
 * `Drawer.Root` gives its parent's popup `--nested-drawers` (how many are in
 * front of it), `data-nested-drawer-open`, and — while the front one is
 * being swiped — its swipe progress in `--drawer-swipe-progress`. From
 * those, `--drawer-stack` is the distance a level sits behind the front:
 * 12px (`spacing/3`) per level, Panel's `Panel Stacking` numbers, coming
 * back to zero under the finger as the front one is swiped away. A right
 * drawer steps left by it and loses it at each end; a bottom sheet steps up
 * and loses it at each side, and takes the front sheet's height
 * (`--drawer-frontmost-height`) so sheets of different heights line up
 * behind one another. Widths never change; nothing scales.
 */
export const drawerPopup = tv({
  base: [
    'group/popup relative flex min-h-0 cursor-auto flex-col outline-none',
    'bg-surface-background-primary font-sans text-base text-content-primary',
    'overscroll-contain touch-auto',
    '[--drawer-stack:max(0px,calc((var(--nested-drawers,0)-clamp(0,var(--drawer-swipe-progress,0),1))*var(--spacing)*3))]',
    'transition-[translate,margin,width,height] duration-medium ease-standard',
    'data-swiping:transition-none data-swiping:select-none',
    'data-nested-drawer-swiping:transition-none',
    // The bleed, past the edge the drawer sits on.
    'after:pointer-events-none after:absolute after:bg-surface-background-primary',
  ],
  variants: {
    side: {
      right: [
        'self-stretch w-(--drawer-width) max-w-full my-(--drawer-stack)',
        'rounded-l-lg border-l border-surface-border shadow-high-left',
        'translate-x-[calc(var(--drawer-swipe-movement-x,0px)-var(--drawer-stack))]',
        'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
        'after:inset-y-0 after:left-full after:w-12',
      ],
      left: [
        'self-stretch w-(--drawer-width) max-w-full my-(--drawer-stack)',
        'rounded-r-lg border-r border-surface-border shadow-high-right',
        'translate-x-[calc(var(--drawer-swipe-movement-x,0px)+var(--drawer-stack))]',
        'data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
        'after:inset-y-0 after:right-full after:w-12',
      ],
      bottom: [
        // MobileNav's cap: never the whole screen, so the scrim still says
        // there is a page behind it.
        'w-[calc(100%-2*var(--drawer-stack))] max-h-[85dvh] mx-(--drawer-stack)',
        // Base UI measures the popup into `--drawer-height`; behind a front
        // sheet, the front one's height instead, so the two align.
        'h-(--drawer-height,auto)',
        'data-nested-drawer-open:h-(--drawer-frontmost-height,var(--drawer-height))',
        'pb-[env(safe-area-inset-bottom,0px)]',
        'rounded-t-lg border-t border-surface-border shadow-high-top',
        'translate-y-[calc(var(--drawer-swipe-movement-y,0px)-var(--drawer-stack))]',
        'data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
        'after:inset-x-0 after:top-full after:h-12',
      ],
    },
    modal: {
      true: '',
      false: 'pointer-events-auto',
    },
  },
  defaultVariants: {
    side: 'right',
    modal: true,
  },
})

/**
 * Base UI's `Content`: the column the Header and the Body stack in. Behind a
 * nested drawer it fades out — the 12px that peeks is surface and shadow,
 * not a sliver of a title — and comes back while the front one is being
 * swiped, so the user sees what they are returning to. Base UI's demo.
 */
export const drawerContent = tv({
  base: [
    'flex min-h-0 flex-1 flex-col',
    'transition-opacity duration-medium ease-standard',
    'group-data-nested-drawer-open/popup:opacity-0',
    'group-data-nested-drawer-swiping/popup:opacity-100',
  ],
})

/** Dialog's Body with ContentBlock's padding — Panel.Body's recipe, for the same reasons. */
export const drawerBody = tv({
  base: 'min-h-0 flex-1 overflow-y-auto px-4 pt-0 pb-4 first:pt-4',
})

type DrawerVariants = VariantProps<typeof drawerPopup>
export type DrawerSide = NonNullable<DrawerVariants['side']>
