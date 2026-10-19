import { Badge } from '../../../../../src/components/Badge'
import { LineSeries } from '../../../../../src/components/LineSeries'
import { Table, pixel, type TableColumn } from '../../../../../src/components/Table'
import { Text } from '../../../../../src/components/Text'
import {
  effectiveGroupBy,
  feed,
  rangeLabel,
  seriesPoints,
  type ReportRange,
} from '../../../data/reports'
import type { FeedItem, GroupBy, Report, Widget } from '../../../data/types'
import { formatCount, formatVelocity, localZone } from '../model'
import { TwoLineCell } from './ListWidgets'

// Media monitoring's two widgets of its own — NewsWhip Spike's live feed and
// its timeline of media interest against public interest.

const SENTIMENT_COLOR = { Positive: 'green', Neutral: 'neutral', Negative: 'red' } as const

function foundLabel(minutes: number): string {
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`
}

const feedColumns: TableColumn<FeedItem>[] = [
  {
    key: 'title',
    header: 'Article or post',
    renderCell: (s) => (
      <TwoLineCell title={s.title} source={s.source} meta={`${s.outlet} · ${s.sourceLabel}`} />
    ),
  },
  {
    key: 'foundMinutes',
    header: 'Found',
    width: pixel(110),
    renderCell: (s) => foundLabel(s.foundMinutes),
    sortValue: (s) => -s.foundMinutes,
  },
  {
    key: 'engagements',
    header: 'So far',
    width: pixel(110),
    numeric: true,
    align: 'right',
    renderCell: (s) => formatCount(s.engagements),
    sortValue: (s) => s.engagements,
  },
  {
    key: 'predicted',
    header: 'Predicted 24h',
    // The header and its sort button, not just the number, set the width.
    width: pixel(160),
    numeric: true,
    align: 'right',
    renderCell: (s) => formatCount(s.predicted),
    sortValue: (s) => s.predicted,
  },
  {
    key: 'velocity',
    header: 'Velocity',
    width: pixel(130),
    numeric: true,
    align: 'right',
    renderCell: (s) => formatVelocity(s.velocity),
    sortValue: (s) => s.velocity,
  },
  {
    key: 'sentiment',
    header: 'Sentiment',
    width: pixel(120),
    sortable: false,
    renderCell: (s) => <Badge color={SENTIMENT_COLOR[s.sentiment]}>{s.sentiment}</Badge>,
  },
]

/**
 * New articles and posts as they are found, newest first. Sort by Predicted
 * 24h to see which will matter — the column NewsWhip Spike is built around.
 */
export function FeedWidget() {
  return (
    <Table
      label="Live feed"
      columns={feedColumns}
      data={feed}
      idKey="id"
      sortable
      textOverflow="truncate"
    />
  )
}

/**
 * Media interest and public interest over the same days: what was written
 * (news and web mentions) above what people did with it (engagements across
 * every source). Two plots rather than one with two axes, because the second
 * is a hundred times the first, and one shared axis would flatten it.
 */
export function TimelineWidget({
  widget,
  range,
  groupBy,
  height,
}: {
  report: Report
  widget: Widget
  range: ReportRange
  groupBy: GroupBy
  height: number
}) {
  const by = effectiveGroupBy(range, groupBy)
  const subject = widget.series[0] ?? 'Veggie Vault'
  const over = rangeLabel(range)
  const plots = [
    {
      key: 'media',
      title: 'Media interest',
      detail: 'Articles and posts published',
      label: `Articles and posts published about ${subject} by ${by} over ${over}`,
      data: seriesPoints({ series: [subject], measure: 'mentions', sources: 'news' }, range, by),
    },
    {
      key: 'public',
      title: 'Public interest',
      detail: 'Interactions with them',
      label: `Interactions with coverage of ${subject} by ${by} over ${over}`,
      data: seriesPoints({ series: [subject], measure: 'engagements', sources: 'all' }, range, by),
    },
  ]
  return (
    <div className="flex flex-col gap-4">
      {plots.map((plot) => (
        <section key={plot.key} aria-label={plot.title} className="flex flex-col gap-1">
          <span className="flex items-baseline gap-2">
            <Text render={<span />} weight="semibold">
              {plot.title}
            </Text>
            <Text render={<span />} size="sm" color="subtle">
              {plot.detail}
            </Text>
          </span>
          <LineSeries
            data={plot.data}
            xKey="date"
            series={[{ key: subject, label: plot.title }]}
            label={plot.label}
            height={Math.max(120, Math.round((height - 40) / 2))}
            legend={false}
            showPoints={false}
            xPreset={by === 'hour' ? 'hours' : 'days'}
            timeZone={localZone}
          />
        </section>
      ))}
    </div>
  )
}
