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

/**
 * Where a radial bar chart's hole starts, as a fraction of its outer radius.
 *
 * Figma's `_Radial / Radial` track (`40004450:16871`) is drawn at 256px with a
 * 64px hole: **0.25**, against Donut's 0.72 and Gauge's 0.8. The three differ
 * because they are three different forms, not three settings of one — a donut is
 * a band, a gauge is an arch, and a radial bar is a set of concentric tracks that
 * needs most of the radius to hold them.
 */
export const RADIAL_INNER_RATIO = 0.25

/**
 * The gap between one ring and the next, in px.
 *
 * Read off the same track: bands of 16 separated by 4, with the outermost
 * touching 128 and the innermost touching 32. `5 × 16 + 4 × 4 = 96 = 128 − 32`,
 * which is exact — and the arc component agrees from the other side, since
 * `_Radial / Slice Sweep` (`40004355:41213`) has `arcData.innerRadius` of
 * 0.8751687, or `128 × (1 − 0.87517) = 15.98`.
 *
 * **One drawing can hide two rules, and this one did.** 16 and 4 in a 256 box
 * with 5 rings is equally consistent with "the band is always 16" and with "the
 * hole is always a quarter". The second is the library's existing idiom — Donut
 * and Gauge both pin a *ratio* — so the hole is the constant and the band is
 * what is left over. At five rings the two readings are identical; they only
 * diverge at another count, which is exactly why the choice had to be made
 * deliberately rather than discovered later.
 */
export const RADIAL_TRACK_GAP = 4

/**
 * The rounded end of a bar. Figma binds `border-radius/rounded-xs` on the arc,
 * and it is the reason the arc measures 12px thick where a screenshot happens to
 * cross its cap rather than its middle.
 */
export const RADIAL_CORNER_RADIUS = 4

/**
 * Twelve o'clock, clockwise — the same as `Donut`, and for the same reason: a
 * reader expects the first bar to start where a clock hand starts. Recharts
 * measures counter-clockwise from three o'clock, so twelve is 90 and clockwise
 * means counting down to -270.
 */
export const RADIAL_START_ANGLE = 90
export const RADIAL_END_ANGLE = -270

/**
 * Room to leave outside the outermost ring, and deliberately **not**
 * `POLAR_MARGIN`.
 *
 * That constant reserves space for the hover halo Figma draws outside a donut.
 * A radial bar has no halo in the file, and nothing is painted outside the
 * outermost bar — the arcs carry a fill and no stroke — so borrowing it would
 * shrink every chart to leave room for something never drawn.
 *
 * What *is* needed is half a gap, and the reason is the one thing here that
 * cannot be made to match Figma exactly. Recharts centers each bar in its band,
 * so it insists on half a gap of padding outside the outermost one; Figma's
 * outermost band sits flush against the frame's edge. The chart therefore hands
 * Recharts a range inflated by `RADIAL_TRACK_GAP / 2` at each end, and gives up
 * that much radius to do it. The ratios are the file's; the outer radius is
 * three pixels short of the box, and no arrangement of the two recovers it.
 *
 * The extra pixel is slack for Recharts' rounding.
 */
export const RADIAL_MARGIN = RADIAL_TRACK_GAP / 2 + 1

/**
 * A radial bar chart's radii and bar thickness.
 *
 * **The two radii returned are Recharts' props, not the drawn edges**, and the
 * difference is half a gap at each end. Recharts divides `outerRadius -
 * innerRadius` into one band per row and centers each bar in its band, so it
 * leaves half a gap of padding at both extremes. Figma's track has none: its
 * outermost band touches the outer edge and its innermost touches the hole. So
 * the range handed to Recharts is inflated by `RADIAL_TRACK_GAP / 2` on each
 * side, and the padding it then adds lands the drawn bars exactly on the edges
 * the file draws.
 *
 * Reproduces the file at five rings in a 256px box — 16px bands, 4px gaps, a
 * 32px hole — to within `RADIAL_MARGIN`.
 *
 * Returns zeros before measurement, rather than a negative radius, which
 * Recharts renders as an empty chart.
 */
export function radialGeometry(
  plotWidth: number,
  height: number,
  count: number,
): { innerRadius: number; outerRadius: number; barSize: number; ringInner: number; ringOuter: number } {
  const none = { innerRadius: 0, outerRadius: 0, barSize: 0, ringInner: 0, ringOuter: 0 }
  if (plotWidth <= 0 || height <= 0 || count <= 0) return none

  const ringOuter = Math.min(plotWidth, height) / 2 - RADIAL_MARGIN
  if (ringOuter <= 0) return none

  const ringInner = ringOuter * RADIAL_INNER_RATIO
  // One band per ring, and one gap *between* each pair — so `count` bands and
  // `count - 1` gaps have to fit between the hole and the edge.
  const band = (ringOuter - ringInner + RADIAL_TRACK_GAP) / count
  const barSize = band - RADIAL_TRACK_GAP
  if (barSize <= 0) return none

  return {
    innerRadius: ringInner - RADIAL_TRACK_GAP / 2,
    outerRadius: ringOuter + RADIAL_TRACK_GAP / 2,
    barSize,
    ringInner,
    ringOuter,
  }
}
