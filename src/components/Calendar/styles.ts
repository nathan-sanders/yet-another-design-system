import { tv, type VariantProps } from 'tailwind-variants'

import { focusRing } from '../../lib/focus'

/**
 * The recipes `Calendar` and `DatePicker` share.
 *
 * They live here rather than beside either component because both reach for
 * them — `DatePicker` draws the panel, the presets rail and the footer around a
 * `Calendar` — and because a file that exports both a component and constants
 * breaks React Fast Refresh. Same split as `Input/styles.ts`.
 */

/**
 * One day.
 *
 * Mirrors the Figma component set `_Day Button` (node 40004972:34892), whose
 * two axes are `Type` (Default | Outside | Current) and `State` (Default,
 * Hover, Focus, Disabled, and the five selection states). Hover, focus and
 * disabled are real CSS here, so `State` collapses into the `selection`
 * variant and three pseudo-class rules in `base`.
 *
 * **Every cell carries a transparent 1px border at rest.** The file's hover
 * and selected states add a stroke, and without one reserved the content box
 * would shift under the pointer. SegmentedControl's segment does the same
 * thing for the same reason. Figma's strokes are all `strokeAlign: INSIDE`,
 * measured — and because the cell is a fixed 40 x 32 under Tailwind's
 * `border-box`, a CSS border reproduces that exactly. The usual
 * `inset-ring`-for-INSIDE rule is about hug-sized elements, which this is not.
 */
export const dayButton = tv({
  base: [
    // 40 x 32 — the file's `width/w-10` x `height/h-8`. Fixed, not min, so a
    // cell is the same size in every state and the columns cannot drift.
    'relative flex h-8 w-10 shrink-0 items-center justify-center',
    'border border-transparent font-sans text-base',
    'cursor-pointer select-none',
    // **Only the border transitions.** `transition-colors` also animates the
    // background, and a selection change moves the background *and* the radius
    // — the radius instantly, the colour over 130ms. Clicking a range showed
    // every cell snapping to `rounded-md` while still painted dark, which read
    // as a flash of fully-rounded selected days. Hover is the only thing here
    // that wants easing; selection is a state, not an animation.
    'transition-[border-color] duration-fast-min ease-standard',
    // Hover is a stroke and nothing else — the file adds no fill.
    'hover:border-surface-border-emphasized',
    ...focusRing,
    // The file's `State=Disabled` is opacity/opacity-50. Deliberately not
    // Button's 40: this is the value on the canvas.
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
  ],

  variants: {
    /**
     * Figma's `Type` axis, minus `Current` — a day can be today *and* outside
     * the visible month, so the two are independent here even though the file
     * has to spend a variant slot on each.
     */
    outside: {
      true: 'text-content-subtle',
      false: 'text-content-primary',
    },

    /**
     * Figma's five selection states, from `rangePosition`.
     *
     * The fill is solid `surface-background-emphasized` on **every** day of a
     * range, not a subtle wash — unusual, and what the file draws.
     *
     * `middle` has no radius and no side border, so a run reads as one
     * continuous bar. The file gives it a top and bottom stroke in
     * `Surface/Border Emphasized`, which is left off here: that token and
     * `Surface/Background Emphasized` resolve to the same value in both themes
     * (`--neutral-800` light, `--neutral-100` dark), so the stroke is
     * invisible against its own fill and exists on the canvas only to keep the
     * cell 32px tall next to its neighbours. Reproducing it would need a
     * side-suffixed color utility that `tokens.test.ts` cannot see.
     */
    selection: {
      none: 'rounded-md',
      single: 'rounded-md',
      start: 'rounded-l-md rounded-r-none',
      end: 'rounded-r-md rounded-l-none',
      middle: 'rounded-none',
    },

    /**
     * The current date: a raised white card. Drawn on top of it by the
     * component is the file's 2px `Highlight` bar.
     */
    today: {
      true: 'bg-surface-background-primary border-surface-border shadow-low',
      false: '',
    },
  },

  compoundVariants: [
    // The four selected states share one treatment; only the radius differs.
    {
      selection: ['single', 'start', 'end', 'middle'],
      class: [
        'bg-surface-background-emphasized border-surface-background-emphasized',
        'text-content-inverse font-semibold',
        // The hover stroke would be invisible on the fill and is not drawn.
        'hover:border-surface-background-emphasized',
      ],
    },
    /**
     * A selected day from a neighbouring month keeps the fill but steps back:
     * regular weight at 70% (the file's `opacity/opacity-70`), so a range that
     * runs off the end of the month still reads as continuous without the
     * outside days competing with the real ones.
     */
    {
      outside: true,
      selection: ['single', 'start', 'end', 'middle'],
      class: 'font-normal text-content-inverse/70',
    },
    /**
     * Today's card loses to any selection. The file draws no
     * `Current x Selected` combination, and the emphasized fill would swallow
     * both the white card and the marker bar above it.
     */
    {
      today: true,
      selection: ['single', 'start', 'end', 'middle'],
      class: 'bg-surface-background-emphasized border-surface-background-emphasized shadow-none',
    },
  ],

  defaultVariants: {
    outside: false,
    selection: 'none',
    today: false,
  },
})

/** The file's `Highlight` — a 2px rule across the top of today's cell. */
export const todayMarker = 'absolute inset-x-[5px] top-[3px] h-0.5 rounded-full bg-surface-border-emphasized'

/** One column heading. `_Day Header`, node 40004972:34947. */
export const dayHeader = 'flex h-6 w-10 shrink-0 items-center justify-center text-sm text-content-subtle'

/**
 * One month: the header, then the grid.
 *
 * 312 wide (`w-78`) and, in the file, 304 tall — 16px of padding either side of
 * a 280px block. The height is not set: it follows the row count, which is 5 or
 * 6 depending on the month. See `buildMonth` for why that is variable.
 */
export const monthBlock = 'flex w-78 shrink-0 flex-col gap-4 p-4'

/** The row holding the nav buttons and the caption. */
export const monthHeaderRow = 'flex w-full items-center'

/** "January 2025", centred between the two nav buttons. */
export const monthCaption = 'min-w-px flex-1 text-center text-base font-semibold text-content-emphasized'

/**
 * The grid.
 *
 * `role="grid"` on plain elements rather than a `<table>`, because the file's
 * 8px row gap is a flex `gap` and a table cannot have one: `border-collapse`
 * has no row spacing at all, and `border-separate` puts the same spacing
 * *around* the grid as between its rows, which would make the block 296 rather
 * than 280. The roles carry the same semantics either way.
 */
export const monthGrid = 'flex flex-col gap-2'
export const gridRow = 'flex'

/**
 * The panel — the `Date Picker` component itself, node 40004972:34964.
 *
 * `rounded-lg` (12px), `Elevation/Drop Shadow/Medium` (the same shadow
 * Popover's popup uses), and a 1px stroke as an `inset-ring` rather than a
 * `border`: Figma's stroke is `strokeAlign: INSIDE`, and the panel hugs its
 * contents, so a border would push it 2px past the file's 312 / 536 / 848.
 */
export const panel = [
  'inline-flex overflow-hidden font-sans',
  'rounded-lg bg-surface-background-primary shadow-medium',
  'inset-ring inset-ring-surface-border',
].join(' ')

/** The presets rail. `_Calendar Presets`, node 40004972:34989 — 224 wide. */
export const presetsRail = 'flex w-56 shrink-0 flex-col gap-2 border-r border-surface-border p-4'

/**
 * The footer. `_Footer`, node 40004972:34980.
 *
 * `flex-wrap` is what makes the file's two footers one component: at 624 the
 * date inputs and the actions sit on one row (88 tall), and at 312 they wrap to
 * two (136). The `min-w-70 max-w-80` on the inputs is what decides where.
 */
export const footer = [
  'flex flex-wrap items-end justify-between gap-2 gap-y-4',
  'border-t border-surface-border px-4 pt-2 pb-4',
  /**
   * `-mt-px` is what makes the rule an INSIDE stroke.
   *
   * Figma draws it `strokeAlign: INSIDE`, so it occupies the footer's own first
   * pixel row and the footer is 136 tall. A CSS `border-t` on an auto-height
   * element adds its pixel *outside* the padding box, which made the panel 441
   * where the file says 440. Pulling the footer up by exactly that pixel lands
   * the rule on the boundary itself — where Figma draws it — and the sums come
   * out whole again.
   *
   * Safe to overlap: the pixel it covers is the calendar's own bottom padding,
   * and the footer paints no background of its own.
   */
  '-mt-px',
].join(' ')

export type DayButtonVariants = VariantProps<typeof dayButton>
