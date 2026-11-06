import { categorical, placeholder } from '../Chart/palette'

export interface StackedBarSegment {
  /** The name a human reads. It goes into the bar's accessible name, not onto the bar. */
  label: string
  /** How much of the whole this part is. Any unit; only the proportions are drawn. */
  value: number
  /**
   * Override the color. The default is this segment's position in the
   * categorical scale. Reach for it when the parts are themselves a scale, such
   * as health or status, or a Mono breakdown.
   */
  color?: string
}

export interface ResolvedSegment {
  label: string
  value: number
  color: string
}

/** A finite value above zero, or nothing at all. */
function drawable(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * The parts that get drawn, in the order given.
 *
 * Color is assigned over the **full** list and only then are the empty parts
 * dropped. It is the rule the chart family keeps with its hidden series: a
 * segment reaching zero must not repaint the ones after it.
 *
 * With nothing to draw, one placeholder fills the bar, so the row keeps its
 * shape and "nothing yet" does not read as a broken component.
 */
export function resolveSegments(segments: readonly StackedBarSegment[]): ResolvedSegment[] {
  const resolved = segments
    .map((segment, index) => ({
      label: segment.label,
      value: drawable(segment.value),
      color: segment.color ?? categorical(index),
    }))
    .filter((segment) => segment.value > 0)

  return resolved.length > 0 ? resolved : [{ label: '', value: 1, color: placeholder }]
}

/** "Open work: Done 25%, To do 75%". Written out because a role="img" hides its parts. */
export function describeSegments(
  label: string,
  segments: readonly StackedBarSegment[],
  formatValue?: (value: number) => string,
): string {
  const total = segments.reduce((sum, segment) => sum + drawable(segment.value), 0)
  if (total === 0) return `${label}: no data`

  const parts = segments
    .filter((segment) => drawable(segment.value) > 0)
    .map((segment) => {
      const value = formatValue
        ? formatValue(segment.value)
        : `${Math.round((segment.value / total) * 100)}%`
      return `${segment.label} ${value}`
    })

  return `${label}: ${parts.join(', ')}`
}
