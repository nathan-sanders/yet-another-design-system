import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  chartGridProps,
  formatDateTick,
  formatFullNumber,
  gridline,
  inferXPreset,
  markerShape,
  surface,
  useChart,
  useVisibleSeries,
  xAxisProps,
  yAxisProps,
  type ChartSeries,
  type ChartXPreset,
} from '../Chart'

/**
 * LineSeries — change over time, for up to twelve series.
 *
 * Figma's `Line Series` (`40004319:22371`). The first chart in the library, and
 * the one that proves the shared chrome: it is the only form that exercises both
 * axes, the grid, the legend, the tooltip and the plot-point markers at once.
 *
 * ## What Recharts made disappear
 *
 * Figma draws this chart out of `_Line Series / Segment` — sixteen variants
 * covering curve against linear, four directions and dashed against solid —
 * placed one per interval, with a `_Line Series / Plot Point` at each vertex.
 * That is thirty-odd components' worth of file, and **none of it becomes code**.
 * A segment's "direction" is not a design decision, it is what the data did
 * between two points; Recharts computes the path. The parts of that machinery
 * that *are* decisions — the interpolation, the dash, the marker shape — survive
 * as three props.
 *
 * Reading the underscored Figma components as an API to implement is the main
 * way this component could have been ten times its size.
 *
 * ## The numbers, and where they came from
 *
 * The line is **1.5px**, not the 2px a generic chart guide would give it, and
 * the plot point's ring is 1.5px against the 2px the same shape carries in a
 * legend swatch. Both were read off the Figma nodes rather than scaled or
 * assumed — a stroke weight is never recoverable from a shape's geometry, which
 * is a trap this project has hit before.
 *
 * ## No entry animation
 *
 * Every series sets `isAnimationActive={false}`. Recharts animates in
 * JavaScript, with its own duration and easing constants — a second source of
 * truth for motion that Figma cannot reach, which is exactly what this library's
 * motion tokens exist to prevent. It also would not honour the global
 * `prefers-reduced-motion` clamp in `theme.css`, because that clamp is CSS and
 * Recharts' tween is not. Hover feedback is still CSS and still uses the tokens.
 */

/** How the path is drawn between points. Figma's segment `Type` axis. */
export type LineInterpolation = 'curve' | 'linear'

/** A series, plus the one thing a line chart adds to the shared shape. */
export interface LineSeriesSeries extends ChartSeries {
  /** Override the chart's interpolation for this series alone. */
  curve?: LineInterpolation
}

export interface LineSeriesProps {
  /** One row per x value. */
  data: readonly Record<string, unknown>[]
  /** The property holding the x value. Dates may be `Date`s, ISO strings or timestamps. */
  xKey: string
  /** The series, in a fixed order — colour and marker come from position here. */
  series: readonly LineSeriesSeries[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  /** Plot height in px. */
  height?: number
  /**
   * Curve or linear, for every series that does not override it.
   *
   * `curve` is Recharts' `monotone`, not a plain spline — monotone interpolation
   * cannot overshoot a data point, so the curve never invents a peak higher than
   * anything measured. A plain cubic would, which is a chart telling a small lie
   * to look smooth.
   */
  interpolation?: LineInterpolation
  /** Draw a marker at every point. Off for dense data, where the points merge into a band. */
  showPoints?: boolean
  /** Gridlines, 2–8. Figma's `_Y-Axis Presets` `Lines`. */
  yLines?: number
  /** Where the legend goes, or `false` for none. A chart with two or more series should keep it. */
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch series off by clicking the legend. */
  interactiveLegend?: boolean
  /** Override the x-axis preset where the data is ambiguous. */
  xPreset?: ChartXPreset
  /**
   * The zone date labels are written in. UTC by default, so a date-only value
   * renders as the day it says rather than sliding a day west of Greenwich —
   * see `formatDateTick`. Pass a zone for wall-clock times that belong to a
   * place.
   */
  timeZone?: string
  className?: string
}

/** Recharts' `monotone` is the safe curve; `linear` is Figma's other option, unchanged. */
const RECHARTS_TYPE = { curve: 'monotone', linear: 'linear' } as const

/** Plot-point geometry, from Figma: an 8px square, and a 1.5px ring on the hollow shapes. */
const POINT_SIZE = 8
const POINT_STROKE = 1.5
/** The series line. Figma: 1.5px. */
const LINE_WIDTH = 1.5
/** Figma's dashed segments. */
const LINE_DASH = '6 4'

/**
 * The chart body.
 *
 * Split out from the exported component because it has to sit *inside*
 * `ChartContainer` to read `wide` from the chart context — and `wide` decides
 * how many x labels are drawn.
 */
function LineSeriesPlot({
  data,
  xKey,
  interpolation,
  showPoints,
  yLines,
  preset,
  timeZone,
}: {
  data: readonly Record<string, unknown>[]
  xKey: string
  interpolation: LineInterpolation
  showPoints: boolean
  yLines: number
  preset: ChartXPreset
  timeZone: string
}) {
  const chart = useChart()
  // `visibleSeries`, not `series`: a series switched off in an interactive
  // legend must stop being drawn. Colour was assigned before this filter, so the
  // ones that remain keep the colours they already had.
  const series = useVisibleSeries()
  const wide = chart?.wide ?? true

  return (
    <LineChart
      data={data as Record<string, unknown>[]}
      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      // Recharts' own keyboard layer: arrow keys walk the points and move the
      // tooltip with them. It costs nothing and is the only way a keyboard user
      // reaches the values without the hidden table.
      accessibilityLayer
    >
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
        // A vertical rule under the pointer, in the gridline colour so it reads
        // as chrome rather than as data.
        cursor={{ stroke: gridline, strokeWidth: 1 }}
        // Recharts' own tween off, and the movement put back in the library's
        // tokens on the wrapper. Both halves of that, plus why it is
        // `wrapperStyle` and not a class, live on `chartTooltipWrapperStyle`.
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}

        content={<ChartTooltip formatLabel={(value) => formatDateTick(value, preset, undefined, timeZone)} />}
      />

      {series.map((s) => {
        const curve = (s as LineSeriesSeries).curve ?? interpolation
        const marker = s.marker

        return (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.label}
            type={RECHARTS_TYPE[curve]}
            stroke={s.color}
            strokeWidth={LINE_WIDTH}
            strokeDasharray={s.dashed ? LINE_DASH : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            // See the note on the component: motion values belong to Figma, and
            // Recharts' live in JavaScript where Figma cannot reach them.
            isAnimationActive={false}
            dot={
              showPoints && marker !== false
                ? (props: { cx?: number; cy?: number; index?: number }) =>
                    markerShape({
                      marker,
                      color: s.color,
                      // The real surface, not `'none'`: a plot point sits on its
                      // own line, and a hollow one would show the line straight
                      // through its middle.
                      surface,
                      size: POINT_SIZE,
                      strokeWidth: POINT_STROKE,
                      cx: props.cx ?? 0,
                      cy: props.cy ?? 0,
                      key: `${s.key}-${props.index}`,
                    })
                : false
            }
            activeDot={{ r: 5, fill: s.color, stroke: surface, strokeWidth: 2 }}
          />
        )
      })}
    </LineChart>
  )
}

export function LineSeries({
  data,
  xKey,
  series,
  label,
  height = 280,
  interpolation = 'curve',
  showPoints = true,
  yLines = 5,
  legend = 'horizontal',
  interactiveLegend = false,
  xPreset,
  timeZone = 'UTC',
  className,
}: LineSeriesProps) {
  const preset = useMemo(
    () => xPreset ?? inferXPreset(data.map((row) => row[xKey])),
    [xPreset, data, xKey],
  )

  return (
    <ChartContainer
      series={series}
      data={data}
      xKey={xKey}
      label={label}
      height={height}
      className={className}
      interactiveLegend={interactiveLegend}
      formatX={(value) => formatDateTick(value, preset, undefined, timeZone)}
      formatY={(value) => (typeof value === 'number' ? formatFullNumber(value) : String(value ?? ''))}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <LineSeriesPlot
        data={data}
        xKey={xKey}
        interpolation={interpolation}
        showPoints={showPoints}
        yLines={yLines}
        preset={preset}
        timeZone={timeZone}
      />
    </ChartContainer>
  )
}

LineSeries.displayName = 'LineSeries'
