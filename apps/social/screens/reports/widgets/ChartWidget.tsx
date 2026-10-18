import { AreaSeries } from '../../../../../src/components/AreaSeries'
import { Badge } from '../../../../../src/components/Badge'
import { ChartSwatch, categorical, markerForIndex } from '../../../../../src/components/Chart'
import { Donut } from '../../../../../src/components/Donut'
import { HorizontalBar } from '../../../../../src/components/HorizontalBar'
import { LineSeries } from '../../../../../src/components/LineSeries'
import { MetricCard, MetricGrid } from '../../../../../src/components/Metric'
import { Table, type TableColumn } from '../../../../../src/components/Table'
import {
  MEASURE_LABEL,
  effectiveGroupBy,
  rangeLabel,
  seriesPoints,
  seriesSummaries,
  type ReportRange,
  type SeriesSummary,
} from '../../../data/reports'
import type { GroupBy, Widget } from '../../../data/types'
import { formatChange, formatCount, localZone } from '../model'

/** Past this many points a marker per point merges into a band (LineSeries' `showPoints`). */
const MAX_POINTS_WITH_MARKERS = 40

/**
 * A `chart` widget: one measure across a set of series, drawn as whichever of
 * the Edit panel's six visualizations it is set to. Line and area draw the
 * series over time; bar, donut, metric and table draw each series' total over
 * the range. Swap the viz and the numbers stay the same — only the drawing
 * changes, which is what the panel promises.
 */
export function ChartWidget({
  widget,
  range,
  groupBy,
  height,
  columns,
}: {
  widget: Widget
  range: ReportRange
  groupBy: GroupBy
  /** The plot's height; the row decides it. */
  height: number
  /** How many metric cards fit across, for the metric viz. */
  columns: 2 | 4
}) {
  const measure = MEASURE_LABEL[widget.measure]
  const series = widget.series.map((key) => ({ key, label: key }))
  const legend: 'horizontal' | false = widget.legend ? 'horizontal' : false
  const over = rangeLabel(range)

  if (widget.viz === 'line' || widget.viz === 'area') {
    const by = effectiveGroupBy(range, groupBy)
    const data = seriesPoints(widget, range, by)
    const shared = {
      data,
      xKey: 'date',
      series,
      label: `${measure} by ${by} over ${over}: ${widget.series.join(', ')}`,
      height,
      legend,
      xPreset: by === 'hour' ? ('hours' as const) : ('days' as const),
      timeZone: localZone,
    }
    return widget.viz === 'line' ? (
      <LineSeries {...shared} showPoints={data.length <= MAX_POINTS_WITH_MARKERS} />
    ) : (
      <AreaSeries {...shared} />
    )
  }

  const summaries = seriesSummaries(widget, range)
  const totals = summaries.map((s) => ({ name: s.series, value: s.total }))

  switch (widget.viz) {
    case 'bar':
      return (
        <HorizontalBar
          data={totals}
          yKey="name"
          series={[{ key: 'value', label: measure }]}
          label={`${measure} by topic over ${over}`}
          legend={legend}
        />
      )
    case 'donut':
      return (
        <Donut
          data={totals}
          nameKey="name"
          valueKey="value"
          label={`${measure} share over ${over}`}
          height={height}
          legend={legend}
        />
      )
    case 'metric':
      return (
        <MetricGrid columns={columns}>
          {summaries.map((s) => (
            <MetricCard
              key={s.series}
              label={s.series}
              value={formatCount(s.total)}
              trend={widget.compare ? s.change : undefined}
            />
          ))}
        </MetricGrid>
      )
    case 'table':
      return <BreakdownTable widget={widget} range={range} summaries={summaries} />
  }
}

/**
 * Each series' totals over the range, with its legend mark — Figma's
 * `Breakdown` under the widget detail (`40005911:35384`), whose Series cells
 * are the chart legend's `_Swatch Label`s. Also the `table` viz.
 */
export function BreakdownTable({
  widget,
  range,
  summaries = seriesSummaries(widget, range),
  peakFormat,
}: {
  widget: Widget
  range: ReportRange
  summaries?: SeriesSummary[]
  /** Formats the Peak column; leave it out to drop the column. */
  peakFormat?: Intl.DateTimeFormat
}) {
  const measure = MEASURE_LABEL[widget.measure]
  const marks = widget.viz === 'line'
  const columns: TableColumn<SeriesSummary>[] = [
    {
      key: 'series',
      header: 'Series',
      renderCell: (s) => {
        const index = widget.series.indexOf(s.series)
        return (
          <span className="flex items-center gap-2">
            {/* The chart's own key: a marker on a line for a line chart, a
                square for everything else. Decorative — the name follows. */}
            <ChartSwatch
              shape={marks ? markerForIndex(index) : 'colorSwatch'}
              color={categorical(index)}
              aria-hidden
            />
            {s.series}
          </span>
        )
      },
      sortValue: (s) => s.series,
    },
    ...(peakFormat
      ? [
          {
            key: 'peak',
            header: range === 'today' || range === 'yesterday' ? 'Peak hour' : 'Peak day',
            renderCell: (s: SeriesSummary) => peakFormat.format(s.peak),
            sortValue: (s: SeriesSummary) => s.peak.getTime(),
          },
        ]
      : []),
    {
      key: 'total',
      header: measure,
      numeric: true,
      align: 'right',
      renderCell: (s) => formatCount(s.total),
      sortValue: (s) => s.total,
    },
    {
      key: 'perDay',
      header: 'Avg / day',
      numeric: true,
      align: 'right',
      renderCell: (s) => formatCount(s.perDay),
      sortValue: (s) => s.perDay,
    },
    ...(widget.compare
      ? [
          {
            key: 'change',
            header: `vs. previous ${rangeLabel(range)}`,
            renderCell: (s: SeriesSummary) => (
              <Badge color={s.change > 0 ? 'green' : s.change < 0 ? 'red' : 'neutral'}>
                {formatChange(s.change)}
              </Badge>
            ),
            sortValue: (s: SeriesSummary) => s.change,
          },
        ]
      : []),
  ]
  return (
    <Table
      label={`${widget.title}: ${measure} by series`}
      columns={columns}
      data={summaries}
      idKey="series"
      sortable
    />
  )
}
