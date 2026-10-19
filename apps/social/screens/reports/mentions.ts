import { VOICE_AUTHORS, SPIKE_MENTIONS, type MentionQuery } from '../../data/mentions'
import {
  RANGES,
  overviewFor,
  seriesSummaries,
  stories,
  voices,
  type ReportRange,
} from '../../data/reports'
import type { Report, Widget } from '../../data/types'

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
    default:
      return undefined
  }
}
