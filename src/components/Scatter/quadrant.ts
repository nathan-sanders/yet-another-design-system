/**
 * The quadrant form's arithmetic, kept pure so it can be tested.
 *
 * A quadrant chart says one thing the plain scatter does not: **which of four
 * boxes a point is in.** The crosshair encodes it visually, the hidden data
 * table has to say it in words, and a point put in the wrong box renders as a
 * perfectly plausible chart — `HeatMap`'s reason for testing the arithmetic
 * rather than the picture.
 */

/** Where the crosshair sits, in data units. */
export interface QuadrantThresholds {
  x: number
  y: number
}

/** The four end labels, by the end of the axis they name. */
export interface QuadrantLabels {
  /** The top of the y axis — "High impact". */
  top?: string
  /** The bottom of the y axis. */
  bottom?: string
  /** The left end of the x axis. */
  left?: string
  /** The right end of the x axis. */
  right?: string
}

export interface QuadrantOptions {
  /** The x threshold. Defaults to the midpoint of the x domain. */
  x?: number
  /** The y threshold. Defaults to the midpoint of the y domain. */
  y?: number
  labels?: QuadrantLabels
}

/** The four boxes, named by position rather than by meaning — the labels supply the meaning. */
export type Quadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Resolve the thresholds a caller may have left out to the midpoint of each
 * axis domain. The domain is the *drawn* one — after the zero floor and the
 * rounded top — so a default crosshair splits the plot in half by pixels, which
 * is what a reader expects of a line with no number beside it.
 */
export function resolveThresholds(
  options: QuadrantOptions,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
): QuadrantThresholds {
  return {
    x: options.x ?? (xDomain[0] + xDomain[1]) / 2,
    y: options.y ?? (yDomain[0] + yDomain[1]) / 2,
  }
}

/**
 * Which box a point is in.
 *
 * A point exactly on a line goes **up and to the right** — `>=` on both axes.
 * Some rule has to break the tie, and this one puts a point on the threshold
 * with the values it has *reached* rather than the ones it has left.
 */
export function quadrantOf(point: { x: number; y: number }, thresholds: QuadrantThresholds): Quadrant {
  const vertical = point.y >= thresholds.y ? 'top' : 'bottom'
  const horizontal = point.x >= thresholds.x ? 'right' : 'left'
  return `${vertical}-${horizontal}`
}

/**
 * The quadrant in words, from the end labels: "High impact · Low effort".
 *
 * Falls back to the positional name when the caller has not labeled that end,
 * so the table never has an empty cell.
 */
export function describeQuadrant(quadrant: Quadrant, labels: QuadrantLabels = {}): string {
  const [vertical, horizontal] = quadrant.split('-') as ['top' | 'bottom', 'left' | 'right']
  const first = labels[vertical] ?? vertical
  const second = labels[horizontal] ?? horizontal
  return `${first} · ${second}`
}
