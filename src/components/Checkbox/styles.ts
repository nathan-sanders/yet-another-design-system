import { tv, type VariantProps } from 'tailwind-variants'

import { focusRing, focusRingWithin } from '../../lib/focus'

/**
 * The shapes a labeled control shares: the row, the card round it, the label
 * column, and the 20px box and dial. Checkbox drew them first; Radio, Switch
 * and Questionnaire's answer rows draw the same things.
 *
 * They were three deliberate copies for a long time — Figma keeps Checkbox,
 * Radio and Switch as separate sets that can drift, and a module spanning
 * three folders would pin the three together in code while the file lets
 * them move. Radio's record said a fourth copy was the point to extract, and
 * Questionnaire was the fourth (2026-09-20). The bet the extraction makes is
 * that the four sets drift *together* — a token change to the card is one
 * edit here, and a set that genuinely diverges gets a variant, the way the
 * three differences that already existed are variants below.
 *
 * Shared across folders the way `Input/styles.ts` and `Menu/styles.ts` are:
 * one owner, imported by name.
 */

/**
 * The row, and — when `inContainer` is set — the card round it.
 *
 * The card's line is an `inset-ring` rather than a `border` because Figma
 * draws the container 40px tall: 24 of line-height plus 8 above and below. A
 * border would add its 2px on top of that and make it 42. `inset-ring` is a
 * shadow, so it costs no layout, which is the same reason Avatar uses one.
 *
 * The card keeps that 1px line unchanged when the control inside it takes
 * focus; the shared ring goes round the outside of the card instead
 * (`focusRingWithin`), because the control is inside it and two concentric
 * rings on one control read as a mistake.
 *
 * The card is a plain `<label>`, not a Base UI part, so it reads validity off
 * the control inside it — the same `has-` idiom as `focusRingWithin`, and as
 * Input's box. Both the Base UI roots and Questionnaire's native input carry
 * `data-invalid`, so one spelling serves all four.
 */
export const controlRow = tv({
  base: 'font-sans',

  variants: {
    inContainer: {
      // gap-3 = spacing/3 (12px).
      false: 'inline-flex items-center gap-3',
      true: [
        'flex w-full px-3 py-2',
        'rounded-md inset-ring inset-ring-surface-border',
        'hover:bg-surface-background-subtle',
        ...focusRingWithin,
        'has-[[data-invalid]]:inset-ring-feedback-danger-highlight',
        'has-[[data-invalid]]:hover:inset-ring-feedback-danger-highlight',
        'transition-colors duration-fast-min ease-standard',
      ],
    },

    /**
     * What the card holds. `stack` is Checkbox's and Switch's: the row over a
     * slot, so the card is a column at `gap-2` and the row sits in
     * `controlRowInner`. `row` is a card that is only the row — Radio, and
     * Questionnaire's answers — laid out flat at `gap-3`. Only read in a
     * container.
     */
    layout: {
      stack: '',
      row: '',
    },

    /**
     * Whether the card paints Surface/Background Primary. Checkbox, Radio and
     * Switch draw a filled card; a Questionnaire answer draws its ring on
     * whatever it sits on — the file binds no fill — because three or four of
     * them stack inside a chat bubble that is already the primary surface.
     * Only read in a container.
     */
    fill: {
      true: '',
      false: '',
    },

    /** Figma fades the whole row, label included, at opacity/opacity-40. */
    disabled: {
      true: 'pointer-events-none opacity-40',
      false: 'cursor-pointer',
    },

    invalid: { true: '', false: '' },
  },

  compoundVariants: [
    { inContainer: true, layout: 'stack', class: 'flex-col justify-center gap-2' },
    { inContainer: true, layout: 'row', class: 'items-center gap-3' },
    { inContainer: true, fill: true, class: 'bg-surface-background-primary' },
    {
      inContainer: true,
      invalid: true,
      class: 'inset-ring-feedback-danger-highlight hover:inset-ring-feedback-danger-highlight',
    },
  ],

  defaultVariants: {
    inContainer: false,
    layout: 'stack',
    fill: true,
    disabled: false,
    invalid: false,
  },
})

export type ControlRowVariants = VariantProps<typeof controlRow>

/** The row inside a `stack` card: the control and its label, above the slot. */
export const controlRowInner = 'flex w-full items-center gap-3'

/**
 * The label column. Inside a card it takes the leftover width so a long
 * description wraps rather than widening the card; outside one the row hugs
 * its content, as Figma draws it.
 */
export const controlLabelColumn = tv({
  base: 'flex flex-col items-start',
  variants: {
    fill: {
      true: 'min-w-px flex-1',
      false: 'shrink-0',
    },
  },
  defaultVariants: { fill: false },
})

/**
 * The label. Inside Checkbox's, Radio's and Switch's card it is
 * Content/Emphasized at semibold — the card is a bigger target and Figma gives
 * it more weight to match. Outside one, and on a Questionnaire answer, which
 * is one of several equals rather than a card on its own, it is ordinary body
 * text.
 */
export const controlLabel = tv({
  base: 'text-base',
  variants: {
    emphasized: {
      false: 'font-normal text-content-primary',
      true: 'font-semibold text-content-emphasized',
    },
  },
  defaultVariants: { emphasized: false },
})

/** Figma's `Sub Label`: the line under the label. */
export const controlDescription = 'text-sm font-normal text-content-subtle'

/**
 * Where a control reads its checked, hover and invalid state from.
 *
 * `self` is Base UI's: `data-checked` and `data-invalid` land on the control
 * itself, and hover is its own. `row` is Questionnaire's: the primitive puts
 * the state on the `<label>` round a hidden native input, so the painted
 * indicator looks up at `group/row` for all three. The two lists are the same
 * rules in two spellings and are kept side by side on purpose — Tailwind finds
 * classes by scanning source, so a variant cannot be composed at runtime, and
 * a token change has to be made in both.
 */
const stateFrom = {
  box: {
    self: [
      'hover:border-input-border-hover',
      // Ticked and indeterminate are the same fill; only the glyph differs.
      'data-checked:bg-input-selected data-checked:border-input-selected',
      'data-indeterminate:bg-input-selected data-indeterminate:border-input-selected',
      // Inside a Field, validity arrives here as `data-invalid` rather than as
      // the prop: Base UI's `fieldValidityMapping` puts it on this element when
      // the surrounding Field is invalid. The two compose — either lights the
      // border — so the prop stays as the standalone path Figma draws. The
      // `hover` copy is spelled out because both selectors otherwise land on
      // equal specificity, leaving the winner to the order Tailwind emits.
      'data-invalid:border-feedback-danger-highlight',
      'data-invalid:hover:border-feedback-danger-highlight',
    ],
    row: [
      'group-hover/row:border-input-border-hover',
      'group-data-checked/row:bg-input-selected group-data-checked/row:border-input-selected',
      'group-data-invalid/row:border-feedback-danger-highlight',
    ],
  },
  dial: {
    self: [
      'hover:border-input-border-hover',
      // Selected is a solid disc — Figma fills background and stroke with the
      // same token, which is what the exported SVG shows.
      'data-checked:bg-input-selected data-checked:border-input-selected',
      'data-invalid:border-feedback-danger-highlight',
      'data-invalid:hover:border-feedback-danger-highlight',
    ],
    row: [
      'group-hover/row:border-input-border-hover',
      'group-data-checked/row:bg-input-selected group-data-checked/row:border-input-selected',
      'group-data-invalid/row:border-feedback-danger-highlight',
    ],
  },
}

/**
 * The 20px box. Figma's Checkbox frame, and the only part of it that is not
 * text: `size-5` (width/w-5), `rounded-sm` (border-radius/rounded-sm, 6px).
 *
 * Focus is the shared ring, and it matters more here than most: the old inner
 * border painted 2px of white *inside* the box, which on a ticked box left a
 * white gutter between the fill and the tick — focus made the tick look
 * broken rather than making the box look focused.
 */
export const checkboxBox = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    'size-5 rounded-sm border',
    'cursor-pointer',
    // Unticked. The Input ramp, not the Action one: this is a form control.
    'bg-input-background border-input-border',
    // The glyph inherits this as currentColor, the way Icon is built to.
    'text-input-selected-foreground',
    'outline-none',
    // Same crossfade SegmentedControl uses for the same reason: the fill and
    // border both change on tick, and 130ms is the shortest motion token.
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    stateFrom: stateFrom.box,

    /**
     * Who draws the focus ring. Standalone, it is the box; inside a card it is
     * the card, because the box is a descendant of it and two concentric rings
     * on one control read as a mistake rather than as emphasis.
     */
    inContainer: {
      false: focusRing,
      true: '',
    },

    /**
     * Figma's `State=Invalid`, for a control standing on its own. Inside a
     * `Field`, validity comes from there instead, through the `data-invalid:`
     * rules above — and the Field is the only place that can also carry the
     * message explaining what is wrong, so prefer it.
     */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { stateFrom: 'self', invalid: false, inContainer: false },
})

/**
 * The 20px dial. `size-5` (width/w-5), `rounded-full`. Focus is the shared
 * ring, drawn outside the dial: the selected state is already a disc inside a
 * ring, so anything painted *inside* the circle competes with the indicator
 * instead of framing it.
 */
export const radioDial = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    'size-5 rounded-full border',
    'cursor-pointer',
    'bg-input-background border-input-border',
    'outline-none',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    stateFrom: stateFrom.dial,
    inContainer: {
      false: focusRing,
      true: '',
    },
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { stateFrom: 'self', invalid: false, inContainer: false },
})
