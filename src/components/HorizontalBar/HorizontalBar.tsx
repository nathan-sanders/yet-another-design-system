import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import {
  BAR_GROUP_GAP,
  BAR_MAX_WIDTH,
  BAR_SEGMENT_GAP,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartTooltipWrapperStyle,
  barSegment,
  categoryYAxisProps,
  cursorHighlight,
  formatFullNumber,
  horizontalBarHeight,
  useVisibleSeries,
  valueXAxisProps,
  verticalGridProps,
  type ChartSeries,
} from '../Chart'

/**
 * HorizontalBar — a magnitude per category, as rows.
 *
 * `VerticalBar` turned ninety degrees, for the case a column chart handles
 * badly: categories whose names need the room. A column label lives under a
 * 24px bar and has to abbreviate, tilt or drop out; a row label has the whole
 * row. So this is the chart for browsers, teams, questions, countries — named
 * things — and it is **never a chart over time**. Time reads left to right, and
 * a bar over time is a `VerticalBar`. That is why there is no `xPreset` and no
 * `timeZone` here: the category axis is a list of names, formatted as strings.
 *
 * ## Why this is not `direction` on VerticalBar
 *
 * Turning the chart swaps what each axis *is*: the category axis takes the
 * baseline and every label, the value axis takes the gridlines. Every axis
 * rule changes hands, and the one rule a horizontal bar adds — every row is
 * labeled, so a chart with more rows is taller, not sparser — has no
 * counterpart on the column chart. Two charts sharing a segment, not one chart
 * with a flag. What they share is in `Chart/bars.tsx` and `Chart/axes.ts`.
 *
 * ## The height follows the rows
 *
 * A horizontal bar's height is a function of how many rows it has, the way a
 * table's is, so `height` defaults to `horizontalBarHeight` rather than to a
 * fixed number: 32 per row, the Table's row height, or enough for a group of
 * bars to each reach 16. A fixed default would thin the rows out exactly when
 * there were most of them, which is when this chart was chosen. The prop stays
 * for the dashboard, whose rows own their charts' heights.
 *
 * ## The same segment, on its side
 *
 * `stacked` is the same claim about data it is on VerticalBar, and the segment
 * is the same shape with `orientation: 'horizontal'`: every segment rounded on
 * all four corners, a 1px gap between them taken off each segment's **right**
 * edge, and the rightmost segment left whole so the row's total stays true.
 * Recharts stacks from the baseline outward in either layout, so the last
 * series is the outermost one.
 *
 * Recharts calls this `layout="vertical"`, after the category axis. The names
 * here describe the bar.
 */

export interface HorizontalBarProps {
  data: readonly Record<string, unknown>[]
  /** The category column — what each row is named after. */
  yKey: string
  series: readonly ChartSeries[]
  /** What the chart shows, as a sentence. Becomes its accessible name. */
  label: string
  /**
   * Defaults to one 32px row per category plus the axis — a horizontal bar's
   * height is a function of how many rows it has. Pass a number when something
   * else owns the height, as a dashboard row does.
   */
  height?: number
  /**
   * Stack the series into one row per category instead of placing them one
   * under another. Only true when the parts genuinely sum to something.
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
  /** Gridlines along the value axis, 2–8. */
  xLines?: number
  legend?: 'horizontal' | 'vertical' | false
  /** Let the reader switch series off by clicking the legend. */
  interactiveLegend?: boolean
  className?: string
}

/** One stack. Recharts groups bars sharing a `stackId`. */
const STACK_ID = 'stack'

function HorizontalBarPlot({
  data,
  yKey,
  stacked,
  showTotal,
  accessibilityOverlay,
  xLines,
}: {
  data: readonly Record<string, unknown>[]
  yKey: string
  stacked: boolean
  showTotal: boolean
  accessibilityOverlay: boolean
  xLines: number
}) {
  // `visibleSeries`, not `series`: a series switched off in an interactive
  // legend must stop being drawn. Color was assigned before this filter, so the
  // ones that remain keep the colors they already had.
  const series = useVisibleSeries()

  return (
    <BarChart
      data={data as Record<string, unknown>[]}
      // Recharts names the layout after the category axis, so a chart of
      // horizontal bars is "vertical".
      layout="vertical"
      margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      barGap={BAR_GROUP_GAP}
      // Taken off **each** side of the band — see VerticalBar for why the two
      // modes differ. Here the band is a row's height, and the same numbers
      // are what `horizontalBarHeight` sizes the rows for.
      barCategoryGap={stacked ? '20%' : '10%'}
      accessibilityLayer
    >
      <CartesianGrid {...verticalGridProps} />

      <YAxis dataKey={yKey} {...categoryYAxisProps()} />

      <XAxis {...valueXAxisProps({ lines: xLines })} />

      <Tooltip
        // A band behind the whole row rather than a rule, for the reason the
        // column chart gives: a bar occupies thickness, and a hairline through
        // it points between two bars rather than at one.
        cursor={{ fill: cursorHighlight, fillOpacity: 0.24 }}
        isAnimationActive={false}
        wrapperStyle={chartTooltipWrapperStyle}
        content={<ChartTooltip showTotal={showTotal} />}
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
            orientation: 'horizontal',
            // Recharts stacks in element order from the baseline outward, so
            // the *last* series is the rightmost — the one with nothing beyond
            // it to separate from, and so the only one that keeps its full
            // width.
            isTop: !stacked || index === series.length - 1,
            gap: stacked ? BAR_SEGMENT_GAP : 0,
            accessibilityOverlay,
          })}
        />
      ))}
    </BarChart>
  )
}

export function HorizontalBar({
  data,
  yKey,
  series,
  label,
  height,
  stacked = false,
  showTotal,
  accessibilityOverlay = false,
  xLines = 5,
  legend = 'horizontal',
  interactiveLegend = false,
  className,
}: HorizontalBarProps) {
  return (
    <ChartContainer
      series={series}
      data={data}
      xKey={yKey}
      label={label}
      height={height ?? horizontalBarHeight(data.length, { seriesCount: series.length, stacked })}
      className={className}
      interactiveLegend={interactiveLegend}
      swatch="colorSwatch"
      formatY={(value) => (typeof value === 'number' ? formatFullNumber(value) : String(value ?? ''))}
      header={legend === false ? undefined : <ChartLegend type={legend} />}
    >
      <HorizontalBarPlot
        data={data}
        yKey={yKey}
        stacked={stacked}
        showTotal={showTotal ?? stacked}
        accessibilityOverlay={accessibilityOverlay}
        xLines={xLines}
      />
    </ChartContainer>
  )
}

HorizontalBar.displayName = 'HorizontalBar'
