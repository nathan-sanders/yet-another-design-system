import { tv, type VariantProps } from 'tailwind-variants'

import { focusRing } from '../../lib/focus'

/**
 * The shared look of an avatar-shaped circle.
 *
 * These live in their own module because both `Avatar` and
 * `AvatarGroup.Overflow` draw the same circle, and a file that exports both
 * components and constants breaks React Fast Refresh.
 *
 * ## The trap that shapes all of it: Figma's strokes here are *outside* strokes
 *
 * The Avatar Status "S" symbol is an 8px frame that renders 12×12 (8 + 2 + 2),
 * and the Avatar Group's five 36px avatars measure 164px, which is
 * `5 × 36 − 4 × 4` — the strokes add nothing to the layout. So every ring below
 * is an `outline` or a `ring`, both of which paint outside the box and cost no
 * layout. A CSS `border` would eat into the circle and shrink the photo instead.
 */
export const avatar = tv({
  base: [
    'relative inline-flex shrink-0 items-center justify-center',
    'rounded-full font-sans font-normal select-none',
  ],

  variants: {
    // Box size and the type scale for initials, straight off the Figma table.
    // Names follow Icon's scale rather than Figma's XS/S/M/L/XL so the library
    // reads consistently.
    size: {
      'x-small': 'size-5 text-xs', // 20px, text 10/16
      small: 'size-6 text-xs', // 24px, text 10/16
      base: 'size-9 text-sm', // 36px, text 12/20
      large: 'size-10 text-base', // 40px, text 14/24
      // Figma's text-5xl style carries −2% letter-spacing. This is the one
      // hardcoded value in the component: letter-spacing is not exported by the
      // token pipeline at all — there is no --text-*--letter-spacing in
      // theme.css and no letterSpacing key in tokens/dimensions.json — so there
      // is no token to reach for.
      'x-large': 'size-32 text-5xl tracking-[-0.02em]', // 128px, text 48/48
    },

    interactive: {
      true: [
        'cursor-pointer',
        // The library's shared ring — see src/lib/focus.ts. It is `box-shadow`
        // rather than `outline` for the reason every ring on this component is:
        // `outline` is spoken for by the group's canvas ring below, and a
        // `border` would eat into the photo.
        ...focusRing,
      ],
    },

    /**
     * The canvas ring that separates overlapping avatars in a group. Set from
     * context by AvatarGroup, never by hand.
     */
    inGroup: {
      true: 'outline-solid outline-surface-canvas',
    },
  },

  compoundVariants: [
    // Figma specifies the group only at `base`, where the ring is 4px. The two
    // small sizes step down to 2px, which is how Figma scales the status dot's
    // ring across the same range — a 4px ring on a 20px avatar leaves very
    // little avatar.
    { inGroup: true, size: ['x-small', 'small'], class: 'outline-2' },
    { inGroup: true, size: ['base', 'large', 'x-large'], class: 'outline-4' },
  ],

  defaultVariants: {
    size: 'base',
  },
})

/**
 * The stone circle behind initials, a `+N` count, or the person glyph. Figma
 * gives the Image variants no background of their own, so this lives on the
 * fallback rather than on the root.
 */
export const avatarSurface = tv({
  base: [
    'flex size-full items-center justify-center overflow-hidden rounded-full',
    'bg-decorative-stone-background text-decorative-stone-foreground',
  ],
})

/**
 * The status dot. Figma's Avatar Status set has its own Size property (S 8px,
 * M 12px, L 20px), but the avatar picks the size for you — S for the two small
 * avatars, M for base and large, L for x-large — so it is keyed by avatar size
 * here rather than exposed as a second knob.
 *
 * Each status has a *shape* as well as a colour — a filled disc, a ring, a disc
 * with a bar through it — so the three stay distinguishable to anyone who cannot
 * separate green from red.
 */
export const statusDot = tv({
  base: 'absolute flex items-center justify-center rounded-full ring-surface-canvas',

  variants: {
    size: {
      'x-small': 'bottom-0 -right-0.5 size-2 ring-2', // 8px dot
      small: 'bottom-0 -right-0.5 size-2 ring-2', // 8px dot
      base: 'bottom-0 -right-0.5 size-3 ring-2', // 12px dot
      large: 'right-0 bottom-0 size-3 ring-2', // 12px dot
      'x-large': 'right-2 bottom-2 size-5 ring-4', // 20px dot, inset 8px
    },

    status: {
      // Filled green disc.
      online: 'bg-feedback-success-highlight',
      // A ring, not a disc: the SVG is a stroked circle with no fill, sitting on
      // the frame's canvas background.
      offline: 'border border-surface-border-emphasized bg-surface-canvas',
      // Filled red disc with a bar knocked out of it, which reveals the canvas
      // behind — so the bar is drawn in canvas rather than punched out.
      unavailable: 'bg-feedback-danger-highlight',
    },
  },

  compoundVariants: [
    // The offline ring's stroke is 1px on the 8px dot and 2px on the larger two.
    { status: 'offline', size: ['base', 'large', 'x-large'], class: 'border-2' },
  ],
})

/**
 * The bar across the `unavailable` dot. Every exported glyph puts it at half the
 * dot's width and an eighth of its height, so it is the same shape at all three
 * sizes: 4×1, 6×1.5, 10×2.5.
 */
export const statusBar = tv({
  base: 'block bg-surface-canvas',

  variants: {
    size: {
      'x-small': 'h-px w-1',
      small: 'h-px w-1',
      base: 'h-[1.5px] w-1.5',
      large: 'h-[1.5px] w-1.5',
      'x-large': 'h-[2.5px] w-2.5',
    },
  },
})

/**
 * The negative margin that overlaps the circles in a group, matched to the ring
 * width the avatar draws at each size.
 *
 * **The overlap is the ring width.** Figma's group is five 36px avatars at 164px
 * total, so each circle sits 4px into the one before it — exactly as wide as its
 * ring. The two cancel out and leave a clean band of canvas between neighbours.
 */
export const avatarGroup = tv({
  // inline-flex rather than flex so the group's box is the width of the row of
  // avatars — 164px for Figma's five at `base` — instead of stretching to fill
  // whatever contains it. Avatar and Badge shrink-wrap the same way.
  base: 'inline-flex items-center',

  variants: {
    size: {
      'x-small': '-space-x-0.5', // 2px
      small: '-space-x-0.5', // 2px
      base: '-space-x-1', // 4px
      large: '-space-x-1', // 4px
      'x-large': '-space-x-1', // 4px
    },
  },

  defaultVariants: {
    size: 'base',
  },
})

type AvatarVariants = VariantProps<typeof avatar>

/** Maps to the Figma `Size` property: XS 20 · S 24 · M 36 · L 40 · XL 128. */
export type AvatarSize = NonNullable<AvatarVariants['size']>

/** Maps to the Figma Avatar Status `Status` property. */
export type AvatarStatus = 'online' | 'offline' | 'unavailable'

/** The person glyph, at roughly 55% of the circle at every size. */
export const FALLBACK_GLYPH_SIZE: Record<AvatarSize, string> = {
  'x-small': 'size-3', // 12px
  small: 'size-3.5', // 14px
  base: 'size-5', // 20px
  large: 'size-6', // 24px
  'x-large': 'size-16', // 64px
}

/** Default spoken name for each status, used when `statusLabel` is not given. */
export const STATUS_LABEL: Record<AvatarStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  unavailable: 'Unavailable',
}
