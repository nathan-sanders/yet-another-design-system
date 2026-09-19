import type { ReactElement } from 'react'

/**
 * The marker shape vocabulary, as SVG.
 *
 * Eleven shapes — five forms in a solid and an outline pair, plus an X — drawn
 * once here and used at two very different sizes: **24px** inside a legend or
 * tooltip `Swatch`, and **8–9px** as a plot point on a line. Figma models these
 * as two separate component sets (`_Swatch`, `_Line Series / Plot Point`)
 * because a Figma component cannot be parameterized by a number; in code they
 * are one function and a `size`.
 *
 * ## The nominal-12 space
 *
 * Every shape is defined around the origin in a space where the *square* is 12
 * units across, and is then scaled by `size / 12`. Twelve is not arbitrary: it
 * is the square's width in Figma's 24px swatch, and the other shapes are sized
 * relative to it there — circle 13, hexagon 12 × 13.4, triangle 14.1 × 12.9,
 * diamond 14.1 × 14.1, X 11.4 with its stroke. Those ratios are what make the set look like one
 * family, so they are preserved rather than each shape being fitted to a box.
 *
 * The scale factor checks out against Figma's own second size: the plot point's
 * square is 8, so the factor is 8/12, which puts the circle at 13 × 8/12 = 8.67
 * — and Figma's plot-point circle is 9. The set was drawn to scale, so scaling
 * it is the faithful move rather than an approximation.
 *
 * ## Stroke width is a parameter, never derived
 *
 * The outline shapes are 2px in the swatch and **1.5px** on a plot point — not
 * 2 × 8/12 = 1.33, which is what scaling would have predicted. A stroke is not
 * geometry and cannot be inferred from the shape's size; both numbers were read
 * off the file. (The same trap is written up in the Figma notes: one variant's
 * geometry gives you spacing, never a stroke weight.)
 *
 * ## How an outline shape hides what is under it
 *
 * An outline marker is **not** a shape with no fill. It is filled with the
 * *surface* color and stroked with the series color, exactly as Figma draws it
 * — its outline variants each carry a `Background` layer beneath the ring. That
 * matters wherever markers overlap or a marker sits on its own line: an unfilled
 * ring would show the line straight through its middle and stop reading as a
 * distinct mark.
 *
 * ## The ring sits inside the shape, and the corners are rounded
 *
 * Two things a first version got wrong, both caught by Nathan against the
 * file on 2026-09-18. An outline marker is the **same size as its solid
 * twin** — Figma's ring is an inside stroke, so the outer edge of a hollow
 * square is 12 across like the filled one, and the ring eats inward. Stroking
 * the full-size geometry down the middle, as SVG does by default, grew every
 * hollow shape by the stroke width. So the path is inset by half the stroke
 * before it is stroked.
 *
 * And the corners are rounded: 2px on the square, triangle and hexagon at
 * swatch size, 1.75 on the diamond (Figma's own number — what a 2px radius
 * becomes on a square rotated forty-five degrees), and on a plot point the
 * triangle and hexagon keep their 2 while the square and diamond are sharp.
 * Those are read per shape per size, not scaled, for the same reason a stroke
 * weight is not: a corner radius is not geometry. `roundedPolygon` is what
 * draws them — an arc at each vertex, tangent to both edges — and an outline
 * shape's path radius is the outer radius less half the ring, so the ring's
 * outer edge lands on the file's curve and its inner edge is sharp, exactly
 * as Figma's flattened inside stroke is.
 */

/** The shapes a series marker can take. Figma's `_Swatch` `Style` axis, less the three line styles. */
export type ChartMarker =
  | 'square'
  | 'squareOutline'
  | 'circle'
  | 'circleOutline'
  | 'triangle'
  | 'triangleOutline'
  | 'hexagon'
  | 'hexagonOutline'
  | 'diamond'
  | 'diamondOutline'
  | 'x'

/** Every marker, in Figma's order. Useful for stories and for cycling defaults. */
export const chartMarkers: readonly ChartMarker[] = [
  'square',
  'squareOutline',
  'circle',
  'circleOutline',
  'triangle',
  'triangleOutline',
  'hexagon',
  'hexagonOutline',
  'diamond',
  'diamondOutline',
  'x',
] as const

/**
 * The default marker for series `index`.
 *
 * Markers cycle where colors do not, and the asymmetry is deliberate. A color
 * repeated across two visible series is ambiguous — that is why `categorical()`
 * stops at twelve. A *shape* repeated is not, because the color is still
 * telling them apart; the shape is a second channel, and a second channel that
 * runs out is still better than none. Eleven shapes against twelve colors means
 * the pair only repeats at the twelfth series, by which point the chart has
 * bigger problems.
 *
 * Having a shape at all is the point: it is what keeps identity legible for a
 * reader who cannot separate two hues, and in grayscale print.
 */
export function markerForIndex(index: number): ChartMarker {
  return chartMarkers[index % chartMarkers.length]
}

/** Whether a marker is drawn as a ring over the surface rather than a solid fill. */
export function isOutlineMarker(marker: ChartMarker): boolean {
  return marker.endsWith('Outline')
}

/** The nominal square width every other shape is proportioned against. */
const NOMINAL = 12

/** Half-extents in nominal-12 space, straight off the Figma file. */
const CIRCLE_R = 6.5 // 13 across
const TRIANGLE_HALF_W = 7.05 // 14.1 across
const TRIANGLE_HALF_H = 6.45 // 12.9 tall
const HEXAGON_HALF_W = 6 // 12 across
const HEXAGON_HALF_H = 6.7 // 13.4 tall, point-up
const DIAMOND_HALF = 7.05 // 14.1 across
// The X's *centerline*: 10 across. Figma's flattened stroke measures 11.4
// because the 2px arms' square ends stick out by √2 at each corner, so the arms
// only land on the file's 11.4 when they are drawn 10 wide. The first version
// used 11.4 here and drew every X a third too big.
const X_HALF = 5

type Point = readonly [number, number]

/**
 * Corner radii, read off the file per shape and per size. The swatch row is
 * `_Swatch` (a 12 square); the point row is `_Line Series / Plot Point` (an 8
 * square), where the file leaves the square and the diamond sharp. Anything at
 * or above swatch size takes the swatch's numbers — the scatter's hovered point
 * is drawn at 12 and is the swatch shape by design.
 */
const SWATCH_RADII = {
  square: 2,
  triangle: 2,
  hexagon: 2,
  diamond: 1.75,
} as const
const POINT_RADII = { square: 0, triangle: 2, hexagon: 2, diamond: 0 } as const

function cornerRadius(shape: keyof typeof SWATCH_RADII, size: number): number {
  return size >= NOMINAL ? SWATCH_RADII[shape] : POINT_RADII[shape]
}

/**
 * Move every edge of a convex polygon inward by `d`. Each edge's line is shifted
 * along its inward normal and the new vertices are where neighboring shifted
 * lines meet — so a triangle stays a triangle with the same angles, which a
 * uniform scale toward the bounding-box center would not give it.
 */
function insetPolygon(points: readonly Point[], d: number): Point[] {
  if (d === 0) return [...points]
  const n = points.length
  // Winding: positive area in SVG's y-down space means the vertices run clockwise on screen.
  let area = 0
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % n]
    area += x1 * y2 - x2 * y1
  }
  const sign = area > 0 ? 1 : -1

  const lines = points.map((p, i) => {
    const q = points[(i + 1) % n]
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len = Math.hypot(dx, dy)
    // Inward normal for this winding.
    const nx = (sign * -dy) / len
    const ny = (sign * dx) / len
    return { px: p[0] + nx * d, py: p[1] + ny * d, dx, dy }
  })

  return lines.map((_, i) => {
    const a = lines[(i - 1 + n) % n]
    const b = lines[i]
    // Intersect line a (through a.p, direction a.d) with line b.
    const det = a.dx * b.dy - a.dy * b.dx
    const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / det
    return [a.px + a.dx * t, a.py + a.dy * t] as const
  })
}

/**
 * A closed path around a convex polygon with each corner replaced by a circular
 * arc of radius `r`, tangent to both edges. The tangent points sit
 * `r / tan(θ / 2)` from the vertex, where θ is the interior angle — so a sharp
 * corner keeps more of its edge than a wide one, which is what Figma's corner
 * radius does too.
 */
function roundedPolygon(points: readonly Point[], r: number): string {
  const n = points.length
  if (r <= 0)
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join('') + 'Z'

  let area = 0
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % n]
    area += x1 * y2 - x2 * y1
  }
  const sweep = area > 0 ? 1 : 0

  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const v = points[i]
    const next = points[(i + 1) % n]
    const ax = prev[0] - v[0]
    const ay = prev[1] - v[1]
    const bx = next[0] - v[0]
    const by = next[1] - v[1]
    const la = Math.hypot(ax, ay)
    const lb = Math.hypot(bx, by)
    const theta = Math.acos((ax * bx + ay * by) / (la * lb))
    // Never let two fillets on one edge overlap.
    const t = Math.min(r / Math.tan(theta / 2), la / 2, lb / 2)
    const radius = t * Math.tan(theta / 2)
    const p1 = [v[0] + (ax / la) * t, v[1] + (ay / la) * t]
    const p2 = [v[0] + (bx / lb) * t, v[1] + (by / lb) * t]
    parts.push(`${i === 0 ? 'M' : 'L'}${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`)
    parts.push(
      `A${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 ${sweep} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`,
    )
  }
  return parts.join('') + 'Z'
}

function scaled(points: readonly Point[], scale: number): Point[] {
  return points.map(([x, y]) => [x * scale, y * scale] as const)
}

/** The box a rounded polygon actually paints, found by walking each corner's arc. */
function roundedBounds(points: readonly Point[], r: number) {
  const n = points.length
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  const take = (x: number, y: number) => {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const v = points[i]
    const next = points[(i + 1) % n]
    const ax = prev[0] - v[0],
      ay = prev[1] - v[1]
    const bx = next[0] - v[0],
      by = next[1] - v[1]
    const la = Math.hypot(ax, ay),
      lb = Math.hypot(bx, by)
    const theta = Math.acos((ax * bx + ay * by) / (la * lb))
    const t = Math.min(r / Math.tan(theta / 2), la / 2, lb / 2)
    const radius = t * Math.tan(theta / 2)
    // Arc center: along the bisector, radius / sin(θ/2) from the vertex.
    const ux = ax / la + bx / lb,
      uy = ay / la + by / lb
    const ul = Math.hypot(ux, uy)
    const cx = v[0] + (ux / ul) * (radius / Math.sin(theta / 2))
    const cy = v[1] + (uy / ul) * (radius / Math.sin(theta / 2))
    const p1 = [v[0] + (ax / la) * t, v[1] + (ay / la) * t]
    const p2 = [v[0] + (bx / lb) * t, v[1] + (by / lb) * t]
    // Sample the arc from p1 to p2 the short way round.
    const a1 = Math.atan2(p1[1] - cy, p1[0] - cx)
    let a2 = Math.atan2(p2[1] - cy, p2[0] - cx)
    if (a2 - a1 > Math.PI) a2 -= 2 * Math.PI
    if (a1 - a2 > Math.PI) a2 += 2 * Math.PI
    for (let k = 0; k <= 24; k++) {
      const a = a1 + ((a2 - a1) * k) / 24
      take(cx + radius * Math.cos(a), cy + radius * Math.sin(a))
    }
  }
  return { minX, minY, maxX, maxY }
}

const fitted = new Map<string, Point[]>()

/**
 * Figma rounds a polygon *inside its bounds*: the arcs still touch the node's
 * edges, so a 14.14 × 12.94 triangle with 2px corners is 14.14 × 12.94 after
 * rounding. A plain fillet does not do that — it pulls a 60° apex in by the
 * whole radius — so the sharp polygon is grown and re-centerd until its rounded
 * outline fills the box the file states. Converges in a handful of passes;
 * cached per shape and size, since every plot point would otherwise repeat it.
 */
function fitPolygon(key: string, points: readonly Point[], r: number): Point[] {
  const hit = fitted.get(key)
  if (hit) return hit
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1])
  const targetW = Math.max(...xs) - Math.min(...xs)
  const targetH = Math.max(...ys) - Math.min(...ys)
  let poly: Point[] = [...points]
  if (r > 0) {
    for (let pass = 0; pass < 6; pass++) {
      const b = roundedBounds(poly, r)
      const sx = targetW / (b.maxX - b.minX),
        sy = targetH / (b.maxY - b.minY)
      const mx = (b.minX + b.maxX) / 2,
        my = (b.minY + b.maxY) / 2
      poly = poly.map(([x, y]) => [(x - mx) * sx, (y - my) * sy] as const)
    }
  }
  fitted.set(key, poly)
  return poly
}

const TRIANGLE: readonly Point[] = [
  [0, -TRIANGLE_HALF_H],
  [TRIANGLE_HALF_W, TRIANGLE_HALF_H],
  [-TRIANGLE_HALF_W, TRIANGLE_HALF_H],
]

const DIAMOND: readonly Point[] = [
  [0, -DIAMOND_HALF],
  [DIAMOND_HALF, 0],
  [0, DIAMOND_HALF],
  [-DIAMOND_HALF, 0],
]

/**
 * A point-up hexagon, written from its half-extents rather than from an angle
 * sweep. Six vertices at 60° off a single radius would give 11.6 across for
 * 13.4 tall — a *regular* hexagon — and Figma's is 12 across, very slightly
 * wider. Stating both half-extents hits the file's numbers exactly and is
 * easier to check against them than a trigonometric identity is.
 */
const HEXAGON: readonly Point[] = [
  [0, -HEXAGON_HALF_H],
  [-HEXAGON_HALF_W, -HEXAGON_HALF_H / 2],
  [-HEXAGON_HALF_W, HEXAGON_HALF_H / 2],
  [0, HEXAGON_HALF_H],
  [HEXAGON_HALF_W, HEXAGON_HALF_H / 2],
  [HEXAGON_HALF_W, -HEXAGON_HALF_H / 2],
]

export interface MarkerShapeOptions {
  /** The shape to draw. */
  marker: ChartMarker
  /** The series color — a `var(--data-viz-…)` reference from `palette.ts`. */
  color: string
  /** The chart surface, which fills an outline shape so nothing shows through it. */
  surface: string
  /** Width of the square, in px. Other shapes scale from it: 12 in a swatch, 8 on a plot point. */
  size: number
  /** Ring thickness for the outline shapes and the X. 2 in a swatch, 1.5 on a plot point. */
  strokeWidth: number
  /** Center of the shape, in the coordinate space of the `<svg>` it is placed in. */
  cx?: number
  cy?: number
  /**
   * React key. Needed because Recharts calls a `dot` renderer once per point and
   * puts the results in a list — without it React warns on every chart that
   * draws markers.
   */
  key?: string | number
}

/**
 * One marker, as an SVG element centered on (`cx`, `cy`).
 *
 * Returns a bare shape with no wrapper, so the caller decides the coordinate
 * space — `Swatch` puts it in a 24×24 `<svg>`, and Recharts places it directly
 * into the chart's own plot-area coordinates.
 */
export function markerShape({
  marker,
  color,
  surface,
  size,
  strokeWidth,
  cx = 0,
  cy = 0,
  key,
}: MarkerShapeOptions): ReactElement {
  const scale = size / NOMINAL
  const outline = isOutlineMarker(marker)

  // An outline shape is surface-filled and color-stroked; a solid one is
  // color-filled with no stroke at all. Figma draws both exactly this way.
  const paint = outline
    ? { fill: surface, stroke: color, strokeWidth }
    : { fill: color, stroke: 'none' as const }

  const transform = `translate(${cx} ${cy})`
  // An outline shape is drawn on a path inset by half its ring, so the ring's
  // outer edge lands where the solid shape's edge is — Figma's inside stroke.
  const inset = outline ? strokeWidth / 2 : 0

  const polygon = (points: readonly Point[], shape: keyof typeof SWATCH_RADII) => {
    const r = cornerRadius(shape, size)
    const sharp = fitPolygon(`${shape}-${size}`, scaled(points, scale), r)
    return (
      <path
        key={key}
        d={roundedPolygon(insetPolygon(sharp, inset), Math.max(0, r - inset))}
        transform={transform}
        strokeLinejoin="round"
        {...paint}
      />
    )
  }

  switch (marker) {
    case 'square':
    case 'squareOutline': {
      const half = (NOMINAL * scale) / 2 - inset
      return (
        <rect
          key={key}
          x={cx - half}
          y={cy - half}
          width={half * 2}
          height={half * 2}
          rx={Math.max(0, cornerRadius('square', size) - inset)}
          strokeLinejoin="round"
          {...paint}
        />
      )
    }

    case 'circle':
    case 'circleOutline':
      return <circle key={key} cx={cx} cy={cy} r={CIRCLE_R * scale - inset} {...paint} />

    case 'triangle':
    case 'triangleOutline':
      return polygon(TRIANGLE, 'triangle')

    case 'hexagon':
    case 'hexagonOutline':
      return polygon(HEXAGON, 'hexagon')

    case 'diamond':
    case 'diamondOutline':
      return polygon(DIAMOND, 'diamond')

    case 'x': {
      // The one shape that is a stroke rather than a region, so it takes the
      // series color on its stroke and has no fill to give the surface.
      const h = X_HALF * scale
      return (
        <path
          key={key}
          d={`M${-h} ${-h}L${h} ${h}M${-h} ${h}L${h} ${-h}`}
          transform={transform}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      )
    }
  }
}
