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
  cn(
    backdrop(),
    'opacity-[calc(1-var(--drawer-swipe-progress,0))]',
    'data-swiping:transition-none',
  )

/**
 * Where in the viewport the popup sits. `overflow-hidden`, MobileNav's
 * finding: a popup translated off-screen for its entrance must not create a
 * scrollbar on the viewport it is entering. Non-modal, the viewport lets
 * pointer events through to the page and only the popup takes them back.
 */
export const drawerViewport = tv({
  base: 'fixed inset-0 flex overflow-hidden',
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
 * and cannot fight. `transition-transform` covers it.
 */
export const drawerPopup = tv({
  base: [
    'relative flex min-h-0 flex-col outline-none',
    'bg-surface-background-primary font-sans text-base text-content-primary',
    'overscroll-contain touch-auto',
    'transition-transform duration-medium ease-standard',
    'data-swiping:transition-none data-swiping:select-none',
    // The bleed, past the edge the drawer sits on.
    'after:pointer-events-none after:absolute after:bg-surface-background-primary',
  ],
  variants: {
    side: {
      right: [
        'h-full w-(--drawer-width) max-w-full',
        'rounded-l-lg border-l border-surface-border shadow-high-left',
        'translate-x-(--drawer-swipe-movement-x,0px)',
        'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
        'after:inset-y-0 after:left-full after:w-12',
      ],
      left: [
        'h-full w-(--drawer-width) max-w-full',
        'rounded-r-lg border-r border-surface-border shadow-high-right',
        'translate-x-(--drawer-swipe-movement-x,0px)',
        'data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
        'after:inset-y-0 after:right-full after:w-12',
      ],
      bottom: [
        // MobileNav's cap: never the whole screen, so the scrim still says
        // there is a page behind it.
        'w-full max-h-[85dvh]',
        'pb-[env(safe-area-inset-bottom,0px)]',
        'rounded-t-lg border-t border-surface-border shadow-high-top',
        'translate-y-(--drawer-swipe-movement-y,0px)',
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

/** Base UI's `Content`: the column the Header and the Body stack in. */
export const drawerContent = tv({
  base: 'flex min-h-0 flex-1 flex-col',
})

/** Dialog's Body with ContentBlock's padding — Panel.Body's recipe, for the same reasons. */
export const drawerBody = tv({
  base: 'min-h-0 flex-1 overflow-y-auto px-4 pt-0 pb-4 first:pt-4',
})

type DrawerVariants = VariantProps<typeof drawerPopup>
export type DrawerSide = NonNullable<DrawerVariants['side']>
