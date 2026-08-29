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
  RADAR_FILL_OPACITY,
  RADAR_RINGS,
  RADAR_STROKE_OPACITY,
  RADAR_STROKE_WIDTH,
  axisLine,
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
 * Recharts' `PolarGrid` paints every ring one colour, so the emphasis comes from
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
    <RadarChart data={data as Record<string, unknown>[]} accessibilityLayer outerRadius="80%">
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
        tick={{ className: 'fill-content-subtle font-sans text-sm' }}
      />

      {/*
        Always rendered, even when the scale is hidden. `PolarGrid` takes its
        ring radii from the radius axis, so this is what pins the count at
        Figma's five — leaving it out lets Recharts choose, and the grid quietly
        stops matching the file. `tick={false}` hides the numbers without
        removing the thing the rings are derived from.
      */}
      <PolarRadiusAxis
        /*
          Between two spokes, not along one.
          Recharts puts the first vertex at 90°, so a scale at 90° runs straight
          through the topmost axis label — which is exactly what it did, stacking
          "Speed" on top of the numbers. Half a segment round from there is the
          widest gap available whatever the point count.
        */
        angle={90 - 180 / Math.max(1, data.length)}
        tickCount={RADAR_RINGS}
        axisLine={false}
        tick={showScale ? { className: 'fill-content-subtle font-mono text-sm tabular-nums' } : false}
      />

      <Tooltip
        isAnimationActive={false}
        wrapperStyle={{
          transitionProperty: 'transform',
          transitionDuration: 'var(--transition-duration-fast)',
          transitionTimingFunction: 'var(--ease-standard)',
        }}
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
