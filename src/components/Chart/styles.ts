/**
 * Recipes shared across the chart family.
 *
 * Separate from the components for the reason every other `styles.ts` in this
 * library is — `Menu`'s, `Combobox`'s, `Input`'s — plus one specific to this
 * file: a module that exports both a component and a constant breaks Fast
 * Refresh, so the constant moves out rather than the warning being suppressed.
 */

/**
 * The style Recharts puts on its tooltip wrapper. One object, used by every
 * chart in the library.
 *
 * ## The motion half
 *
 * Recharts otherwise writes `transition: transform 400ms` inline. That is a
 * motion value living in JavaScript where Figma cannot reach it — the thing the
 * motion tokens exist to prevent — and it is close enough to
 * `--transition-duration-medium` (410ms) to look like it came from the system
 * when it did not. Every chart passes `isAnimationActive={false}` to turn that
 * off, and this puts the movement back in the library's own tokens, read as
 * custom properties rather than copied as numbers.
 *
 * `fast` rather than `medium`, because the card is chasing a crosshair that
 * moves instantly and a slower slide reads as lag.
 *
 * ## The layering half
 *
 * A donut's total and a gauge's figure are rendered through `ChartContainer`'s
 * `overlay`, which is a **sibling after** the plot — so by document order it
 * painted on top of the tooltip, and hovering a slice put the tooltip *behind*
 * the number in the middle.
 *
 * This is deliberately **not** `overlayLayer` from `src/lib/layers.ts`. That
 * constant is for popups portalled to `<body>`, which have to out-rank arbitrary
 * page content. This tooltip is a child of the chart and only ever competes with
 * the chart's own overlay, so it takes a small local value and stays contained.
 * Borrowing the portal layer here would put a chart tooltip above a Toast.
 *
 * ## Why it is a style and not a class
 *
 * Recharts puts `wrapperClassName` on its **default tooltip content**, not on
 * `Tooltip`. Passing it to `Tooltip` type-checks and then does nothing at all,
 * which is exactly the kind of silent failure this codebase keeps a list of.
 * `wrapperStyle` is the one that lands.
 *
 * The values are still the tokens, read as custom properties rather than copied
 * as numbers, so Figma stays the source of truth — and the reduced-motion clamp
 * in `theme.css` is `!important` on `*`, which outranks an inline declaration,
 * so this still collapses to 1ms when it should.
 */
export const chartTooltipWrapperStyle = {
  transitionProperty: 'transform',
  transitionDuration: 'var(--transition-duration-fast)',
  transitionTimingFunction: 'var(--ease-standard)',
  zIndex: 10,
} as const
