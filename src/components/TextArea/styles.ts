import { tv, type VariantProps } from 'tailwind-variants'

/**
 * The parts `TextArea` draws for itself. The bordered box around them is
 * `Input`'s `box`, imported rather than copied — NumberInput's and
 * Autocomplete's arrangement — so hover, invalid, the disabled fade and the
 * focus ring are the same code in the same file for every text field.
 *
 * What is **not** borrowed is Input's `control`: its `min-h-5.5 / 7.5 / 9.5`
 * and the box's `items-center` are single-line assumptions. A textarea's height
 * is `rows × line-height` plus its own vertical padding, and it sits at the top
 * of the box rather than the middle.
 *
 * ## The arithmetic to check
 *
 * Figma draws the Text Area set (page `↪ Text Area`, set `40005234:609`) with
 * the inner padding Input has — `spacing/0-5` / `spacing/1` / `spacing/2`
 * vertically, `spacing/3` horizontally — and a three-line text block, for
 * frames of **64 / 80 / 88**. Its stroke is *inside* the frame, so the padding
 * the eye sees is the token minus the 1px stroke. Input's record settles how to
 * port that: keep the box at Figma's outer height and let the content row be
 * the box minus its two borders — which is why Input's row is 30 in a 32 box.
 * The same rule here means the textarea's vertical padding is the token minus
 * one, so with `rows={3}`:
 *
 *     small    3 × 20 + 1 + 1 = 62 content + 2 border = 64
 *     default  3 × 24 + 3 + 3 = 78 content + 2 border = 80
 *     large    3 × 24 + 7 + 7 = 86 content + 2 border = 88
 *
 * `py-0.25` / `py-0.75` / `py-1.75` are real quarter-steps of the 4px scale,
 * the way Input's `min-h-5.5` is a half-step. The counter row, when it is on,
 * adds 20 (text-sm's line-height) + 4 (its bottom padding) to each.
 */

/**
 * The `<textarea>` itself, transparent — the box owns every visible thing.
 *
 * Padding is on the control, not the box, for Input's reason: the whole field
 * is the hit target, so clicking anywhere in an empty one lands the caret.
 */
export const textarea = tv({
  base: [
    'min-w-0 flex-1 self-stretch order-3',
    'bg-transparent px-3 outline-none',
    'text-content-primary',
    // Italic placeholder — this system's mark for text the person did not
    // enter. Astryx's is upright; the house rule wins.
    'placeholder:text-content-subtle placeholder:italic',
    'disabled:cursor-not-allowed',
  ],

  variants: {
    size: {
      // The token minus the border it shares a pixel with — see the arithmetic
      // at the top. Figma's 2 / 4 / 8, measured from the outside of the frame.
      small: 'py-0.25 text-sm', // 1px, text 12/20
      default: 'py-0.75 text-base', // 3px, text 14/24
      large: 'py-1.75 text-base', // 7px, text 14/24
    },

    /**
     * Astryx's `resize: vertical` is the default: the person can pull the
     * field taller, never wider, so a form column keeps its width. `none` is
     * for a fixed-height slot — a card, a dialog body — where a grip would let
     * the field push its neighbours around. Horizontal resizing is not
     * offered; nothing in a form wants a field wider than its label.
     */
    resize: {
      vertical: 'resize-y',
      none: 'resize-none',
    },
  },

  defaultVariants: { size: 'default', resize: 'vertical' },
})

/**
 * The `n/max` character counter, Astryx's, drawn as a row of its own **under**
 * the text rather than floating over it.
 *
 * Astryx absolutely positions the counter in the box's corner and pads the
 * bottom of the textarea by 28px to keep the last line clear of it. Here the
 * box is already `flex-wrap`, so the counter takes `InputGroup`'s block-end
 * slot — `order-5 w-full` — and the layout does the reserving. The textarea's
 * own scrollbar and grip stay where the browser puts them, which the overlay
 * arrangement has to work around.
 *
 * `tabular-nums` so the count does not jitter as digits change width.
 */
export const counter = tv({
  base: [
    'order-5 flex w-full justify-end px-3 pb-1',
    'text-sm tabular-nums select-none',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    over: {
      false: 'text-content-subtle',
      true: 'text-content-danger',
    },
  },

  defaultVariants: { over: false },
})

type TextAreaVariants = VariantProps<typeof textarea>

/** Astryx's `resize`, minus `both` — see the variant. */
export type TextAreaResize = NonNullable<TextAreaVariants['resize']>
