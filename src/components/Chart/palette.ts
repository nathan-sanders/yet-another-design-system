/**
 * The chart color scales, as CSS variable references.
 *
 * ## Why these are plain strings and not Tailwind classes
 *
 * Recharts sets color through SVG attributes — `stroke`, `fill` — that take a
 * value, not a class. So a series color is the string
 * `var(--data-viz-categorical-01)`, handed straight to the attribute, and the
 * browser resolves it.
 *
 * That is not a workaround; it is the better half of the deal. `--data-viz-*`
 * are the **semantic** tier from section 3 of `theme.css`: defined once at
 * `:root` and redefined in `.dark`. A mark painted with one of them follows the
 * theme with no `dark:` variant, no second palette and no JavaScript — the same
 * property every component in the library already relies on, arriving here for
 * free.
 *
 * **This is why shadcn's `ChartStyle` has no counterpart in YADS.** shadcn
 * injects a `<style>` block per chart mapping `--color-desktop` to a hex,
 * because its charts are handed raw colors and have nowhere theme-aware to put
 * them. This library has somewhere. Do not port that component; it would add a
 * second, worse copy of a tier that already exists.
 *
 * ## The Tailwind literal warning does *not* apply here
 *
 * `BentoGrid`'s span maps and `focus.ts` both carry a warning against building a
 * class name at runtime, because Tailwind generates utilities by scanning source
 * text and a computed class silently generates nothing. **That failure cannot
 * happen on this file**, because none of these strings is a class — Tailwind
 * never has to see them, and `--data-viz-categorical-01` is emitted by
 * `generate.py` from Figma whether or not anything references it.
 *
 * They are still written out in full rather than assembled from an index. The
 * reason is different and smaller: a written-out list is greppable, so renaming
 * a token in Figma and grepping `src` for the old name — the procedure the root
 * `CLAUDE.md` insists on — finds this file. An assembled string would not be
 * found by that grep, which is exactly how the `decorative-stone` rename reached
 * `main` unnoticed.
 */

/**
 * The twelve categorical series colors, in the order Figma assigns them.
 *
 * The order is fixed and is never sorted, reversed or cycled by rank. A color
 * belongs to a *series*, not to a position in a chart — so hiding series 2 must
 * leave series 3 the color it already had, or the legend a reader just learned
 * becomes a lie. Every consumer resolves color from the series' index in the
 * caller's `series` array, which does not move when one is toggled off.
 */
export const categoricalScale = [
  'var(--data-viz-categorical-01)',
  'var(--data-viz-categorical-02)',
  'var(--data-viz-categorical-03)',
  'var(--data-viz-categorical-04)',
  'var(--data-viz-categorical-05)',
  'var(--data-viz-categorical-06)',
  'var(--data-viz-categorical-07)',
  'var(--data-viz-categorical-08)',
  'var(--data-viz-categorical-09)',
  'var(--data-viz-categorical-10)',
  'var(--data-viz-categorical-11)',
  'var(--data-viz-categorical-12)',
] as const

/** How many distinct series the categorical scale can name. */
export const categoricalCount = categoricalScale.length

/**
 * The color for series `index`.
 *
 * **Past the twelfth series this returns the placeholder grey, and that is the
 * intended answer rather than a shortfall.** Wrapping back to color 01 would
 * hand two different series the same identity, which is worse than admitting
 * there is no color left: the reader cannot tell them apart and, unlike a grey,
 * nothing signals that they should stop trying. Figma reaches the same
 * conclusion from the other end — its `Chart Legend` carries a `+X more` row for
 * precisely this case.
 *
 * A thirteenth series is a signal to group the tail into an "other" series, to
 * facet into small multiples, or to filter. It is not a signal to grow the
 * scale: the twelve were chosen so that no two rely on lightness alone to
 * separate, and a thirteenth hue cannot be added without spending that.
 */
export function categorical(index: number): string {
  return categoricalScale[index] ?? placeholder
}

/**
 * The reference line a series is measured against — a target, last period, an
 * average. Deliberately chromaless in both themes, and pinned so it does *not*
 * follow the swappable neutral ramp: a benchmark should read as "not a series"
 * whatever the UI neutral is, and a tinted grey next to twelve hues reads as a
 * thirteenth category. The root `CLAUDE.md` records these four as the only
 * `@Neutral/*` references left in the semantic layer, and keeping them that way
 * is the invariant.
 */
export const benchmark = 'var(--data-viz-categorical-benchmark)'

/** A second benchmark, for when a chart shows both a target and a prior period. */
export const benchmarkAlt = 'var(--data-viz-categorical-benchmark-alt)'

/** Empty, loading or beyond-the-scale data. Never an identity. */
export const placeholder = 'var(--data-viz-categorical-placeholder)'

/**
 * Sentiment, which is a *scale*, not three more categories.
 *
 * These are reserved: a chart that means "good / neutral / bad" uses them, and a
 * chart that means "product A / B / C" must not, however conveniently three
 * series map onto three colors. Reusing them makes a neutral series read as a
 * verdict on itself.
 */
export const sentiment = {
  positive: 'var(--data-viz-sentiment-positive)',
  neutral: 'var(--data-viz-sentiment-neutral)',
  negative: 'var(--data-viz-sentiment-negative)',
} as const

/**
 * The border that separates a mark from its ground when its own color cannot.
 *
 * Three of the twelve categorical colors fall short of 3:1 on the light canvas
 * — `04` Yellow at 1.74:1, `03` Emerald at 2.25:1, `10` Green at 2.95:1. The
 * root `CLAUDE.md` records this as a known, accepted, parked state: **do not
 * "fix" it by changing a token.** This border is the sanctioned mitigation, and
 * the outline marker styles exist for the same reason.
 */
export const accessibilityOverlay = 'var(--data-viz-utility-accessibility-overlay)'

/**
 * The crosshair and the band that follow the pointer across a chart.
 *
 * The same token, and deliberately: a hover highlight has exactly the job the
 * accessibility overlay was made for — sitting over the data and staying
 * visible against whatever is under it, in either theme, without being ink that
 * competes with the marks.
 *
 * **It used to be `gridline`, and that was too light to see.** A gridline is
 * scenery a reader is supposed to look past; a cursor is a thing they are
 * actively following, and reusing the quietest color in the chart for the one
 * element that has to track the pointer had it disappearing over the data. The
 * two are one step apart in the token file and a world apart in what they are
 * for.
 */
export const cursorHighlight = accessibilityOverlay

/**
 * The chart surface. Used where a mark has to punch a hole in itself — the
 * background disc under an outline marker, the gap between stacked segments —
 * so the separation is made of surface rather than of extra ink.
 */
export const surface = 'var(--surface-background-primary)'

/** Gridlines. One step off the surface, recessive on purpose. */
export const gridline = 'var(--surface-border)'

/** The baseline an axis is measured from — heavier than a gridline. */
export const axisLine = 'var(--surface-border-emphasized)'

/**
 * The three sequential ramps, ten steps each, light to dark.
 *
 * A sequential ramp encodes **magnitude**, not identity: one hue, getting
 * darker as the value grows. It is what a heat map's cells and a continuous
 * legend are painted with, and it is never a source of categorical colors —
 * two steps of one hue differ only in lightness, which is the separator the
 * twelve categorical colors were specifically chosen not to depend on.
 *
 * Three of them exist so a view can carry two or three magnitude scales at once
 * without either of them borrowing a series color.
 */
export const monoScales = {
  a: [
    'var(--data-viz-mono-a01)',
    'var(--data-viz-mono-a02)',
    'var(--data-viz-mono-a03)',
    'var(--data-viz-mono-a04)',
    'var(--data-viz-mono-a05)',
    'var(--data-viz-mono-a06)',
    'var(--data-viz-mono-a07)',
    'var(--data-viz-mono-a08)',
    'var(--data-viz-mono-a09)',
    'var(--data-viz-mono-a10)',
  ],
  b: [
    'var(--data-viz-mono-b01)',
    'var(--data-viz-mono-b02)',
    'var(--data-viz-mono-b03)',
    'var(--data-viz-mono-b04)',
    'var(--data-viz-mono-b05)',
    'var(--data-viz-mono-b06)',
    'var(--data-viz-mono-b07)',
    'var(--data-viz-mono-b08)',
    'var(--data-viz-mono-b09)',
    'var(--data-viz-mono-b10)',
  ],
  c: [
    'var(--data-viz-mono-c01)',
    'var(--data-viz-mono-c02)',
    'var(--data-viz-mono-c03)',
    'var(--data-viz-mono-c04)',
    'var(--data-viz-mono-c05)',
    'var(--data-viz-mono-c06)',
    'var(--data-viz-mono-c07)',
    'var(--data-viz-mono-c08)',
    'var(--data-viz-mono-c09)',
    'var(--data-viz-mono-c10)',
  ],
} as const

/** Which sequential ramp a continuous scale is drawn from. */
export type ChartMonoScale = keyof typeof monoScales
