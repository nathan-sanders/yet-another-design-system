import { tv, type VariantProps } from 'tailwind-variants'

import { focusRingWithin } from '../../lib/focus'

/**
 * The look of a Token.
 *
 * These live in their own module because `Token` and `Token.Remove` are both
 * components in one file, and a file that exports components *and* constants
 * breaks React Fast Refresh — the same reason Input, Avatar and Toast each have
 * a `styles.ts`.
 *
 * ## The arithmetic that holds the file together
 *
 * Figma draws the token at two sizes (node 40004003:3431): **24** and **20**,
 * with the same 12/20 type at both — the size property changes the height and
 * nothing else. The default size is the line box plus 2px of block padding; the
 * small size is the line box, exactly.
 *
 * **And that is where the trap is.** A Figma stroke adds nothing to a frame; a
 * CSS border does. So `min-h-5` + `border` + a 20px line-height renders **22px**,
 * not 20 — Select's padding-block problem arriving from the opposite direction.
 * The line box is what has to give up the 2px, so `small` sets `leading-4.5`
 * (18px) and keeps the 12px type: 18 + 2 = 20. The default size has the 2px of
 * padding to absorb the border already, so it needs no line-height of its own.
 *
 * **20 and 24 are the numbers to measure** when anything here changes.
 *
 * ## Why those two numbers matter beyond this component
 *
 * A Token is what a Combobox will show for each selected value, sitting inside
 * the same bordered box Input, InputGroup and Select draw. Adding one must not
 * change the field's height — the box may only grow when tokens wrap to a second
 * line. The field's *inner* height is its box minus two borders:
 *
 *     field small    24 − 2 = 22  ·  token small   20  ·  2px spare
 *     field default  32 − 2 = 30  ·  token default 24  ·  6px spare
 *     field large    40 − 2 = 38  ·  token default 24  · 14px spare
 *
 * A 22px small token would fill a small field edge to edge, which is the
 * concrete reason the `leading-4.5` fix is worth having rather than letting the
 * size drift.
 */
export const token = tv({
  base: [
    // `relative` so the clickable overlay below has something to pin to;
    // `max-w-full` so a token can shrink inside a field rather than widening it.
    'relative inline-flex max-w-full shrink-0 items-center',
    'gap-2 px-2',
    'border border-surface-border bg-surface-background-primary',
    'font-sans text-sm font-normal text-content-primary',
    // Focus lands on a control *inside* the token — the remove button, or the
    // overlay that makes the whole pill clickable — and Figma draws the ring
    // around the whole token, so the ring goes here and neither inner control
    // draws one of its own. The two-rings-on-one-control case CLAUDE.md warns
    // about, answered the way Input and Checkbox `inContainer` answer it.
    ...focusRingWithin,
    // Hover is a shadow appearing, so the crossfade is on `shadow` rather than
    // `colors`. 130ms is the shortest motion token, as everywhere else.
    'transition-shadow duration-fast-min ease-standard',
  ],

  variants: {
    size: {
      default: 'min-h-6', // 24px — 20px line box centered, 2px of slack
      small: 'min-h-5 leading-4.5', // 20px — 18px line box + 2px border
    },

    /**
     * **Concentric corners.** A token standing on its own is `rounded-md`, the
     * radius every other card and field in the library uses. A token *inside* a
     * field — a Combobox's chips — takes the step down to `rounded-sm`, because
     * an 8px pill sitting a few pixels inside an 8px box reads as a mistake:
     * two curves of the same radius on different centers never look parallel.
     * Subtracting the gap is the usual rule of thumb, and 8 − 3 lands almost
     * exactly on the 6px the scale already has.
     *
     * **Code first here, and the file wants catching up** — Figma binds
     * `border-radius/rounded-md` on the Token instances inside its Multi Select
     * Combobox Value. Divider's `emphasis` and Badge's extra hues went the same
     * way round.
     *
     * A prop rather than a derivation, because a token cannot see what it is
     * sitting in: `Combobox` passes it, and nothing else needs to.
     */
    radius: {
      md: 'rounded-md', // 8px — standing on its own
      sm: 'rounded-sm', // 6px — nested inside a field
    },

    /**
     * **Figma's `Usage` property, derived rather than declared.** A token is
     * interactive because it has an `onRemove`, an `onClick` or an `href`, not
     * because a prop says so — the same move Avatar makes for `Content` and
     * Button makes for its icon-only form. A prop that can contradict the
     * children is a prop that will.
     *
     * Hover is the whole of it: Figma's Hover state changes nothing but adding
     * `Elevation/Drop Shadow/Low`.
     */
    interactive: {
      true: 'hover:shadow-low',
      false: '',
    },

    /**
     * Figma's `State=Disabled`. A `<span>` has no `disabled` attribute to read,
     * unlike Input's box, so this is a real prop — and it is passed down to the
     * inner buttons as well, so they stop responding rather than merely looking
     * faded.
     */
    disabled: {
      true: 'pointer-events-none opacity-40',
      false: '',
    },
  },

  defaultVariants: { size: 'default', radius: 'md', interactive: false, disabled: false },
})

/**
 * The label. `min-w-0` is what lets `truncate` bite: without it a flex child
 * refuses to shrink below its content, and a long value would widen the field
 * instead of ellipsizing. Astryx's guidance ("keep labels short — tokens
 * truncate with ellipsis"), and load-bearing for a Combobox that must not grow.
 */
export const tokenLabel = tv({
  base: 'min-w-0 truncate',
})

/**
 * The remove button.
 *
 * Figma draws a bare 12×12 `x`, with no button component behind it — a 12px hit
 * target, well under the 24×24 of WCAG 2.5.8. The fix is Input's: put the
 * padding on the control rather than on the box. The negative margins cancel the
 * token's own trailing padding and the flex gap, and the button re-spends both
 * as its own padding, so **the drawn geometry does not move** — the icon is
 * still 12×12, still 8px from the label and 9px from the outer edge — while the
 * target grows to 28×24 (28×20 at small).
 *
 * `-my-px` with `self-stretch` reaches over the 1px borders, which is what makes
 * the target the token's full height rather than its content height.
 *
 * `relative z-10` keeps it above the clickable overlay: an absolutely positioned
 * sibling paints over static content, so without this the overlay would swallow
 * the remove button's own 28px.
 *
 * **Its radius is the token's, read off context rather than passed** — the
 * button reaches over the pill's border to take the full height, so its outer
 * corners sit exactly on the pill's and any mismatch shows as a sliver of wash
 * outside the curve.
 */
export const tokenRemove = tv({
  base: [
    'relative z-10 flex shrink-0 self-stretch items-center justify-center',
    '-my-px -mx-2 px-2',
    'cursor-pointer text-content-primary',
    // Its own wash, so that a token which is *both* clickable and removable has
    // two tab stops you can tell apart — the shared ring is on the root and
    // fires identically for either. Goes past the Figma file, which draws no
    // state on the `x`; wants adding there, the way Divider's `emphasis` did.
    //
    // The radius is the token's own, not a pill: the button reaches over the
    // token's border to take the full height, so its right-hand corners sit
    // exactly on the token's, and matching makes the wash read as the trailing
    // end of the pill rather than a circle floating inside it.
    'transition-colors duration-fast-min ease-standard',
    'hover:bg-action-ghost-background-hover focus-visible:bg-action-ghost-background-hover',
    'outline-none disabled:cursor-not-allowed',
  ],

  variants: {
    radius: {
      md: 'rounded-md',
      sm: 'rounded-sm',
    },
  },

  defaultVariants: { radius: 'md' },
})

/**
 * The invisible button that makes a whole token clickable.
 *
 * A removable token cannot itself be a `<button>` — the remove button nests
 * inside it, and a button inside a button is neither valid nor operable. Astryx
 * hits the same wall and answers it the same way: a span with a button stretched
 * across it. Doing it for *every* clickable token rather than only the removable
 * ones keeps one code path and one focus idiom.
 *
 * It carries no visible style at all; the root draws the pill and the ring.
 *
 * **`-inset-px`, not `inset-0`.** An absolutely positioned child is placed
 * against the padding box, so `inset-0` stops 1px short of the pill's edge all
 * the way round and leaves the border itself unclickable. The negative inset
 * puts it back on the border box.
 *
 * **`z-1`, not nothing.** A positioned element paints over static siblings, which
 * is what puts the overlay above the label — but not over a sibling that is
 * *also* positioned, and `Avatar`'s root is `relative` (it hangs a status dot off
 * itself). Without the z-index, clicking a token's avatar did nothing while
 * clicking its label worked. `Token.Remove` sits at `z-10`, above both.
 */
export const tokenOverlay = tv({
  base: 'absolute -inset-px z-1 cursor-pointer outline-none',

  variants: {
    /** The pill's, for the same reason `tokenRemove` takes it: it covers it. */
    radius: {
      md: 'rounded-md',
      sm: 'rounded-sm',
    },
  },

  defaultVariants: { radius: 'md' },
})

type TokenVariants = VariantProps<typeof token>

/**
 * Maps to the Figma `Size` property: Default 24 · Small 20. Two, not three —
 * unlike the field scale, which has a `large`. A `large` field takes the default
 * token; there is nothing between 24 and a field's 38px of room worth drawing.
 */
export type TokenSize = NonNullable<TokenVariants['size']>

/**
 * Which corner radius a token wears — `md` (8px) standing on its own, `sm`
 * (6px) nested inside a field. See the `radius` variant above for why.
 */
export type TokenRadius = NonNullable<TokenVariants['radius']>

/**
 * How big the avatar in the leading slot is at each token size.
 *
 * Figma puts a 16px avatar in the default token and a 12px one in the small
 * token — neither of which is a size the Avatar component or the Figma Avatar
 * set has; they are resized instances on the canvas. Rather than inventing two
 * variants, `Avatar` gained a numeric `size` escape hatch, and this is its first
 * caller. `Token.Avatar` reads the token's size from context and applies it, so
 * the number never has to be written out at a call site.
 */
export const TOKEN_AVATAR_SIZE: Record<TokenSize, number> = {
  default: 16,
  small: 12,
}
