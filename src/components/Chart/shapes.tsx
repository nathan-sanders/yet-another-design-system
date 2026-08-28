import type { ReactElement } from 'react'

/**
 * The marker shape vocabulary, as SVG.
 *
 * Eleven shapes — five forms in a solid and an outline pair, plus an X — drawn
 * once here and used at two very different sizes: **24px** inside a legend or
 * tooltip `Swatch`, and **8–9px** as a plot point on a line. Figma models these
 * as two separate component sets (`_Swatch`, `_Line Series / Plot Point`)
 * because a Figma component cannot be parameterised by a number; in code they
 * are one function and a `size`.
 *
 * ## The nominal-12 space
 *
 * Every shape is defined around the origin in a space where the *square* is 12
 * units across, and is then scaled by `size / 12`. Twelve is not arbitrary: it
 * is the square's width in Figma's 24px swatch, and the other shapes are sized
 * relative to it there — circle 13, hexagon 12 × 13.4, triangle 14.1 × 12.9,
 * diamond 14.1 × 14.1, X 11.4. Those ratios are what make the set look like one
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
 * *surface* colour and stroked with the series colour, exactly as Figma draws it
 * — its outline variants each carry a `Background` layer beneath the ring. That
 * matters wherever markers overlap or a marker sits on its own line: an unfilled
 * ring would show the line straight through its middle and stop reading as a
 * distinct mark.
 *
 * **What is deliberately not carried over:** Figma rounds the solid triangle and
 * hexagon corners by 2px. At swatch size that is a sixth of the shape and at
 * plot-point size it is sub-pixel, and reproducing it needs an arc-path
 * generator for two shapes. The outline variants get it for free from
 * `stroke-linejoin="round"`; the solid ones are drawn sharp.
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
 * Markers cycle where colours do not, and the asymmetry is deliberate. A colour
 * repeated across two visible series is ambiguous — that is why `categorical()`
 * stops at twelve. A *shape* repeated is not, because the colour is still
 * telling them apart; the shape is a second channel, and a second channel that
 * runs out is still better than none. Eleven shapes against twelve colours means
 * the pair only repeats at the twelfth series, by which point the chart has
 * bigger problems.
 *
 * Having a shape at all is the point: it is what keeps identity legible for a
 * reader who cannot separate two hues, and in greyscale print.
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
const X_HALF = 5.7 // 11.4 across

function polygonPoints(points: readonly (readonly [number, number])[], scale: number): string {
  return points.map(([x, y]) => `${(x * scale).toFixed(2)},${(y * scale).toFixed(2)}`).join(' ')
}

const TRIANGLE: readonly (readonly [number, number])[] = [
  [0, -TRIANGLE_HALF_H],
  [TRIANGLE_HALF_W, TRIANGLE_HALF_H],
  [-TRIANGLE_HALF_W, TRIANGLE_HALF_H],
]

const DIAMOND: readonly (readonly [number, number])[] = [
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
const HEXAGON: readonly (readonly [number, number])[] = [
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
  /** The series colour — a `var(--data-viz-…)` reference from `palette.ts`. */
  color: string
  /** The chart surface, which fills an outline shape so nothing shows through it. */
  surface: string
  /** Width of the square, in px. Other shapes scale from it: 12 in a swatch, 8 on a plot point. */
  size: number
  /** Ring thickness for the outline shapes and the X. 2 in a swatch, 1.5 on a plot point. */
  strokeWidth: number
  /** Centre of the shape, in the coordinate space of the `<svg>` it is placed in. */
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
 * One marker, as an SVG element centred on (`cx`, `cy`).
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

  // An outline shape is surface-filled and colour-stroked; a solid one is
  // colour-filled with no stroke at all. Figma draws both exactly this way.
  const paint = outline
    ? { fill: surface, stroke: color, strokeWidth }
    : { fill: color, stroke: 'none' as const }

  const transform = `translate(${cx} ${cy})`

  switch (marker) {
    case 'square':
    case 'squareOutline': {
      const half = (NOMINAL * scale) / 2
      return (
        <rect
          key={key}
          x={cx - half}
          y={cy - half}
          width={half * 2}
          height={half * 2}
          strokeLinejoin="round"
          {...paint}
        />
      )
    }

    case 'circle':
    case 'circleOutline':
      return <circle key={key} cx={cx} cy={cy} r={CIRCLE_R * scale} {...paint} />

    case 'triangle':
    case 'triangleOutline':
      return (
        <polygon
          key={key}
          points={polygonPoints(TRIANGLE, scale)}
          transform={transform}
          strokeLinejoin="round"
          {...paint}
        />
      )

    case 'hexagon':
    case 'hexagonOutline':
      return (
        <polygon
          key={key}
          points={polygonPoints(HEXAGON, scale)}
          transform={transform}
          strokeLinejoin="round"
          {...paint}
        />
      )

    case 'diamond':
    case 'diamondOutline':
      return (
        <polygon
          key={key}
          points={polygonPoints(DIAMOND, scale)}
          transform={transform}
          strokeLinejoin="round"
          {...paint}
        />
      )

    case 'x': {
      // The one shape that is a stroke rather than a region, so it takes the
      // series colour on its stroke and has no fill to give the surface.
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
