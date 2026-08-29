import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartGridProps,
  formatDateTick,
  formatFullNumber,
  gridline,
  inferXPreset,
  surface,
  useChart,
  useVisibleSeries,
  xAxisProps,
  yAxisProps,
  type ChartSeries,
  type ChartXPreset,
} from '../Chart'

/**
 * AreaSeries — a magnitude over time, as a filled shape.
 *
 * Figma's `Area Series` (`40004326:32506`). An area says "how much", where a
 * line says "what level" — the fill is doing the talking, which is why the same
 * data reads as bigger here than in `LineSeries`.
 *
 * As with the line chart, Figma's `_Area Series / Segment` (12 variants across
 * curve/linear, four directions and two fills) is a drawing mechanism rather
 * than an API: Recharts computes the path. Two of those axes survive as props —
 * `interpolation` and `fill` — and the four "directions" do not, because a
 * segment's direction is what the data did.
 *
 * ## The two fills are different drawings, not a style toggle
 *
 * This is the thing to understand before changing anything here, and reading the
 * Figma variants side by side is what makes it obvious:
 *
 * - **`solid`** — the fill is the series colour at **full opacity**, and the top
 *   edge is stroked in the **surface** colour. Overlapping areas are separated
 *   by that surface-coloured edge, which is the same trick the stacked bar uses
 *   its 1px gap for: white does the separating, not a border drawn in more ink.
 * - **`gradient`** — the fill fades from the series colour to fully transparent
 *   downward, and the top edge is stroked in the **series** colour. This is the
 *   familiar "line chart with a wash under it".
 *
 * So the edge stroke swaps colour between the two modes. That is not a detail:
 * a solid area with a coloured edge would have no separation where two areas
 * meet, and a gradient area with a surface edge would have its line vanish into
 * the background.
 *
 * ## Solid areas are opaque, so order is load-bearing
 *
 * A `solid` area completely hides anything drawn behind it. Recharts paints in
 * element order, so the series array is the paint order, back to front —
 * **order the largest series first** or a smaller one will bury it. Figma's own
 * example is drawn that way.
 *
 * `gradient` does not have the problem, because it is translucent. If the data
 * genuinely crosses and no order works, that is the signal to use `LineSeries`
 * instead: two lines can cross and stay readable, two opaque areas cannot.
 *
 * There is deliberately **no stacking**. Figma does not draw one, and stacking
 * areas makes a claim the data has to earn — that the parts sum to a meaningful
 * whole — which `VerticalBar`'s `stacked` already covers for the case where they
 * do.
 */

export type AreaInterpolation = 'curve' | 'linear'
export type AreaFill = 'solid' | 'gradient'

export interface AreaSeriesSeries extends ChartSeries {
  /** Override the chart's interpolation for this series alone. */
  curve?: AreaInterpolation
}

export interface AreaSeriesProps {
  data: readonly Record<string, unknown>[]
  xKey: string
  /** In paint order, back to front. For `solid`, that means largest first. */
  series: readonly AreaSeriesSeries[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  /** Monotone (`curve`) or straight (`linear`). See `LineSeries` on why monotone. */
  interpolation?: AreaInterpolation
  /** Opaque with a surface-coloured edge, or a wash fading downward. */
  fill?: AreaFill
  /** Gridlines, 2–8. */
  yLines?: number
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch series off by clicking the legend. */
  interactiveLegend?: boolean
  xPreset?: ChartXPreset
  timeZone?: string
  className?: string
}

const RECHARTS_TYPE = { curve: 'monotone', linear: 'linear' } as const

/** Figma: the area's top edge. */
const EDGE_WIDTH = 1

function AreaSeriesPlot({
  data,
  xKey,
  interpolation,
  fill,
  yLines,
  preset,
  timeZone,
  gradientId,
}: {
  data: readonly Record<string, unknown>[]
  xKey: string
  interpolation: AreaInterpolation
  fill: AreaFill
  yLines: number
  preset: ChartXPreset
  timeZone: string
  gradientId: string
}) {
  const chart = useChart()
  // `visibleSeries`, not `series`: a series switched off in an interactive
  // legend must stop being drawn. Colour was assigned before this filter, so the
  // ones that remain keep the colours they already had.
  const series = useVisibleSeries()
  const wide = chart?.wide ?? true

  return (
    <AreaChart data={data as Record<string, unknown>[]} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
      {fill === 'gradient' ? (
        <defs>
          {series.map((s) => (
            // One gradient per series, and the id is scoped by `useId` because
            // two charts on the same page would otherwise define the same id
            // and the second would silently win for both.
            <linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={1} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      ) : null}

      <CartesianGrid {...chartGridProps} />

      <XAxis
        dataKey={xKey}
        {...xAxisProps({ wide, count: data.length })}
        tickFormatter={(value, index) =>
          formatDateTick(value, preset, index > 0 ? data[index - 1]?.[xKey] : undefined, timeZone)
        }
      />

      <YAxis {...yAxisProps({ lines: yLines })} />

      <Tooltip
        cursor={{ stroke: gridline, strokeWidth: 1 }}
        isAnimationActive={false}
        wrapperStyle={{
          transitionProperty: 'transform',
          transitionDuration: 'var(--transition-duration-fast)',
          transitionTimingFunction: 'var(--ease-standard)',
        }}
        content={<ChartTooltip formatLabel={(value) => formatDateTick(value, preset, undefined, timeZone)} />}
      />

      {series.map((s) => (
        <Area
          key={s.key}
          dataKey={s.key}
          name={s.label}
          type={RECHARTS_TYPE[(s as AreaSeriesSeries).curve ?? interpolation]}
          // The edge swaps colour with the fill mode — surface for solid so
          // overlapping areas separate, the series colour for gradient so the
          // line reads. See the note on the component.
          stroke={fill === 'solid' ? surface : s.color}
          strokeWidth={EDGE_WIDTH}
          fill={fill === 'gradient' ? `url(#${gradientId}-${s.key})` : s.color}
          fillOpacity={1}
          strokeDasharray={s.dashed ? '6 4' : undefined}
          isAnimationActive={false}
          // An area's own mark is the fill; a dot on top would be a second
          // encoding of the same number.
          dot={false}
          activeDot={{ r: 5, fill: s.color, stroke: surface, strokeWidth: 2 }}
        />
      ))}
    </AreaChart>
  )
}

export function AreaSeries({
  data,
  xKey,
  series,
  label,
  height = 280,
  interpolation = 'curve',
  fill = 'solid',
  yLines = 5,
  legend = 'horizontal',
  interactiveLegend = false,
  xPreset,
  timeZone = 'UTC',
  className,
}: AreaSeriesProps) {
  const gradientId = useId()
  const preset = useMemo(() => xPreset ?? inferXPreset(data.map((row) => row[xKey])), [xPreset, data, xKey])

  return (
    <ChartContainer
      series={series}
      data={data}
      xKey={xKey}
      label={label}
      height={height}
      className={className}
      interactiveLegend={interactiveLegend}
      // An area has no plot points, so its key is the plain colour square —
      // which is what Figma's Area Series legend uses.
      swatch="colorSwatch"
      formatX={(value) => formatDateTick(value, preset, undefined, timeZone)}
      formatY={(value) => (typeof value === 'number' ? formatFullNumber(value) : String(value ?? ''))}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <AreaSeriesPlot
        data={data}
        xKey={xKey}
        interpolation={interpolation}
        fill={fill}
        yLines={yLines}
        preset={preset}
        timeZone={timeZone}
        gradientId={gradientId}
      />
    </ChartContainer>
  )
}

AreaSeries.displayName = 'AreaSeries'
