/**
 * The polar charts' shared geometry — Donut, Gauge and Radar.
 *
 * These three are one family in Figma and one family here: they measure from a
 * center outward rather than along an axis, so none of `axes.ts` applies to
 * them and all of the numbers below are theirs alone.
 *
 * Every value is read off the Figma file rather than chosen. The ring ratios in
 * particular look arbitrary and are not: they are what makes a donut read as a
 * ring rather than a wheel, and they differ between the two charts on purpose.
 */

/**
 * Where a donut's hole starts, as a fraction of its outer radius.
 *
 * Figma's `_Donut / Slice Sweep` arc: `innerRadius: 0.72`. On a 256px donut that
 * is a 36px band — thick enough to carry a color, thin enough that the eye
 * compares arc *lengths* rather than areas, which is the only reason a donut is
 * more honest than a pie.
 */
export const DONUT_INNER_RATIO = 0.72

/**
 * The same, for a gauge: Figma's `_Gauge / Slice Sweep` uses **0.8**.
 *
 * Thinner than the donut, and deliberately. A gauge is a half circle, so its
 * band is stretched over 180° instead of 360° — at the donut's ratio it reads as
 * a heavy arch rather than a gauge, and it crowds the figure that sits inside
 * it.
 */
export const GAUGE_INNER_RATIO = 0.8

/** A gauge sweeps left to right across the top: 180° round to 0°. */
export const GAUGE_START_ANGLE = 180
export const GAUGE_END_ANGLE = 0

/**
 * A donut starts at twelve o'clock and goes clockwise, which is what Figma
 * draws and what a reader expects — the first and largest slice should begin
 * where a clock hand starts.
 *
 * Recharts measures angles counter-clockwise from three o'clock, so twelve is
 * 90 and clockwise means counting *down* to -270.
 */
export const DONUT_START_ANGLE = 90
export const DONUT_END_ANGLE = -270

/**
 * The surface-colored stroke that separates one slice from the next.
 *
 * Figma strokes every slice in `Surface/Background Primary` — the same
 * "let white do the separating" move as the stacked bar's gap and the solid
 * area's top edge. Three charts, one idea, and it is worth recognizing: the
 * alternative is a border, which is ink that is not data.
 */
export const SLICE_GAP = 2

/**
 * The hover halo: a thin arc of the series color sitting just outside the
 * slice you are pointing at.
 *
 * Figma builds it as a second ellipse at 268 against the donut's 256 with
 * `innerRadius: 0.97`, held at `opacity: 0` in the Default state and `1` in
 * Hover. So it is 2px clear of the ring and 4px thick.
 *
 * It sits **outside** rather than growing the slice, which matters: enlarging
 * the hovered slice would change the one thing the chart encodes, so pointing at
 * a slice would appear to change its value.
 */
export const HALO_GAP = 2
export const HALO_THICKNESS = 4

/**
 * The radar area fill.
 *
 * Figma sets `opacity: 0.4` on the whole area vector — fill *and* stroke — and
 * the stroke is 2px. That the outline still reads stronger than the fill is not
 * a second opacity: it is the 2px stroke compositing over the fill beneath it,
 * so the edge lands near 0.64 while the interior stays at 0.4.
 *
 * Worth knowing before "fixing" the stroke to full opacity: at full strength the
 * outlines stop looking like they belong to translucent shapes and start looking
 * like five separate outlined polygons.
 */
export const RADAR_FILL_OPACITY = 0.4
export const RADAR_STROKE_OPACITY = 0.4
export const RADAR_STROKE_WIDTH = 2

/**
 * Radar rings. Figma draws concentric polygons at 96, 136, 176, 216 and 256 —
 * five rings, evenly stepped by 40.
 */
export const RADAR_RINGS = 5

/**
 * Room to leave outside the ring, in px.
 *
 * **The halo is drawn outside the slice, so a chart sized to fill its box has
 * nowhere to put it** — the arc reaches the edge of the SVG and the halo is
 * simply cut off, top and bottom. That was the bug: a donut looked correct until
 * you hovered it, and a gauge's apex was clipped even at rest, because the
 * separator stroke straddles the outer edge and half of it fell outside too.
 *
 * `HALO_GAP + HALO_THICKNESS` is what the halo needs; half of `SLICE_GAP` is
 * what the stroke needs; the last pixel is slack, because Recharts rounds and a
 * chart clipped by a fraction of a pixel is the same bug at a size nobody can
 * see but everybody notices.
 */
export const POLAR_MARGIN = HALO_GAP + HALO_THICKNESS + SLICE_GAP / 2 + 1

/**
 * A donut's outer radius: half the smaller dimension, less the room the halo
 * needs.
 *
 * Returns 0 when it has not been measured yet or the box is too small to draw
 * in — the caller falls back to a percentage rather than passing a negative
 * radius, which Recharts renders as an empty chart.
 */
export function donutRadius(plotWidth: number, height: number): number {
  if (plotWidth <= 0 || height <= 0) return 0
  return Math.max(0, Math.min(plotWidth, height) / 2 - POLAR_MARGIN)
}

/**
 * A gauge's center and radius.
 *
 * Two things Recharts cannot work out on its own. **The radius** is
 * `min(width / 2, height)` rather than `min(width, height) / 2`, because a half
 * circle needs `R` of height but `2R` of width — Recharts' rule is for a full
 * circle and leaves a gauge at roughly half the size it should be.
 *
 * **The center** sits just above the bottom edge rather than on it. The arc's
 * flat ends are radial, so their separator stroke straddles the baseline and
 * half of it would fall outside the box.
 */
export function gaugeGeometry(plotWidth: number, height: number): { cy: number; outerRadius: number } {
  if (plotWidth <= 0 || height <= 0) return { cy: 0, outerRadius: 0 }

  const cy = height - SLICE_GAP
  const outerRadius = Math.max(0, Math.min(plotWidth / 2 - POLAR_MARGIN, cy - POLAR_MARGIN))
  return { cy, outerRadius }
}
