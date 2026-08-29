import { monoScales, type ChartMonoScale } from '../Chart'

/**
 * Turning a value into a step of a sequential ramp.
 *
 * A heat map's whole encoding is this function, so it lives on its own and is
 * unit-tested. Every edge here produced a wrong-looking chart at some point in
 * other people's heat maps, and none of them is visible in a screenshot: a cell
 * one step too dark looks exactly like a cell with a slightly higher value.
 */

/** Figma's ramps are ten steps. */
export const HEAT_STEPS = monoScales.a.length

export interface HeatScaleOptions {
  /** Which ramp. Figma's example uses A (purple). */
  scale?: ChartMonoScale
  /** Force the low end. Defaults to the smallest value present. */
  min?: number
  /** Force the high end. Defaults to the largest value present. */
  max?: number
}

/**
 * Build a value → colour function over `values`.
 *
 * **The domain is computed once, over the whole grid**, rather than per row or
 * per column. A per-row scale would make every row's darkest cell equally dark
 * and destroy the comparison the chart exists for — the single most common way
 * a heat map is made meaningless.
 *
 * `min` and `max` override it, which is what a caller needs to hold the scale
 * still across two charts that must be compared, or to pin zero at the bottom.
 */
export function heatScale(values: readonly number[], { scale = 'a', min, max }: HeatScaleOptions = {}) {
  const steps = monoScales[scale]
  const finite = values.filter((v) => Number.isFinite(v))

  const low = min ?? (finite.length ? Math.min(...finite) : 0)
  const high = max ?? (finite.length ? Math.max(...finite) : 0)

  return function colorFor(value: number | null | undefined): string | null {
    // A missing value is not a zero. Figma draws nothing at all for an empty
    // cell, and painting it the lightest step would claim a measurement of
    // "almost none" where there was no measurement.
    if (value === null || value === undefined || !Number.isFinite(value)) return null

    // A flat grid has no range to spread over. Every cell is the same, and the
    // honest answer is the top of the ramp rather than a division by zero.
    if (high === low) return steps[steps.length - 1]

    const t = (value - low) / (high - low)
    // Clamp first: an explicit `min`/`max` narrower than the data is a
    // deliberate choice, and the out-of-range cells belong at the ends rather
    // than off the end of the array.
    const index = Math.round(Math.min(1, Math.max(0, t)) * (steps.length - 1))
    return steps[index]
  }
}
