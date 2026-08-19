import { tv, type VariantProps } from 'tailwind-variants'

import { focusRingWithin } from '../../lib/focus'
import type { IconProps } from '../Icon'

/**
 * The look shared by `Input` and `InputGroup`.
 *
 * These live in their own module because both components draw the same box at
 * the same three sizes, and a file that exports both a component and constants
 * breaks React Fast Refresh. It is the same reason Avatar and Toast each have a
 * `styles.ts`.
 *
 * The label, sub-label and validation message are **not** here — they belong to
 * `Field`, which is what Figma's Field set says by nesting every control with
 * its own `Label` boolean switched off.
 *
 * ## The arithmetic that holds the whole file together
 *
 * Figma draws the field at three sizes (nodes 40004050:14183 and
 * 40004051:14425). Each frame is the box plus a 44px label block plus the 8px
 * between them, so the box itself is **24 / 32 / 40** — Button's scale, and
 * SegmentedControl's and Tabs'.
 *
 * The Input Group's stacked form is exactly three of those:
 * **72 / 96 / 120**. That is not a coincidence to be preserved by hand — it
 * falls out of the parts. An addon row is one box-height tall (its icon plus
 * padding), and the text row is a box-height *minus its two borders*, because
 * the borders are on the box rather than on the row:
 *
 *     small    24 + 22 + 24 = 70 content + 2 border =  72
 *     default  32 + 30 + 32 = 94 content + 2 border =  96
 *     large    40 + 38 + 40 = 118 content + 2 border = 120
 *
 * **Those six numbers are the ones to check** when any padding here changes.
 */

/**
 * The bordered box.
 *
 * ## Why `flex-wrap` rather than `flex-col`
 *
 * An addon picks its own placement, so whether the box is one row or three
 * depends on props of its children — which a parent cannot read. Wrapping solves
 * it in CSS instead: a block addon is `w-full`, so it takes a line to itself and
 * pushes everything else onto the next one, while inline addons share a line
 * with the text. `order` then puts the five slots in their fixed sequence, so
 * `align` is authoritative no matter what order the children are written in.
 *
 * `min-h-*` rather than `h-*` for the same reason — the box has to be able to
 * grow when a block addon wraps.
 */
export const box = tv({
  base: [
    'flex w-full flex-wrap items-center',
    // `border` with no colour: the width is constant so the box never changes
    // size, and which colour it takes is the `appearance` variant's business.
    // Button's ghost does the same thing with a fully transparent border.
    'rounded-md border',
    // Focus lands on the <input> inside, so the ring goes on the box and the
    // input draws none of its own — the Checkbox `inContainer` case, and the
    // reason CLAUDE.md warns about two rings on one control. Unlike a <button>,
    // an <input> matches :focus-visible on a mouse click too, which is right
    // here: Figma draws a focus state for clicking into the field.
    ...focusRingWithin,
    // Same crossfade Checkbox and SegmentedControl use, for the same reason: the
    // border colour changes on hover and on invalid, and 130ms is the shortest
    // motion token.
    'transition-colors duration-fast-min ease-standard',
    // Inside a Field, validity arrives as `data-invalid` on the control rather
    // than as a prop here — so the box reads it off its own descendant, the same
    // `has-` idiom the focus ring above uses. The `hover` copy is spelled out
    // because both selectors otherwise land on equal specificity and the winner
    // would come down to the order Tailwind happens to emit them in.
    'has-[[data-invalid]]:border-feedback-danger-highlight',
    'has-[[data-invalid]]:hover:border-feedback-danger-highlight',
    // Disabled is the one state the box can always see for itself, standalone or
    // in a Field: Base UI's Field.Root disables the control it wraps, so either
    // way there is a `:disabled` descendant. Keeping the fade here rather than on
    // Field.Root is what stops the two compounding to 16% when both apply.
    'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-40',
  ],

  variants: {
    /**
     * **Not a Figma property — this one goes past the file**, the way Divider's
     * `emphasis` and SegmentedControl's `layout` did, and wants an `Appearance`
     * axis adding to the Input and Input Group sets afterwards.
     *
     * `ghost` is a field with no fill and no stroke until you go near it, for a
     * global search entry that should sit quieter than a form field. Hovering
     * paints the same translucent wash Button's ghost appearance uses; focusing
     * brings the whole chrome back, so the field looks exactly like a default
     * one from the moment you are typing in it.
     *
     * **What keeps it findable.** A borderless field has a real problem under
     * WCAG 1.4.11 — there is no 3:1 boundary identifying it as a control — so a
     * ghost input leans on the things beside it instead: a leading icon in an
     * `InputGroup`, the label from a `Field`, or the placeholder. That is
     * Astryx's own rule for hiding a search field's label, and it is why the
     * search case is the safe case and a bare ghost field is not. The hover wash
     * is the third leg: it answers "is this interactive?" before you commit.
     *
     * Deliberately **not** enforced with a props union, unlike Button's
     * icon-only `aria-label`. Those unions enforce an accessible *name*, which
     * is a hard requirement; a placeholder is a visual affordance and requiring
     * one would nudge people towards placeholder-as-label, which Astryx warns
     * against in the same breath.
     */
    appearance: {
      default: 'border-input-border bg-input-background hover:border-input-border-hover',
      ghost: [
        'border-transparent bg-transparent',
        // The 10% wash from Button's ghost — same token, same reason.
        'hover:bg-action-ghost-background-hover',
        // Focus lands on the <input>, so the reveal rides the same `has-` idiom
        // as the ring rather than a second mechanism.
        'has-focus-visible:border-input-border has-focus-visible:bg-input-background',
      ],
    },

    size: {
      small: 'min-h-6', // 24px
      default: 'min-h-8', // 32px
      large: 'min-h-10', // 40px
    },

    /**
     * Figma's `State=Invalid` on the Input set — the standalone case, where
     * there is no Field to inherit validity from. Inside one, the `has-` rule in
     * the base list above does the same job off `data-invalid`, and the two
     * compose: either lights the border.
     */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  // `appearance` is declared before `invalid` on purpose: tailwind-variants
  // applies variants in the order their keys appear, and tailwind-merge keeps the
  // last of two conflicting border colours — so an invalid ghost field keeps its
  // red border at rest rather than hiding the one state that must never hide.
  defaultVariants: { appearance: 'default', size: 'default', invalid: false },
})

/**
 * The `<input>` itself, which is transparent: the box owns every visible thing.
 *
 * Padding is on the control rather than on the box so that the whole width of
 * the field is the hit target — click anywhere in an empty field and the caret
 * lands, instead of only within the text. `self-stretch` does the same job
 * vertically.
 */
export const control = tv({
  base: [
    'min-w-0 flex-1 self-stretch order-3',
    'bg-transparent px-3 outline-none',
    'text-content-primary',
    // Figma sets the placeholder in `text-base/italic regular`, not the regular
    // face. Easy to miss reading the screenshot.
    'placeholder:text-content-subtle placeholder:italic',
    'disabled:cursor-not-allowed',
  ],

  variants: {
    size: {
      // Heights are a box-height minus its two borders — see the arithmetic at
      // the top. They are `min-h` so a stacked group's text row is the right
      // height on its own line, where `self-stretch` has nothing to stretch to.
      // The half steps are real scale values, not arbitrary ones: Tailwind
      // multiplies `--spacing` (4px), so 5.5 is 22px.
      small: 'min-h-5.5 text-sm', // 22px, text 12/20
      default: 'min-h-7.5 text-base', // 30px, text 14/24
      large: 'min-h-9.5 text-base', // 38px, text 14/24
    },
  },

  defaultVariants: { size: 'default' },
})

/**
 * An addon: the Figma Start Slot / End Slot, unrolled so each one picks its own
 * side. `order` is what makes `align` authoritative — see the note on `box`.
 *
 * Inline addons carry padding on one side only, so the text keeps its full 12px
 * from an icon rather than doubling up to 24.
 */
export const addon = tv({
  base: 'flex shrink-0 items-center gap-2 text-content-primary',

  variants: {
    align: {
      'block-start': 'order-1 w-full px-3',
      'inline-start': 'order-2 self-stretch pl-3',
      'inline-end': 'order-4 self-stretch pr-3',
      'block-end': 'order-5 w-full px-3',
    },

    size: {
      small: 'text-sm',
      default: 'text-base',
      large: 'text-base',
    },
  },

  compoundVariants: [
    // A block addon is a row of its own, one box-height tall: the icon plus
    // symmetrical padding. Inline addons take their height from the row.
    { align: ['block-start', 'block-end'], size: 'small', class: 'min-h-6 py-1.5' }, // 12 + 12 = 24
    { align: ['block-start', 'block-end'], size: 'default', class: 'min-h-8 py-2' }, // 16 + 16 = 32
    { align: ['block-start', 'block-end'], size: 'large', class: 'min-h-10 py-3' }, // 16 + 24 = 40
  ],

  defaultVariants: { align: 'inline-start', size: 'default' },
})

/** Text sitting in an addon — a `https://` prefix, a `USD` suffix. */
export const addonText = tv({
  base: 'whitespace-nowrap text-content-subtle select-none',
})

type BoxVariants = VariantProps<typeof box>
type AddonVariants = VariantProps<typeof addon>

/** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
export type InputSize = NonNullable<BoxVariants['size']>

/** Not in Figma yet — see the `appearance` variant on `box`. */
export type InputAppearance = NonNullable<BoxVariants['appearance']>

/**
 * Where an addon sits. Figma models this as one `Display` property for the whole
 * group — inline or block, both slots together. Unrolling it per addon is what
 * lets an icon sit beside the text while a row of actions sits underneath.
 */
export type InputGroupAddonAlign = NonNullable<AddonVariants['align']>

/**
 * Which Icon size each field size reaches for. An explicit map rather than a
 * derivation, matching Button and SegmentedControl — the two scales are
 * independent. Figma binds width/w-3 at small and width/w-4 above it.
 */
export const ICON_SIZE: Record<InputSize, IconProps['size']> = {
  small: 'small', // 12px
  default: 'base', // 16px
  large: 'base', // 16px
}
