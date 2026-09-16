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
 * Figma's Input variants carry the inner padding — 2 / 4 / 8 vertically, 12
 * horizontally at every size (nodes 40004050:14183). With `rows={3}`:
 *
 *     small    3 × 20 + 2 + 2 = 64 content + 2 border = 66
 *     default  3 × 24 + 4 + 4 = 80 content + 2 border = 82
 *     large    3 × 24 + 8 + 8 = 88 content + 2 border = 90
 *
 * The counter row, when it is on, adds 20 (text-sm's line-height) + 4 (its
 * bottom padding) to each.
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
      small: 'py-0.5 text-sm', // 2px, text 12/20
      default: 'py-1 text-base', // 4px, text 14/24
      large: 'py-2 text-base', // 8px, text 14/24
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
