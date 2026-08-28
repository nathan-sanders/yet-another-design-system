import type { ComponentPropsWithRef } from 'react'

import { cn } from '../../lib/cn'

import { isOutlineMarker, markerShape, type ChartMarker } from './shapes'

/**
 * Swatch — the coloured key that stands in for a series.
 *
 * Figma's `_Swatch` (`40004318:14468`), all fourteen styles. It is the piece
 * that makes identity legible without colour-matching, so it appears in every
 * legend row, every tooltip row and every metric key. It draws a mark and
 * nothing else — no label, no value, no layout.
 *
 * ## The three groups
 *
 * - **`colorSwatch`** — a plain 16px rounded square. The key for a chart whose
 *   marks are *areas*: a donut slice, a bar, a heat-map cell. There is no line
 *   and no point to echo, so the key is just the colour.
 * - **The eleven markers** — a 24px line with the series' shape sitting on it.
 *   The key for a chart whose marks are *points on a line*, and it says both
 *   things at once: this colour, and this shape.
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
 * That difference is also why `markerShape` takes `surface` as a colour rather
 * than a boolean: passing `'none'` here yields the ring, and passing the real
 * surface token yields the filled marker a plot point needs. One function, both
 * behaviours, no extra flag.
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
/** The plain colour key: a 16px rounded square, `border-radius/rounded-xs`. */
const COLOR_SWATCH_SIZE = 16
const COLOR_SWATCH_RADIUS = 4

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
  /** The series colour. Pass a `var(--data-viz-…)` reference from `palette.ts`, not a hex. */
  color: string
}

export function ChartSwatch({ shape = 'colorSwatch', color, className, ...props }: ChartSwatchProps) {
  const centre = BOX / 2

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
          y1={centre}
          x2={BOX}
          y2={centre}
          stroke={color}
          strokeWidth={LINE_WIDTH}
          // Figma's dash is 4 on, 6 off, with a square cap so each dash keeps its
          // full length rather than being eaten at both ends.
          strokeDasharray={shape === 'dashedLine' ? '4 6' : undefined}
          strokeLinecap={shape === 'dashedLine' ? 'square' : undefined}
        />
      ) : (
        <>
          {isOutlineMarker(shape) ? (
            <>
              <line
                x1={0}
                y1={centre}
                x2={SPLIT_LINE_INSET[shape]}
                y2={centre}
                stroke={color}
                strokeWidth={LINE_WIDTH}
              />
              <line
                x1={BOX - SPLIT_LINE_INSET[shape]}
                y1={centre}
                x2={BOX}
                y2={centre}
                stroke={color}
                strokeWidth={LINE_WIDTH}
              />
            </>
          ) : (
            <line x1={0} y1={centre} x2={BOX} y2={centre} stroke={color} strokeWidth={LINE_WIDTH} />
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
            cx: centre,
            cy: centre,
          })}
        </>
      )}
    </svg>
  )
}

ChartSwatch.displayName = 'Chart.Swatch'

