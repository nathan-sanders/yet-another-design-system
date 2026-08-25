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
/**
 * Which surface an avatar is drawn on, as the four `--surface-*` fills that
 * exist in the theme.
 *
 * The group ring is a band of the background showing between overlapping
 * circles, and the status dot's ring is the same trick — so both have to name
 * the colour behind the avatar, and neither can work it out for itself. CSS has
 * no "the background of whatever contains me", so it is a prop.
 *
 * It names the token rather than inventing a second vocabulary — Card's
 * `padding={3}` precedent. `canvas` is the default, so an avatar on the page
 * needs no prop and every call site that predates this keeps what it had.
 *
 * The border tokens are not offered: `surface-border` is a line, not a fill,
 * and nothing is ever drawn on top of one.
 */
export type AvatarSurface = 'canvas' | 'card-primary' | 'card-subtle' | 'card-emphasized'

export const DEFAULT_AVATAR_SURFACE: AvatarSurface = 'canvas'

/** The group ring, painted as an `outline` so it costs no layout. */
const avatarSurfaceRing = {
  canvas: 'outline-surface-canvas',
  'card-primary': 'outline-surface-card-primary',
  'card-subtle': 'outline-surface-card-subtle',
  'card-emphasized': 'outline-surface-card-emphasized',
} as const satisfies Record<AvatarSurface, string>

/** The status dot's ring, painted as a `ring` for the same reason. */
const statusSurfaceRing = {
  canvas: 'ring-surface-canvas',
  'card-primary': 'ring-surface-card-primary',
  'card-subtle': 'ring-surface-card-subtle',
  'card-emphasized': 'ring-surface-card-emphasized',
} as const satisfies Record<AvatarSurface, string>

/**
 * The same colour as a *fill*, for the two status shapes that reveal the
 * background rather than ring it: `offline` is a stroked circle with the
 * surface showing through, and `unavailable`'s bar is drawn in the surface
 * colour rather than punched out.
 */
const statusSurfaceFill = {
  canvas: 'bg-surface-canvas',
  'card-primary': 'bg-surface-card-primary',
  'card-subtle': 'bg-surface-card-subtle',
  'card-emphasized': 'bg-surface-card-emphasized',
} as const satisfies Record<AvatarSurface, string>

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
     * The ring that separates overlapping avatars in a group. Set from context
     * by AvatarGroup, never by hand — an avatar cannot be wrong about whether
     * it is in a group. What *colour* the ring is comes from `surface` below.
     */
    inGroup: {
      true: 'outline-solid',
    },

    /**
     * Which surface the ring has to disappear into. See `avatarSurfaceRing`.
     */
    surface: avatarSurfaceRing,
  },

  compoundVariants: [
    // Ring width per size, read off the `Avatar Group` set (`40004297:11406`)
    // as the OUTSIDE stroke weight on each variant's avatars.
    //
    // **This is not the same number as the overlap**, and the two are set
    // independently — see the note on `avatarGroup` below. They happen to
    // coincide at three of the five sizes, which is exactly why it looked like
    // an identity when only `base` existed.
    { inGroup: true, size: 'x-small', class: 'outline-2' },
    { inGroup: true, size: ['small', 'base', 'large'], class: 'outline-4' },
    { inGroup: true, size: 'x-large', class: 'outline-8' },
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
    'bg-decorative-neutral-background text-decorative-neutral-foreground',
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
  base: 'absolute flex items-center justify-center rounded-full',

  variants: {
    /** The colour behind the avatar, which the dot's ring has to match. */
    surface: statusSurfaceRing,

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
      // the surface behind it. That fill comes from `surface` in the compound
      // variants below, because it is the only status that needs one.
      offline: 'border border-surface-border-emphasized',
      // Filled red disc with a bar knocked out of it, which reveals the canvas
      // behind — so the bar is drawn in canvas rather than punched out.
      unavailable: 'bg-feedback-danger-highlight',
    },
  },

  compoundVariants: [
    // The offline ring's stroke is 1px on the 8px dot and 2px on the larger two.
    { status: 'offline', size: ['base', 'large', 'x-large'], class: 'border-2' },

    // `offline` is the one status drawn as an outline rather than a disc, so it
    // is the one that shows the surface through its middle.
    { status: 'offline', surface: 'canvas', class: statusSurfaceFill.canvas },
    { status: 'offline', surface: 'card-primary', class: statusSurfaceFill['card-primary'] },
    { status: 'offline', surface: 'card-subtle', class: statusSurfaceFill['card-subtle'] },
    { status: 'offline', surface: 'card-emphasized', class: statusSurfaceFill['card-emphasized'] },
  ],

  defaultVariants: {
    surface: DEFAULT_AVATAR_SURFACE,
  },
})

/**
 * The bar across the `unavailable` dot. Every exported glyph puts it at half the
 * dot's width and an eighth of its height, so it is the same shape at all three
 * sizes: 4×1, 6×1.5, 10×2.5.
 */
export const statusBar = tv({
  base: 'block',

  variants: {
    /**
     * The bar is the surface showing through the disc, not a colour of its own —
     * so it is a fill in whatever is behind the avatar.
     */
    surface: statusSurfaceFill,

    size: {
      'x-small': 'h-px w-1',
      small: 'h-px w-1',
      base: 'h-[1.5px] w-1.5',
      large: 'h-[1.5px] w-1.5',
      'x-large': 'h-[2.5px] w-2.5',
    },
  },

  defaultVariants: {
    surface: DEFAULT_AVATAR_SURFACE,
  },
})

/**
 * The negative margin that overlaps the circles in a group, matched to the ring
 * width the avatar draws at each size.
 *
 * **The overlap and the ring width are two different numbers.** It is tempting
 * to read them as one — at `base` both are 4px, and while `base` was the only
 * variant Figma drew, that coincidence was the whole model. The full Size axis
 * (`40004297:11406`) shows they are set independently:
 *
 * | size | avatar | ring | overlap | group width |
 * |---|---|---|---|---|
 * | x-small | 20 | 2 | 4 | 84 |
 * | small | 24 | 4 | 4 | 104 |
 * | base | 36 | 4 | 4 | 164 |
 * | large | 40 | 4 | 4 | 184 |
 * | x-large | 128 | 8 | 24 | 544 |
 *
 * What each one does: the **ring** is the band of background between two
 * photos, so it is the ring width you see. The **overlap** is how far the next
 * circle sits into the previous one, so `overlap + ring` is how much of a
 * neighbour gets covered. x-large stacks much harder — 24px into a 128px
 * circle — because 4px on a circle that size would not read as a stack at all.
 *
 * The negative margin here is the *overlap*. The `outline` costs no layout, so
 * the two compose exactly as they do on the canvas.
 *
 * Group width is `5 × size − 4 × overlap`, which is the number to check.
 */
export const avatarGroup = tv({
  // inline-flex rather than flex so the group's box is the width of the row of
  // avatars — 164px for Figma's five at `base` — instead of stretching to fill
  // whatever contains it. Avatar and Badge shrink-wrap the same way.
  base: 'inline-flex items-center',

  variants: {
    size: {
      'x-small': '-space-x-1', // 4px
      small: '-space-x-1', // 4px
      base: '-space-x-1', // 4px
      large: '-space-x-1', // 4px
      'x-large': '-space-x-6', // 24px
    },
  },

  defaultVariants: {
    size: 'base',
  },
})

type AvatarVariants = VariantProps<typeof avatar>

/** Maps to the Figma `Size` property: XS 20 · S 24 · M 36 · L 40 · XL 128. */
export type AvatarSize = NonNullable<AvatarVariants['size']>

/**
 * The pixel box each named step draws. Only used to answer "which step is this
 * custom size closest to?" — the classes above stay the source of truth for the
 * box itself.
 */
const AVATAR_SIZE_PX: Record<AvatarSize, number> = {
  'x-small': 20,
  small: 24,
  base: 36,
  large: 40,
  'x-large': 128,
}

/**
 * The named step closest to a custom pixel size.
 *
 * `<Avatar size={16}>` sets its own box, but everything *derived* from the size —
 * the initials type scale, the fallback glyph, the status dot, the group ring —
 * comes from a tokenised scale with nothing continuous between its steps. There
 * is no 16px type token to interpolate to, so those snap to the nearest step
 * instead of being scaled by hand. The one deliberate consequence: a custom size
 * far from any step draws slightly large or small glyphs, which is the trade for
 * not inventing untokenised values.
 */
export function nearestAvatarSize(px: number): AvatarSize {
  const names = Object.keys(AVATAR_SIZE_PX) as AvatarSize[]
  return names.reduce((closest, name) =>
    Math.abs(AVATAR_SIZE_PX[name] - px) < Math.abs(AVATAR_SIZE_PX[closest] - px) ? name : closest,
  )
}

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
