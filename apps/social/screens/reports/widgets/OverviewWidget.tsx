import { MetricCard, MetricGrid } from '../../../../../src/components/Metric'
import { overviewFor, type ReportRange } from '../../../data/reports'
import type { Report, Widget } from '../../../data/types'
import { formatChange, formatCount } from '../model'

/**
 * The four numbers at the top of a board (`40005911:34608`): mentions,
 * engagements, potential reach and net sentiment, each against the range
 * before. Net sentiment moves in points, not percent, so its trend says so.
 */
export function OverviewWidget({
  report,
  widget,
  range,
  columns,
}: {
  report: Report
  widget: Widget
  range: ReportRange
  columns: 2 | 4
}) {
  const n = overviewFor(report, range, widget.sources)
  const trend = (value: number) => (widget.compare ? value : undefined)
  return (
    <MetricGrid columns={columns}>
      <MetricCard
        label="Mentions"
        value={formatCount(n.mentions)}
        trend={trend(n.mentionsChange)}
      />
      <MetricCard
        label="Engagements"
        value={formatCount(n.engagements)}
        trend={trend(n.engagementsChange)}
      />
      <MetricCard
        label="Potential reach"
        value={formatCount(n.reach)}
        trend={trend(n.reachChange)}
      />
      <MetricCard
        label="Net sentiment"
        value={formatChange(n.sentiment, '')}
        trend={trend(n.sentimentChange)}
        formatTrend={(value) => formatChange(value, ' pts')}
      />
    </MetricGrid>
  )
}
