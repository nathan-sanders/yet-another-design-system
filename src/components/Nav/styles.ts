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

export type NavItemVariants = VariantProps<typeof navItem>
export type NavItemSize = NonNullable<NavItemVariants['size']>
