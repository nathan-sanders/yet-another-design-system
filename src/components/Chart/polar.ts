/**
 * The polar charts' shared geometry — Donut, Gauge and Radar.
 *
 * These three are one family in Figma and one family here: they measure from a
 * centre outward rather than along an axis, so none of `axes.ts` applies to
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
 * is a 36px band — thick enough to carry a colour, thin enough that the eye
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
 * The surface-coloured stroke that separates one slice from the next.
 *
 * Figma strokes every slice in `Surface/Background Primary` — the same
 * "let white do the separating" move as the stacked bar's gap and the solid
 * area's top edge. Three charts, one idea, and it is worth recognising: the
 * alternative is a border, which is ink that is not data.
 */
export const SLICE_GAP = 2

/**
 * The hover halo: a thin arc of the series colour sitting just outside the
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
