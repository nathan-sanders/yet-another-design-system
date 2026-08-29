import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import {
  BAR_MAX_WIDTH,
  BAR_SEGMENT_GAP,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  barSegment,
  chartGridProps,
  formatDateTick,
  formatFullNumber,
  cursorHighlight,
  inferXPreset,
  useChart,
  useVisibleSeries,
  xAxisProps,
  yAxisProps,
  type ChartSeries,
  type ChartXPreset,
} from '../Chart'

/**
 * VerticalBar — a magnitude per category, as columns.
 *
 * Figma's `Vertical Bar` (`40004343:17007`), whose `Bar Type` axis is
 * Single / Stacked / Group.
 *
 * **Those three become one boolean.** "Single" and "Group" are the same
 * drawing — bars side by side — differing only in how many series there are,
 * which is something the caller's `series` array already says and cannot
 * contradict. Figma needs three variants because a Figma component cannot count
 * its own children. The only genuine choice left is whether bars sit **beside**
 * each other or **on top of** each other, and that is `stacked`.
 *
 * ## `stacked` defaults to false, and that is a claim about data
 *
 * Stacking asserts that the parts sum to a meaningful whole — that
 * sessions + signups is a number that means something. Often it is not, and a
 * stacked chart of unrelated series invents a total the reader will then try to
 * read. Grouped makes no such claim, so it is the safe default; `stacked` is the
 * caller saying the sum is real. Figma's own example is stacked, because there
 * the three series genuinely are parts of one figure.
 *
 * The tooltip's Total row follows the same logic: it defaults to `stacked`,
 * appearing exactly when a total means something.
 *
 * ## Every segment is rounded and separated, which Recharts cannot do
 *
 * Figma rounds all four corners of **every** stacked segment and puts a 1px gap
 * between them, so a stack reads as a column of discrete blocks. Recharts stacks
 * flush and has no concept of a gap. That is why each segment goes through a
 * custom shape — see `Chart/bars.tsx`, which also covers why the gap comes off
 * the top and why the radius has to shrink on short segments.
 *
 * ## Bar width
 *
 * Capped at 24px. Figma's `Segment` is intrinsically 16 (single, stacked) and 24
 * (grouped), but those are the component's own size on the canvas — the real
 * chart distributes bars across whatever width it has, and pinning them to 16
 * would leave a wide chart mostly empty. The cap is what matters: past 24 a bar
 * stops reading as a measured length and starts reading as a block of color,
 * and the leftover in the band is supposed to be air.
 */

export interface VerticalBarProps {
  data: readonly Record<string, unknown>[]
  xKey: string
  series: readonly ChartSeries[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  height?: number
  /**
   * Stack the series into one column per category instead of placing them side
   * by side. Only true when the parts genuinely sum to something.
   */
  stacked?: boolean
  /**
   * Show a Total row in the tooltip. Defaults to `stacked`, because that is
   * exactly when a total is a real number rather than an accident of addition.
   */
  showTotal?: boolean
  /**
   * Outline every segment with `Data Viz/Utility/Accessibility Overlay`.
   *
   * For a chart using one of the three categorical colors that fall short of
   * 3:1 on the light canvas — `04` yellow above all — where a large flat fill
   * can be hard to find against the surface. Off by default because Figma's own
   * examples do not draw it.
   */
  accessibilityOverlay?: boolean
  /** Gridlines, 2–8. */
  yLines?: number
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch series off by clicking the legend. */
  interactiveLegend?: boolean
  xPreset?: ChartXPreset
  timeZone?: string
  className?: string
}

/** One stack. Recharts groups bars sharing a `stackId`. */
const STACK_ID = 'stack'

function VerticalBarPlot({
  data,
  xKey,
  stacked,
  showTotal,
  accessibilityOverlay,
  yLines,
  preset,
  timeZone,
}: {
  data: readonly Record<string, unknown>[]
  xKey: string
  stacked: boolean
  showTotal: boolean
  accessibilityOverlay: boolean
  yLines: number
  preset: ChartXPreset
  timeZone: string
}) {
  const chart = useChart()
  // `visibleSeries`, not `series`: a series switched off in an interactive
  // legend must stop being drawn. Color was assigned before this filter, so the
  // ones that remain keep the colors they already had.
  const series = useVisibleSeries()
  const wide = chart?.wide ?? true

  return (
    <BarChart
      data={data as Record<string, unknown>[]}
      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      // Figma's gap between the bars of one group.
      barGap={4}
      // Recharts takes this off **each** side of the band, so the number is
      // half what it looks like — 25% leaves only half the band for bars, which
      // is how the grouped chart first came out at 7px a bar.
      //
      // The two modes want different values for a real reason: a stacked chart
      // puts one column in the band and can spend the rest on air, which is what
      // Figma's does. A grouped chart has to fit every series in the same band,
      // so the air is what it can least afford.
      barCategoryGap={stacked ? '20%' : '10%'}
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
        // A band behind the whole category rather than a rule, because a bar
        // occupies width — a hairline down the middle of a 24px column looks
        // like it is pointing between two bars rather than at one.
        //
        // The accessibility overlay at a low opacity, not the gridline: see
        // `cursorHighlight`. A band is larger than a rule, so it takes the
        // color down rather than up.
        cursor={{ fill: cursorHighlight, fillOpacity: 0.24 }}
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={
          <ChartTooltip showTotal={showTotal} formatLabel={(value) => formatDateTick(value, preset, undefined, timeZone)} />
        }
      />

      {series.map((s, index) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.label}
          fill={s.color}
          stackId={stacked ? STACK_ID : undefined}
          maxBarSize={BAR_MAX_WIDTH}
          isAnimationActive={false}
          shape={barSegment({
            // Recharts stacks in element order from the bottom up, so the *last*
            // series is the one on top — the one with nothing above it to
            // separate from, and so the only one that keeps its full height.
            isTop: !stacked || index === series.length - 1,
            gap: stacked ? BAR_SEGMENT_GAP : 0,
            accessibilityOverlay,
          })}
        />
      ))}
    </BarChart>
  )
}

export function VerticalBar({
  data,
  xKey,
  series,
  label,
  height = 280,
  stacked = false,
  showTotal,
  accessibilityOverlay = false,
  yLines = 5,
  legend = 'horizontal',
  interactiveLegend = false,
  xPreset,
  timeZone = 'UTC',
  className,
}: VerticalBarProps) {
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
      swatch="colorSwatch"
      formatX={(value) => formatDateTick(value, preset, undefined, timeZone)}
      formatY={(value) => (typeof value === 'number' ? formatFullNumber(value) : String(value ?? ''))}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <VerticalBarPlot
        data={data}
        xKey={xKey}
        stacked={stacked}
        showTotal={showTotal ?? stacked}
        accessibilityOverlay={accessibilityOverlay}
        yLines={yLines}
        preset={preset}
        timeZone={timeZone}
      />
    </ChartContainer>
  )
}

VerticalBar.displayName = 'VerticalBar'
