import { tv, type VariantProps } from 'tailwind-variants'

import { focusRing } from '../../lib/focus'

/**
 * The recipes the navigation family shares.
 *
 * `NavItem` is used by both bars, so its recipe cannot live in either one —
 * the same reason `Card/styles.ts` and `Menu/styles.ts` exist.
 *
 * Every color here comes from the **navigation theme** tier (`--nav-*`), not
 * the semantic one. That tier is switched by `<html data-nav-theme="…">` and
 * six of its seven modes are absolute, so a nav does not follow `.dark` unless
 * it is on `transparent`. See the section-2b comment in `theme.css`.
 */

export const navItem = tv({
  base: [
    // `group` so the expand chevron can read `data-panel-open` off this element
    // — Base UI puts it on the trigger, not on the icon. Accordion's trigger
    // does the same.
    'group flex w-full items-center gap-1 font-sans',
    // min-h-10 = height/h-10 (40px), p-2 = spacing/2 (8px), gap-1 = spacing/1
    // (4px), rounded-lg = border-radius/rounded-lg (12px). A min-height rather
    // than a height so a label that wraps grows the row instead of spilling.
    'min-h-10 rounded-lg p-2',
    'text-nav-content-primary',
    // The icon inherits this, which is what Figma binds its stroke to.
    'text-left',
    'transition-colors duration-fast-min ease-standard',
    // Figma's 1px stroke is `align: INSIDE`, which adds nothing to the frame —
    // the selected item is 40px tall with its border, not 42. A CSS `border` is
    // part of the box, so it cannot reproduce that: measured at 42px, two over.
    // `inset-ring` is a box-shadow, so it costs no layout at all, follows the
    // border-radius, and needs no transparent placeholder on the resting item
    // to stop the row re-flowing when the pointer arrives. Same reasoning as
    // `focus.ts`, one property along.
    'hover:bg-nav-item-background-hover',
    'hover:inset-ring-1 hover:inset-ring-nav-item-border-hover',
    // Not `focusRingUnhovered`: a nav item is a real tab stop, not a row that
    // takes focus because you pointed at it. The menu rule does not apply.
    ...focusRing,
    'data-disabled:pointer-events-none data-disabled:opacity-40',
  ],

  variants: {
    /**
     * Figma's `Type` axis, renamed. Primary and Secondary differ only in type
     * size and weight — 14/24 against 12/20 — so `size` is what the axis
     * actually is, and `type` is a DOM attribute the library's rule says has to
     * give way. Default is Figma's Primary, first as everywhere.
     */
    size: {
      default: 'text-base', // 14/24
      small: 'text-sm', // 12/20
    },
    /** The current page. Figma's `State=Selected`. */
    selected: {
      true: [
        'bg-nav-item-background-selected',
        'inset-ring-1 inset-ring-nav-item-border-selected',
        'font-semibold',
      ],
      false: '',
    },
    /** Collapsed to the rail: a 40x40 square with no label. */
    iconOnly: {
      true: 'w-10 justify-center',
      false: '',
    },
  },

  defaultVariants: {
    size: 'default',
    selected: false,
    iconOnly: false,
  },
})

/**
 * The chrome both bars draw: the nav surface, its radius and its elevation.
 *
 * `shadow-low` is Figma's `Elevation/Drop Shadow/Low`. Its color is a semantic
 * token and so it *does* follow `.dark`, unlike the surface it sits on — which
 * is right: the shadow belongs to the page the nav is floating above, not to
 * the nav.
 */
export const navSurface = tv({
  base: 'bg-nav-background text-nav-content-primary font-sans rounded-lg',

  variants: {
    /**
     * Figma's `Floating` axis, on both bars. It is **only the drop shadow** —
     * every other property is identical across the two variants, radius
     * included, which is worth knowing before assuming a docked bar squares
     * off its corners. It does not; the docs frame shows it inset inside the
     * app window, still rounded, just not lifted off it.
     */
    floating: {
      true: 'shadow-low',
      false: '',
    },
  },

  defaultVariants: {
    // Figma's default, and the more common case: a nav lifted off the page.
    floating: true,
  },
})

/**
 * The bottom sheet `MobileNav` opens, which is Figma's "Mobile Navigation
 * Popover" (`40004531:35587`).
 *
 * It is a Base UI Dialog popup rather than a Popover: modal, focus-trapped, and
 * dismissed by Escape. `Dialog.Popup` could not be reused — it hardcodes
 * centring on a Viewport that takes no `className` — so `MobileNav` composes the
 * raw parts and this recipe dresses the popup.
 */
export const navSheet = tv({
  base: [
    // Figma is 393 wide, which is the whole phone viewport, and HUGs its
    // content with no cap at all. The cap and the scroll inside are additions:
    // enough sections would otherwise push the sheet off the top of the screen,
    // taking the first one with it.
    'flex w-full max-h-[85dvh] flex-col',
    // Top corners only — Figma binds `rounded-lg` to the top two and
    // `rounded-none` to the bottom, because the sheet is flush with the edge.
    'rounded-t-lg',
    // padding [12, 12, 32, 12]: spacing/3 around, and spacing/8 at the bottom,
    // which is the home-indicator safe area rather than a visual decision.
    'px-3 pt-3 pb-8',
    // The navigation tier, not the semantic one. The rows inside are NavItems
    // drawing with --nav-*; on a semantic surface a `neutral-inverse` label
    // would be near-white text on white. Same call as the collapsed-group
    // flyout.
    'bg-nav-background text-nav-content-primary font-sans',
    // Figma's `Elevation/Drop Shadow/High - Top` — offset (0, -16), which is
    // what makes it read as lifting off the bottom edge.
    'shadow-high-top',
    // Base UI spreads tabIndex -1 onto the popup and focuses it when nothing
    // inside is tabbable; the browser would paint its own ring there. Dialog's
    // finding, in Dialog's spelling.
    'outline-none',
    /*
      The slide, and **translate only — no opacity**.

      It faded as well at first, and that is what stopped it reading as a slide:
      the sheet is transparent exactly while it is furthest down, so the travel
      you are meant to see happens while there is nothing to see. Nathan's
      reference is a plain slide in from the bottom, with no fade and no
      overshoot. The backdrop still fades — that one is a dissolve by nature and
      has nowhere to travel from.

      **A keyframe animation, not a transition, and that is the point.** A sheet
      that enters is a brand-new element, and a CSS transition on one only runs
      if the browser paints the starting style before it is removed. That is a
      real and well-known fragility, and it is the difference between this and
      the exit, which animates an element that has been on screen all along —
      exactly the asymmetry Nathan saw, where the exit slid correctly and the
      enter did not. An animation states its own `from`, so there is nothing to
      miss.

      `slide-in-from-bottom` / `slide-out-to-bottom` are motion primitives in
      the token layer (`theme.css` section 4b), parameterised by the same
      duration and easing tokens everything else here uses. They live there
      because a keyframe cannot be written inline — Tailwind can only name one
      that already exists in the stylesheet.

      `duration-medium` (410ms) rather than Toast's `medium-min`: `ease-standard`
      is steeply front-loaded, so a shorter duration spends most of its frames on
      a settle nobody can see and reads as a snap.
    */
    'data-open:animate-slide-in-from-bottom',
    'data-closed:animate-slide-out-to-bottom',
  ],
})

export type NavItemVariants = VariantProps<typeof navItem>
export type NavItemSize = NonNullable<NavItemVariants['size']>
