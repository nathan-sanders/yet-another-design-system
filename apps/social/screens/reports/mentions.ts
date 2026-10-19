import { VOICE_AUTHORS, SPIKE_MENTIONS, type MentionQuery } from '../../data/mentions'
import {
  RANGES,
  effectiveGroupBy,
  feed,
  overviewFor,
  seriesPoints,
  seriesSummaries,
  stories,
  voices,
  type ReportRange,
} from '../../data/reports'
import type { GroupBy, Report, Widget } from '../../data/types'
import { localZone } from './model'

/** The range in words, for the panel's context line; the board's control says `30D`. */
const RANGE_WORDS: Record<ReportRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '3m': 'Last 3 months',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
}

/** Roughly how many engagements a share of a story brings: its mentions are the shares. */
const ENGAGEMENTS_PER_SHARE = 120

/**
 * The mentions behind a report widget, for its "View messages" button. The
 * count is the one the widget is drawn from: the overview's mentions, a
 * chart's series added up in mentions whatever it measures (engagements are
 * made by mentions), the voices' own mention counts. `undefined` for a kind
 * with no messages behind it — none yet, but a new kind has to opt in.
 */
export function widgetMentionQuery(
  report: Report,
  widget: Widget,
  range: ReportRange,
): MentionQuery | undefined {
  const days = RANGES.find((r) => r.value === range)!.days
  const base = {
    key: `report|${report.id}|${widget.id}|${widget.series.join(',')}|${widget.sources}|${range}`,
    title: widget.title,
    context: `${report.name} · ${RANGE_WORDS[range]}`,
    noun: 'mentions' as const,
    withinHours: days * 24,
  }

  switch (widget.kind) {
    case 'overview': {
      const subject = report.topics[0] ?? report.name
      return {
        ...base,
        total: overviewFor(report, range, widget.sources).mentions,
        topics: [{ name: subject, weight: 1 }],
      }
    }
    case 'chart': {
      const summaries = seriesSummaries(
        { series: widget.series, measure: 'mentions', sources: widget.sources },
        range,
      )
      return {
        ...base,
        total: summaries.reduce((sum, s) => sum + s.total, 0),
        // "Other" is everyone else; there is nobody to write its posts as.
        topics: summaries
          .filter((s) => s.series !== 'Other')
          .map((s) => ({ name: s.series, weight: s.total })),
      }
    }
    case 'stories':
      return {
        ...base,
        total: Math.round(
          stories.reduce((sum, s) => sum + s.engagements, 0) / ENGAGEMENTS_PER_SHARE,
        ),
        angle: { kind: 'stories' },
      }
    case 'voices':
      return {
        ...base,
        total: voices.reduce((sum, v) => sum + v.mentions, 0),
        angle: { kind: 'authors', ids: voices.map((v) => VOICE_AUTHORS[v.id]!) },
      }
    case 'spikes':
      return { ...base, total: SPIKE_MENTIONS, angle: { kind: 'spikes' } }
    case 'feed':
      return {
        ...base,
        total: Math.round(feed.reduce((sum, s) => sum + s.engagements, 0) / ENGAGEMENTS_PER_SHARE),
        angle: { kind: 'stories' },
      }
    case 'timeline': {
      const subject = widget.series[0] ?? report.name
      const [summary] = seriesSummaries(
        { series: [subject], measure: 'mentions', sources: 'news' },
        range,
      )
      return { ...base, total: summary?.total ?? 0, topics: [{ name: subject, weight: 1 }] }
    }
    default:
      return undefined
  }
}

const HOUR = 60 * 60 * 1000
const BUCKET_HOURS = { hour: 1, day: 24, week: 24 * 7 } as const

const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: localZone,
})
const HOUR_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  timeZone: localZone,
})

/**
 * The mentions behind one point on a chart widget's trend — a day, or the
 * hour or week the widget is grouped by — for a click on that point. The count
 * is the point's own: its series added up in mentions, or the one series
 * clicked. The window is the bucket, ending where it does (`endsHoursAgo`), so
 * every post is from that day. Keyed by the bucket and the series, so a second
 * click on the same point closes the panel.
 */
export function widgetPointMentionQuery(
  report: Report,
  widget: Widget,
  range: ReportRange,
  /** What the chart is grouped by, which the detail page can change from the widget's own. */
  groupBy: GroupBy,
  index: number,
  series?: string,
): MentionQuery | undefined {
  const base = widgetMentionQuery(report, widget, range)
  if (!base || widget.kind !== 'chart') return undefined
  const by = effectiveGroupBy(range, groupBy)
  const keys = series ? [series] : widget.series
  const points = seriesPoints(
    { series: keys, measure: 'mentions', sources: widget.sources },
    range,
    by,
  )
  const point = points[index]
  if (!point) return undefined

  const start = new Date(point.date).getTime()
  const next = points[index + 1]
  const end = Math.min(
    next ? new Date(next.date).getTime() : start + BUCKET_HOURS[by] * HOUR,
    Date.now(),
  )
  const when =
    by === 'hour'
      ? HOUR_FORMAT.format(start)
      : by === 'week'
        ? `Week of ${DAY_FORMAT.format(start)}`
        : DAY_FORMAT.format(start)
  const named = keys.filter((s) => s !== 'Other')
  return {
    ...base,
    key: `${base.key}|point|${point.date}|${series ?? ''}`,
    title: series ? `${series} · ${when}` : when,
    context: `${widget.title} · ${report.name}`,
    total: keys.reduce((sum, s) => sum + (point[s] as number), 0),
    withinHours: Math.max(1, (end - start) / HOUR),
    endsHoursAgo: Math.max(0, (Date.now() - end) / HOUR),
    topics: named.length
      ? named.map((s) => ({ name: s, weight: point[s] as number }))
      : base.topics,
  }
}

/**
 * The mentions behind one series of a chart widget — a donut's slice, a bar —
 * over the whole range: that brand or topic alone. `undefined` for "Other",
 * which is everyone else and has nobody to write its posts as.
 */
export function widgetSeriesMentionQuery(
  report: Report,
  widget: Widget,
  range: ReportRange,
  series: string,
): MentionQuery | undefined {
  const base = widgetMentionQuery(report, widget, range)
  if (!base || widget.kind !== 'chart' || series === 'Other') return undefined
  const [summary] = seriesSummaries(
    { series: [series], measure: 'mentions', sources: widget.sources },
    range,
  )
  return {
    ...base,
    key: `${base.key}|series|${series}`,
    title: series,
    context: `${widget.title} · ${report.name} · ${RANGE_WORDS[range]}`,
    total: summary?.total ?? 0,
    topics: [{ name: series, weight: 1 }],
  }
}
