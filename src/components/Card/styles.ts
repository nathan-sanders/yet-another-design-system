import { tv, type VariantProps } from 'tailwind-variants'

import { focusRing } from '../../lib/focus'

/**
 * The recipes behind `Card` and `ClickableCard`.
 *
 * Both are drawn in Figma under `40004220:13049` — `Card` (`40004237:14594`,
 * Emphasis × Floating) and `Clickable Card` (`40004251:16237`, Emphasis ×
 * State). They share a box, so the box lives here, the way `Input`'s and
 * `Avatar`'s shared recipes do.
 */

/**
 * The card box itself, before any surface is chosen.
 *
 * **`rounded-md`, not `rounded-lg`.** Read back from the file: both card sets
 * bind `border-radius/rounded-md` (8px) where `Content Block` (`40004181:4493`)
 * binds `border-radius/rounded-lg` (12px). That is the difference that makes
 * these separate components rather than a headerless block — an 8px card inside
 * a 12px block is correct inner/outer nesting, and the `InsideContentBlock`
 * story is there to keep it honest.
 *
 * **`flex-col gap-2`, where Figma's frame is a horizontal wrapper with
 * `itemSpacing: 0`.** The file models the card as a single `Content` slot, so
 * the frame has nothing to space; the 8px between a KPI card's title and its
 * value lives inside that slot. In code there is no separate Content part to
 * carry it, so the root does — at `ContentBlock.Content`'s value, so a card's
 * children and a block's body have the same rhythm. Override with `className`.
 *
 * **Figma's `overflow-clip` is not ported** — the eleventh time. The file agrees
 * here for once: `clipsContent` is `true` on every variant *except* the focused
 * ones, which turn it off so the ring is not sliced. That is the same trade this
 * library made globally, reached from the other direction.
 */
const box = [
  'flex w-full min-w-0 flex-col gap-2',
  'rounded-md border',
  // 14/24 body type, so a card's content starts from the library's base rather
  // than from whatever the page happens to set. ContentBlock's line.
  'font-sans text-base',
]

/**
 * Figma draws one padding, `spacing/3` (12px), on all four sides of both sets.
 *
 * The scale around it is code-first, and it is settling a real inconsistency
 * rather than inventing an axis: this div was hand-rolled in sixteen story files
 * at `p-4`, `p-5` *and* `p-6` before the component existed. `none` is the one
 * value with a structural job — content that has to reach the border, an image
 * or a chart, which `ContentBlock` handles by letting you omit
 * `ContentBlock.Content` and a single-slot card cannot.
 *
 * Owed to Figma as a `Padding` property on both sets.
 */
const padding = {
  none: 'p-0',
  /** spacing/2 */
  tight: 'p-2',
  /** spacing/3 — Figma's value. */
  default: 'p-3',
  /** spacing/4 — ContentBlock's body padding. */
  loose: 'p-4',
}

export const card = tv({
  base: box,

  variants: {
    /**
     * Which surface the card draws.
     *
     * **The border tracks the fill unless the file says otherwise**, which is
     * the pattern to notice: read back from the variants, `subtle`'s stroke is
     * bound to `Surface/Card Subtle` — its own fill — and only `default` and
     * `accent` bind a real border token. So a subtle card is a *fill*, not an
     * outline.
     *
     * **That is where this parts company with `ContentBlock`**, whose `subtle`
     * keeps `border-surface-border` and reads as an outline on the canvas. Same
     * word, two components, and the file draws them differently on purpose: a
     * block is a region of a page and wants an edge, a card is an object in a
     * list and wants a face. The consequence is worth knowing —
     * `--surface-card-subtle` and `--surface-canvas` are the same stone in both
     * themes, so a subtle card on the canvas is *invisible*, where a subtle
     * block is an outline. It is for use inside another surface: a recessed well
     * in a white card, which is where the compositions put it.
     */
    emphasis: {
      /** Figma's Default: Surface/Card Primary on Surface/Border. */
      default: 'bg-surface-card-primary border-surface-border text-content-primary',
      /** Surface/Card Subtle, edge and face both. A well, not an outline. */
      subtle: 'bg-surface-card-subtle border-surface-card-subtle text-content-primary',
      /**
       * The loud one. Surface/Card Emphasized on Surface/Border Emphasized with
       * Content/Inverse over it — each tier's own inverted value, already tuned
       * for contrast on that background in both themes, so there is no `dark:`
       * class here. ContentBlock's accent, unchanged, and Banner's finding
       * before it.
       *
       * A ghost Button on this background is invisible (its foreground is the
       * same stone). Use `appearance="overlay"`.
       */
      accent: [
        'bg-surface-card-emphasized border-surface-border-emphasized',
        'text-content-inverse',
      ],
    },

    /** Figma's `Floating` — Elevation/Drop Shadow/Low, 0 2 4 0. */
    floating: {
      true: 'shadow-low',
      false: '',
    },

    padding,
  },

  defaultVariants: {
    emphasis: 'default',
    floating: false,
    padding: 'default',
  },
})

export const clickableCard = tv({
  base: [
    ...box,
    // A <button> centres its text and inherits nothing; both have to be said.
    'text-left text-content-primary',
    // Tailwind's preflight sets buttons to cursor: default. Button's line.
    'cursor-pointer',
    /*
      Figma draws the focus state as a separate `Focus Ring` instance — a 2px
      OUTSIDE white stroke with a 3px-spread shadow under it — parented to the
      card and switching `clipsContent` off so it is not sliced. That is this
      library's shared ring, drawn on the canvas: import it, do not re-derive it
      from the geometry. See src/lib/focus.ts.
    */
    ...focusRing,
    // Link's motion, not Button's bare `transition-colors`, which predates the
    // tier. The hover moves both fill and border, so both animate together.
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    /**
     * Figma's Emphasis on the clickable set: Default | Ghost. Neither `accent`
     * nor `floating` appears here, which is why this is a second component
     * rather than a flag on the first.
     *
     * Both hover to Surface/Card Subtle, **fill and border together** — read
     * back from the hover variants, where the stroke is bound to the same
     * `Surface/Card Subtle` as the fill.
     */
    emphasis: {
      /** A card that happens to be clickable. Surface/Card Primary on Surface/Border. */
      default: [
        'bg-surface-card-primary border-surface-border',
        'hover:bg-surface-card-subtle hover:border-surface-card-subtle',
      ],
      /**
       * The list row. Figma binds the stroke to `Surface/Card Primary` — the
       * same token as the fill — so the border is present but invisible, and a
       * ghost row is exactly the size of a bordered card beside it. Written as
       * the token rather than as `border-transparent` for that reason, and
       * because it is what makes the hover a single colour transition.
       *
       * On a `surface-card-primary` parent it disappears at rest and greys under
       * the pointer, which is what a mail list wants. On the canvas it is a white
       * block — check which surface it is sitting on before reaching for it.
       */
      ghost: [
        'bg-surface-card-primary border-surface-card-primary',
        'hover:bg-surface-card-subtle hover:border-surface-card-subtle',
      ],
    },

    padding,

    /**
     * The row you are looking at. **Code-first** — Figma's `State` axis is
     * Default | Hover | Focus | Disabled, with nothing for this — and the route
     * Badge's extra hues, Divider's `emphasis` and Accordion's `container` took.
     * The file owes it a `Selected` state.
     *
     * Subtle fill, so it agrees with hover, plus the *emphasized* border, which
     * hover does not have — that is what keeps "selected" and "the pointer is
     * here" apart in a list where both can be true at once. Repeated under
     * `hover:` so the pointer cannot wash the outline off the selected row.
     * Border width is unchanged, so nothing reflows.
     */
    selected: {
      true: [
        'bg-surface-card-subtle border-surface-border-emphasized',
        'hover:border-surface-border-emphasized',
      ],
      false: '',
    },

    /**
     * Figma's Disabled: a flat 40% opacity (`opacity/opacity-40`) with the
     * colour left alone.
     *
     * A variant rather than Button's `disabled:` modifier, because this
     * component has two element paths and only one of them can carry the native
     * attribute — an `<a>` has no `disabled`. Link's shape, for Link's reason.
     */
    disabled: {
      true: 'pointer-events-none cursor-default opacity-40',
      false: '',
    },
  },

  defaultVariants: {
    emphasis: 'default',
    padding: 'default',
    selected: false,
    disabled: false,
  },
})

type CardVariants = VariantProps<typeof card>
type ClickableCardVariants = VariantProps<typeof clickableCard>

/** `default` | `subtle` | `accent` — the static card's three surfaces. */
export type CardEmphasis = NonNullable<CardVariants['emphasis']>

/** `default` | `ghost` — the clickable card's two. */
export type ClickableCardEmphasis = NonNullable<ClickableCardVariants['emphasis']>

/** Shared by both: `none` | `tight` | `default` | `loose` (0 / 8 / 12 / 16). */
export type CardPadding = NonNullable<CardVariants['padding']>
