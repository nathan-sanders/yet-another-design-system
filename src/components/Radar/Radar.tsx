import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  RadarChart,
  Tooltip,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  RADAR_FILL_OPACITY,
  RADAR_RINGS,
  RADAR_STROKE_OPACITY,
  RADAR_STROKE_WIDTH,
  axisLine,
  surface,
  formatFullNumber,
  gridline,
  useVisibleSeries,
  type ChartSeries,
} from '../Chart'

/**
 * Radar — several series compared across the same handful of dimensions.
 *
 * Figma's `Radar` (`40004343:23764`), section `40004343:23750`, on the
 * `_Radar Grid` (`40004318:14373`).
 *
 * Unlike Donut and Gauge, this one's data is shaped like every other chart in
 * the library: **one row per axis, one column per series.** A row is a
 * dimension, not a category — which is why it takes an ordinary `series` array
 * and needs none of the pie-shaped machinery those two do.
 *
 * ## The grid is two elements, because Figma's outer ring is heavier
 *
 * Figma draws five concentric polygons at 96, 136, 176, 216 and 256. The inner
 * four are `Surface/Border`; the **outermost is `Surface/Border Emphasized`** —
 * the same distinction the cartesian charts make between a gridline and the
 * baseline, and for the same reason: the outer ring is the boundary values are
 * measured against, the rest is scenery.
 *
 * Recharts' `PolarGrid` paints every ring one color, so the emphasis comes from
 * `PolarAngleAxis`'s own `axisLine` drawn as a polygon over the top. Two
 * elements, one appearance — worth knowing before someone tries to give
 * `PolarGrid` a second stroke and finds it has nowhere to put it.
 *
 * ## The areas are translucent, and both fill and stroke are
 *
 * Figma sets `opacity: 0.4` on the whole area vector. That the outline still
 * reads stronger than the interior is not a second opacity — it is the 2px
 * stroke compositing over the fill beneath it, landing the edge near 0.64 while
 * the interior stays at 0.4.
 *
 * This is the opposite choice from `AreaSeries`'s `solid` fill, and the forms
 * are why. A cartesian area chart stacks front to back and can hide what is
 * behind it; a radar's shapes overlap in every direction at once, so no paint
 * order exists that keeps them all readable. Translucency is the only thing that
 * works, and it is why a radar tolerates more overlapping series than an area
 * chart does.
 *
 * ## When not to use it
 *
 * Past about four series it becomes a knot whatever the opacity. Past about
 * eight axes the polygon approximates a circle and the dimensions stop being
 * distinguishable. Figma's grid offers five or six points, which is the honest
 * range.
 */

export interface RadarProps {
  /** One row per axis. Each row names the dimension and carries a value per series. */
  data: readonly Record<string, unknown>[]
  /** The property holding each row's dimension name. */
  axisKey: string
  series: readonly ChartSeries[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  /**
   * Show the numeric scale running out along one spoke — Figma's `Polar Axis`
   * boolean. Off by default: on a radar the shape is the message, and a ladder
   * of numbers through the middle of it competes with the shapes for the space
   * they need.
   */
  showScale?: boolean
  legend?: 'horizontal' | 'vertical' | false
  interactiveLegend?: boolean
  className?: string
}

/**
 * One number on the radius scale.
 *
 * A custom renderer rather than a `tick` props object, for one reason:
 * **Recharts rotates each tick to follow the ray**, applying `rotate(36, …)`
 * here, and a props object cannot override a transform the axis sets itself.
 * Rendering the `<text>` and simply not applying that transform leaves the
 * numbers horizontal.
 *
 * Horizontal is a deliberate departure from Figma, which rotates them -90°.
 * Both Figma's quarter-turn and Recharts' slant ask the reader to tilt their
 * head to read a number that exists to be read, and at 12px over a mottled
 * background that is the difference between a scale and a decoration.
 *
 * The surface-colored stroke is a halo: `paint-order: stroke` puts the stroke
 * *under* the fill, so 3px reads as a 1.5px outline of canvas around each glyph
 * rather than a smear over it. Same idea as the stacked bar's gap, the solid
 * area's top edge and the donut's slice separator — the surface color does the
 * separating, so it follows the theme for free.
 */
interface ScaleTickProps {
  x?: number
  y?: number
  index?: number
  payload?: { value?: unknown }
}

function scaleTick(rawProps: unknown) {
  // Recharts types its tick renderer against an internal payload carrying far
  // more than the four fields this reads. Narrowing here keeps the renderer
  // honest about what it actually uses, the same way `activeSliceShape` does.
  const props = rawProps as ScaleTickProps

  return (
    <text
      key={props.index}
      x={props.x}
      y={props.y}
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-content-subtle font-mono text-sm tabular-nums"
      stroke={surface}
      strokeWidth={3}
      strokeLinejoin="round"
      style={{ paintOrder: 'stroke' }}
    >
      {String(props.payload?.value ?? '')}
    </text>
  )
}

function RadarPlot({
  data,
  axisKey,
  showScale,
}: {
  data: readonly Record<string, unknown>[]
  axisKey: string
  showScale: boolean
}) {
  const series = useVisibleSeries()

  return (
    <RadarChart
      data={data as Record<string, unknown>[]}
      accessibilityLayer
      /*
        70%, not 80%, and with margins — because the dimension labels sit
        *outside* the polygon and Recharts does not reserve room for them.

        Mono is a wider face than sans at the same size, so switching the labels
        to Geist Mono to match every other axis in the library immediately pushed
        "Efficiency" and "Reliability" off both edges. Shrinking the polygon is
        the fix rather than shrinking the type: the labels are the part a reader
        needs at a legible size, and a radar's shape survives being smaller
        perfectly well.
      */
      outerRadius="70%"
      margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
    >
      {/* The inner rings and the spokes. */}
      <PolarGrid gridType="polygon" stroke={gridline} strokeWidth={1} />

      {/*
        The dimension labels, and — via `axisLine` — the heavier outer boundary
        Figma draws in `Surface/Border Emphasized`. PolarGrid cannot give one
        ring a different stroke, so it comes from here.
      */}
      <PolarAngleAxis
        dataKey={axisKey}
        axisLineType="polygon"
        axisLine={{ stroke: axisLine, strokeWidth: 1 }}
        // Mono, like every other axis label in the library. A dimension name is
        // an axis tick, and the cartesian charts set the precedent: ticks are
        // 12px Geist Mono in `content-subtle`, because they are chrome and
        // because mono keeps a column of them optically even.
        tick={{ className: 'fill-content-subtle font-mono text-sm' }}
      />

      <Tooltip
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ChartTooltip />}
      />

      {series.map((s) => (
        <RechartsRadar
          key={s.key}
          dataKey={s.key}
          name={s.label}
          stroke={s.color}
          strokeWidth={RADAR_STROKE_WIDTH}
          strokeOpacity={RADAR_STROKE_OPACITY}
          fill={s.color}
          fillOpacity={RADAR_FILL_OPACITY}
          isAnimationActive={false}
          dot={false}
        />
      ))}

      {/*
        Declared **after** the areas, so it paints on top of them.

        Recharts paints in element order, and this was above the `<Radar>`
        elements — so the numbers sat underneath three translucent fills and
        whatever muddy color they composited into. A scale a reader cannot read
        is worse than no scale, because it still spends the space.

        Chrome normally belongs under the data, and the grid still does. Axis
        *text* is the exception: it has to stay legible whatever the data does,
        and a radar is the one chart here whose marks cover the middle where its
        own scale lives.

        Always rendered, even when the scale is hidden: `PolarGrid` takes its
        ring radii from the radius axis, so this element is what pins the count
        at Figma's five. Leave it out and Recharts picks its own and the grid
        quietly stops matching the file. `tick={false}` hides the numbers without
        removing the thing the rings are derived from.
      */}
      <PolarRadiusAxis
        /*
          Between two spokes, not along one. Recharts puts the first vertex at
          90°, so a scale at 90° runs straight through the topmost axis label —
          which is exactly what it did, stacking "Speed" on top of the numbers.
          Half a segment round is the widest gap available whatever the point
          count.
        */
        angle={90 - 180 / Math.max(1, data.length)}
        tickCount={RADAR_RINGS}
        axisLine={false}
        tick={showScale ? scaleTick : false}
      />
    </RadarChart>
  )
}

export function Radar({
  data,
  axisKey,
  series,
  label,
  height = 320,
  showScale = false,
  legend = 'horizontal',
  interactiveLegend = false,
  className,
}: RadarProps) {
  return (
    <ChartContainer
      series={series}
      data={data}
      xKey={axisKey}
      label={label}
      height={height}
      className={className}
      swatch="colorSwatch"
      interactiveLegend={interactiveLegend}
      formatY={(value) => (typeof value === 'number' ? formatFullNumber(value) : String(value ?? ''))}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <RadarPlot data={data} axisKey={axisKey} showScale={showScale} />
    </ChartContainer>
  )
}

Radar.displayName = 'Radar'
