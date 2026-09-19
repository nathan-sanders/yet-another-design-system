import type { ComponentPropsWithRef } from 'react'

import { cn } from '../../lib/cn'

import { isOutlineMarker, markerShape, type ChartMarker } from './shapes'

/**
 * Swatch — the colored key that stands in for a series.
 *
 * Figma's `_Swatch` (`40004318:14468`), all fourteen styles. It is the piece
 * that makes identity legible without color-matching, so it appears in every
 * legend row, every tooltip row and every metric key. It draws a mark and
 * nothing else — no label, no value, no layout.
 *
 * ## The three groups
 *
 * - **`colorSwatch`** — a plain 14px rounded square. The key for a chart whose
 *   marks are *areas*: a donut slice, a bar, a heat-map cell. There is no line
 *   and no point to echo, so the key is just the color.
 * - **The eleven markers** — a 24px line with the series' shape sitting on it.
 *   The key for a chart whose marks are *points on a line*, and it says both
 *   things at once: this color, and this shape.
 * - **`solidLine` / `dashedLine`** — the line with no marker, for a series drawn
 *   without plot points, and for benchmarks (a dashed rule is the conventional
 *   "this is a target, not data").
 *
 * ## Why the line splits under an outline marker
 *
 * At swatch size an outline marker is a **true ring with no fill** — unlike the
 * same marker as a plot point, which is surface-filled so it can hide the line
 * running under it. Figma draws it this way, and the consequence is visible: a
 * continuous rule would show straight through the ring's middle and turn a
 * hollow marker into a struck-through one. So the rule is drawn as two pieces
 * with a gap, and the gap's width is read off the file per shape rather than
 * derived — it is 8 either side for the square, triangle and hexagon, and 7 for
 * the rounder circle and diamond.
 *
 * That difference is also why `markerShape` takes `surface` as a color rather
 * than a boolean: passing `'none'` here yields the ring, and passing the real
 * surface token yields the filled marker a plot point needs. One function, both
 * behaviors, no extra flag.

 *
 * ## A marker with no line under it
 *
 * The eleven marker styles all draw the rule, because in Figma's `_Swatch` a
 * marker is a *point on a line* — the line chart's key. A scatter's marks are
 * points on nothing, and a key that draws a line the plot does not have is a
 * key describing a different chart. `line={false}` drops the line and leaves
 * the marker centered in the same box; the chart says it once through
 * `ChartContainer`'s `swatchLine`, and the legend and tooltip rows follow. With
 * no line to hide, an outline marker is the same ring it always was.
 */

/** Every style Figma's `_Swatch` offers. */
export type ChartSwatchShape = ChartMarker | 'colorSwatch' | 'solidLine' | 'dashedLine'

/** The swatch box, matching Figma's 24×24 frame. */
const BOX = 24
/** The line through the middle of a marker swatch. Heavier than the 1.5px series line, to stay legible at 24px. */
const LINE_WIDTH = 2
/** The marker's nominal square width inside the box. */
const MARKER_SIZE = 12
/** Ring thickness at swatch scale. A plot point uses 1.5; both are read from Figma, neither is derived. */
const MARKER_STROKE = 2
/** The plain color key: a 14px square with a 3.5px radius, read off `Style=Color Swatch` (it was 16 / 4 until 2026-09-18). */
const COLOR_SWATCH_SIZE = 14
const COLOR_SWATCH_RADIUS = 3.5

/**
 * How far each line piece runs in from the edge when a hollow marker splits it.
 * Straight from the Figma variants — not computed from the shape's width, which
 * would get the circle and diamond wrong.
 */
const SPLIT_LINE_INSET: Record<string, number> = {
  squareOutline: 8,
  triangleOutline: 8,
  hexagonOutline: 8,
  circleOutline: 7,
  diamondOutline: 7,
}

export interface ChartSwatchProps extends Omit<ComponentPropsWithRef<'svg'>, 'color'> {
  /**
   * Which mark to draw.
   *
   * Figma calls this axis `Style`, and that name cannot survive the crossing:
   * `style` on an SVG element is the CSS style object, so a prop of that name
   * would shadow it and make the swatch the one component in the library a
   * caller cannot pass inline styles to. `shape` is what the axis actually
   * varies anyway.
   */
  shape?: ChartSwatchShape
  /** The series color. Pass a `var(--data-viz-…)` reference from `palette.ts`, not a hex. */
  color: string
  /**
   * Draw the line under a marker. On by default — a marker key is a point on
   * a line. Off for a chart whose points sit on nothing, where the line would
   * describe a mark the plot does not have.
   */
  line?: boolean
}

export function ChartSwatch({ shape = 'colorSwatch', color, line = true, className, ...props }: ChartSwatchProps) {
  const center = BOX / 2

  return (
    <svg
      width={BOX}
      height={BOX}
      viewBox={`0 0 ${BOX} ${BOX}`}
      // The swatch is decoration: the row it sits in already carries the series
      // name as text, so announcing it again would read the name twice. Identity
      // reaches a screen reader through the label, never through this.
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      {...props}
    >
      {shape === 'colorSwatch' ? (
        <rect
          x={(BOX - COLOR_SWATCH_SIZE) / 2}
          y={(BOX - COLOR_SWATCH_SIZE) / 2}
          width={COLOR_SWATCH_SIZE}
          height={COLOR_SWATCH_SIZE}
          rx={COLOR_SWATCH_RADIUS}
          fill={color}
        />
      ) : shape === 'solidLine' || shape === 'dashedLine' ? (
        <line
          x1={0}
          y1={center}
          x2={BOX}
          y2={center}
          stroke={color}
          strokeWidth={LINE_WIDTH}
          // Figma's dash is 4 on, 6 off, with a square cap so each dash keeps its
          // full length rather than being eaten at both ends.
          strokeDasharray={shape === 'dashedLine' ? '4 6' : undefined}
          strokeLinecap={shape === 'dashedLine' ? 'square' : undefined}
        />
      ) : (
        <>
          {!line ? null : isOutlineMarker(shape) ? (
            <>
              <line
                x1={0}
                y1={center}
                x2={SPLIT_LINE_INSET[shape]}
                y2={center}
                stroke={color}
                strokeWidth={LINE_WIDTH}
              />
              <line
                x1={BOX - SPLIT_LINE_INSET[shape]}
                y1={center}
                x2={BOX}
                y2={center}
                stroke={color}
                strokeWidth={LINE_WIDTH}
              />
            </>
          ) : (
            <line x1={0} y1={center} x2={BOX} y2={center} stroke={color} strokeWidth={LINE_WIDTH} />
          )}
          {markerShape({
            marker: shape,
            color,
            // `'none'` rather than the surface token: at this size an outline
            // marker is a genuine ring, and the split line above is what keeps
            // it from being struck through. See the note above.
            surface: 'none',
            size: MARKER_SIZE,
            strokeWidth: MARKER_STROKE,
            cx: center,
            cy: center,
          })}
        </>
      )}
    </svg>
  )
}

ChartSwatch.displayName = 'Chart.Swatch'

