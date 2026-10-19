import { addDays, startOfDay, toISODate } from './dates'
import { seeded } from './performance'
import type {
  FeedItem,
  GroupBy,
  Report,
  ReportType,
  Spike,
  Story,
  Voice,
  Widget,
  WidgetMeasure,
  WidgetSources,
} from './types'

// Measure › Reports: the list (`40005911:34877`), and the boards behind it.
// Veggie Vault Brand Pulse is the board the file draws (`40005911:34608`), and
// its stories, voices and alerts are written out from it. Every other topic
// monitor and custom report gets a board of the same widgets with numbers of
// its own. All the numbers are generated (`seriesPoints`), so the trend line,
// the share of voice, the overview and the breakdown agree with each other at
// every range — which the file's, drawn one widget at a time, do not.

export const reports: Report[] = [
  {
    id: 'social-trends',
    name: 'Social trends',
    kind: 'builtin',
    status: 'new',
    createdBy: 'yet',
    sharedWith: 'all',
    topics: [],
  },
  {
    id: 'brand-pulse',
    name: 'Veggie Vault Brand Pulse',
    kind: 'custom',
    editedMinutes: 4,
    createdBy: 'nathan',
    sharedWith: { people: ['nathan', 'katie', 'dana'], more: 12 },
    delivery: 'Weekly',
    topics: ['Veggie Vault', 'GreenCrate', 'Sprout & Co'],
  },
  {
    id: 'competitor-watch',
    name: 'Competitor watch',
    kind: 'custom',
    editedMinutes: 60,
    createdBy: 'nathan',
    sharedWith: { people: ['nathan', 'katie', 'dana'], more: 12 },
    delivery: 'Monthly',
    topics: ['GreenCrate', 'Sprout & Co', 'Harvest Box'],
  },
  {
    id: 'plant-based-trends',
    name: 'Plant-based trends',
    kind: 'topic',
    editedMinutes: 180,
    createdBy: 'katie',
    sharedWith: { people: ['katie', 'nathan', 'dana'], more: 4 },
    topics: ['#PlantBased', 'Meal prep', 'Protein bowls'],
  },
  {
    id: 'summer-menu',
    name: 'Summer Menu launch',
    kind: 'custom',
    editedMinutes: 60 * 24,
    createdBy: 'katie',
    sharedWith: { people: ['katie', 'nathan', 'dana'], more: 6 },
    topics: ['Summer menu', 'Smoothie Week', 'Mango Chili Bowl'],
  },
  {
    id: 'packaging',
    name: 'Packaging & sustainability',
    kind: 'topic',
    editedMinutes: 60 * 48,
    createdBy: 'nathan',
    sharedWith: { people: ['nathan', 'katie', 'dana'], more: 3 },
    delivery: 'Daily',
    topics: ['Compostable', 'Zero waste', 'Recyclable'],
  },
  {
    id: 'creator-press',
    name: 'Creator & press mentions',
    kind: 'topic',
    editedMinutes: 60 * 48,
    createdBy: 'dana',
    sharedWith: { people: ['dana', 'nathan', 'katie'], more: 8 },
    topics: ['Creators', 'Press', 'Podcasts'],
  },
  {
    id: 'tag-performance',
    name: 'Tag performance',
    kind: 'builtin',
    status: 'updated',
    createdBy: 'yet',
    sharedWith: 'all',
    topics: [],
  },
  ...(
    [
      ['profile-performance', 'Profile performance', undefined],
      ['post-performance', 'Post performance', 'Monthly'],
      ['paid-performance', 'Paid performance', undefined],
      ['competitor-performance', 'Competitor performance', undefined],
      ['care-performance', 'Care team performance', 'Weekly'],
      ['inbox-performance', 'Inbox performance', undefined],
    ] as const
  ).map(([id, name, delivery]): Report => ({
    id,
    name,
    kind: 'builtin',
    createdBy: 'yet',
    sharedWith: 'all',
    delivery,
    topics: [],
  })),
]

export function reportFor(id: string | undefined): Report | undefined {
  return reports.find((r) => r.id === id)
}

// ---------------------------------------------------------------------------
// The numbers
// ---------------------------------------------------------------------------

/**
 * Mentions a day, on average, for everything a report can track. The three
 * brands on Brand Pulse's trend are the file's breakdown (1.4K, 1.2K and 962 a
 * day); the rest are sized to sit sensibly beside them.
 */
const DAILY_MENTIONS: Record<string, number> = {
  'Veggie Vault': 1400,
  GreenCrate: 1200,
  'Sprout & Co': 960,
  'Harvest Box': 300,
  'Leaf & Ladle': 220,
  Other: 260,
  '#PlantBased': 640,
  'Meal prep': 540,
  'Protein bowls': 440,
  'Summer menu': 360,
  'Smoothie Week': 260,
  'Zero waste': 200,
  'Gut health': 150,
  'Vegan snacks': 100,
  'Mango Chili Bowl': 120,
  Compostable: 180,
  Recyclable: 90,
  Creators: 310,
  Press: 140,
  Podcasts: 60,
}

/** How far one mention goes, by measure: Brand Pulse's 48.2K → 1.31M → 22.4M. */
const PER_MENTION: Record<WidgetMeasure, number> = { mentions: 1, engagements: 27, reach: 465 }

/** The share of the conversation each source carries. */
const SOURCE_SHARE: Record<WidgetSources, number> = { all: 1, social: 0.62, news: 0.38 }

export const MEASURE_LABEL: Record<WidgetMeasure, string> = {
  mentions: 'Mentions',
  engagements: 'Engagements',
  reach: 'Potential reach',
}

export const SOURCES_LABEL: Record<WidgetSources, string> = {
  all: 'All networks, news & web',
  social: 'Social networks only',
  news: 'News & web only',
}

/**
 * How much each series grows a month, compounding. The brand is up 12% on the
 * month before, as the file's breakdown has it, GreenCrate 4%, Sprout & Co
 * down 6%; anything else drifts by a seeded few percent either way.
 */
const MONTHLY_GROWTH: Record<string, number> = {
  'Veggie Vault': 0.12,
  GreenCrate: 0.04,
  'Sprout & Co': -0.06,
  Compostable: 0.3,
  'Smoothie Week': -0.2,
}

function growth(series: string): number {
  return MONTHLY_GROWTH[series] ?? (seeded(`${series}|growth`)() - 0.4) * 0.2
}

/** Anything not in the table above gets a stable size of its own. */
function dailyBase(series: string): number {
  return DAILY_MENTIONS[series] ?? 80 + Math.round(seeded(series)() * 400)
}

const dayCache = new Map<string, number>()

/**
 * One series' mentions on one day. Seeded on the series and the date, not the
 * report, so GreenCrate has the same Tuesday on every board it appears on.
 * The swing is the file's: the lines cross and recross every few days.
 */
function dayMentions(series: string, day: Date): number {
  const iso = toISODate(day)
  const key = `${series}|${iso}`
  const cached = dayCache.get(key)
  if (cached !== undefined) return cached
  const random = seeded(key)
  const phase = seeded(series)() * 6
  const daysSinceEpoch = Math.round(day.getTime() / 86_400_000)
  const wave = 1 + 0.38 * Math.sin(((daysSinceEpoch + phase) / 3.2) * Math.PI)
  // Days back from today, so every window is its growth on the window before.
  const daysAgo = Math.round((startOfDay(new Date()).getTime() - day.getTime()) / 86_400_000)
  const trend = (1 + growth(series)) ** (-daysAgo / 30)
  const value = dailyBase(series) * trend * wave * (0.62 + random() * 0.76)
  dayCache.set(key, value)
  return value
}

/** A day's hours, quiet overnight and busiest at lunch and after work. */
const HOUR_SHAPE = Array.from(
  { length: 24 },
  (_, h) => 0.15 + Math.exp(-((h - 12.5) ** 2) / 8) + 0.8 * Math.exp(-((h - 19) ** 2) / 6),
)
const HOUR_TOTAL = HOUR_SHAPE.reduce((a, b) => a + b, 0)

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/** The board's date presets, in the order the file draws them. `custom` opens a picker. */
export type ReportRange = 'today' | 'yesterday' | '7d' | '30d' | '3m' | '6m' | '12m'

export const RANGES: { value: ReportRange; label: string; days: number }[] = [
  { value: 'today', label: 'Today', days: 1 },
  { value: 'yesterday', label: 'Yesterday', days: 1 },
  { value: '7d', label: '7D', days: 7 },
  { value: '30d', label: '30D', days: 30 },
  { value: '3m', label: '3M', days: 91 },
  { value: '6m', label: '6M', days: 182 },
  { value: '12m', label: '12M', days: 365 },
]

export function rangeFor(value: string | null): ReportRange {
  return RANGES.some((r) => r.value === value) ? (value as ReportRange) : '30d'
}

export function rangeLabel(range: ReportRange): string {
  return RANGES.find((r) => r.value === range)!.label
}

/** The days a range covers, oldest first. Today is the last day of every range but Yesterday. */
export function rangeDays(range: ReportRange, today = startOfDay(new Date())): Date[] {
  const { days } = RANGES.find((r) => r.value === range)!
  const last = range === 'yesterday' ? addDays(today, -1) : today
  return Array.from({ length: days }, (_, i) => addDays(last, i - days + 1))
}

/** The same length of time, just before. What "vs. previous 30D" compares with. */
function previousDays(range: ReportRange): Date[] {
  const days = rangeDays(range)
  return days.map((d) => addDays(d, -days.length))
}

/**
 * The grouping a range can actually draw. Hours past a week is 168+ points
 * of noise, and weeks inside a fortnight are one or two bars, so those fall
 * back to days — and the Hour / Week options say so by being disabled.
 */
export function groupByAllowed(range: ReportRange, by: GroupBy): boolean {
  const days = RANGES.find((r) => r.value === range)!.days
  if (by === 'hour') return days <= 7
  if (by === 'week') return days >= 28
  return true
}

export function effectiveGroupBy(range: ReportRange, by: GroupBy): GroupBy {
  return groupByAllowed(range, by) ? by : 'day'
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

/** Rows for a time chart: `{ date, [series]: value }`, the shape `LineSeries` takes. */
export type SeriesRow = { date: string } & Record<string, number | string>

const scale = (measure: WidgetMeasure, sources: WidgetSources) =>
  PER_MENTION[measure] * SOURCE_SHARE[sources]

/** A widget's series over a range, bucketed by hour, day or week. */
export function seriesPoints(
  widget: Pick<Widget, 'series' | 'measure' | 'sources'>,
  range: ReportRange,
  groupBy: GroupBy,
): SeriesRow[] {
  const by = effectiveGroupBy(range, groupBy)
  const days = rangeDays(range)
  const factor = scale(widget.measure, widget.sources)

  if (by === 'hour') {
    return days.flatMap((day) =>
      HOUR_SHAPE.map((weight, h) => {
        const at = new Date(day)
        at.setHours(h)
        const row: SeriesRow = { date: at.toISOString() }
        for (const s of widget.series) {
          const noise = 0.75 + seeded(`${s}|${toISODate(day)}|${h}`)() * 0.5
          row[s] = Math.round(((dayMentions(s, day) * weight) / HOUR_TOTAL) * noise * factor)
        }
        return row
      }),
    )
  }

  const buckets: Date[][] = []
  if (by === 'week') {
    // Weeks counted back from the last day, so the newest bucket is whole.
    for (let end = days.length; end > 0; end -= 7)
      buckets.unshift(days.slice(Math.max(0, end - 7), end))
  } else {
    for (const day of days) buckets.push([day])
  }
  return buckets.map((bucket) => {
    const row: SeriesRow = { date: bucket[0]!.toISOString() }
    for (const s of widget.series) {
      row[s] = Math.round(bucket.reduce((sum, d) => sum + dayMentions(s, d), 0) * factor)
    }
    return row
  })
}

function total(series: string, days: Date[], factor: number): number {
  return Math.round(days.reduce((sum, d) => sum + dayMentions(series, d), 0) * factor)
}

/** One line of a widget's breakdown: the series over the range, and against the range before. */
export interface SeriesSummary {
  series: string
  total: number
  /** Percent change against the previous range of the same length. */
  change: number
  perDay: number
  /** The busiest day, or hour on a one-day range. */
  peak: Date
}

export function seriesSummaries(
  widget: Pick<Widget, 'series' | 'measure' | 'sources'>,
  range: ReportRange,
): SeriesSummary[] {
  const days = rangeDays(range)
  const before = previousDays(range)
  const factor = scale(widget.measure, widget.sources)
  return widget.series.map((series) => {
    const now = total(series, days, factor)
    const then = total(series, before, factor)
    let peak = days[0]!
    if (days.length === 1) {
      // One day: the peak is an hour.
      const hours = seriesPoints({ ...widget, series: [series] }, range, 'hour')
      const top = hours.reduce((a, b) => ((b[series] as number) > (a[series] as number) ? b : a))
      peak = new Date(top.date)
    } else {
      for (const d of days) if (dayMentions(series, d) > dayMentions(series, peak)) peak = d
    }
    return {
      series,
      total: now,
      change: then ? Math.round(((now - then) / then) * 100) : 0,
      perDay: Math.round(now / days.length),
      peak,
    }
  })
}

/** The Overview widget: the report's subject, over the range, against the range before. */
export interface OverviewNumbers {
  mentions: number
  mentionsChange: number
  engagements: number
  engagementsChange: number
  reach: number
  reachChange: number
  /** Positive minus negative mentions, as points out of 100. */
  sentiment: number
  sentimentChange: number
}

export function overviewFor(
  report: Report,
  range: ReportRange,
  sources: WidgetSources = 'all',
): OverviewNumbers {
  const subject = report.topics[0] ?? report.name
  const [now] = seriesSummaries({ series: [subject], measure: 'mentions', sources }, range)
  const random = seeded(`${report.id}|sentiment|${range}`)
  const change = (wobble: number) => now!.change + Math.round((random() - 0.5) * wobble)
  return {
    mentions: now!.total,
    mentionsChange: now!.change,
    engagements: Math.round(now!.total * PER_MENTION.engagements * (0.92 + random() * 0.16)),
    engagementsChange: change(6),
    reach: Math.round(now!.total * PER_MENTION.reach * (0.92 + random() * 0.16)),
    reachChange: change(10),
    sentiment: report.id === 'brand-pulse' ? 42 : Math.round(10 + random() * 50),
    sentimentChange: report.id === 'brand-pulse' ? -3 : Math.round((random() - 0.5) * 10),
  }
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

const widget = (w: Partial<Widget> & Pick<Widget, 'id' | 'kind' | 'title' | 'viz'>): Widget => ({
  measure: 'mentions',
  series: [],
  sources: 'all',
  groupBy: 'day',
  compare: true,
  spikes: false,
  legend: true,
  ...w,
})

/** A board's widgets by id, and its rows — the shape `DragAndDrop`'s `createBoard` takes. */
export interface BoardFixture {
  widgets: Record<string, Widget>
  rows: Record<string, string[]>
}

/** Brand Pulse as the file draws it (`40005911:34608`): two full rows, then pairs. */
function brandPulse(): BoardFixture {
  const widgets = [
    widget({ id: 'overview', kind: 'overview', title: 'Overview', viz: 'metric' }),
    widget({
      id: 'mentions',
      kind: 'chart',
      title: 'Mentions over time',
      viz: 'line',
      series: ['Veggie Vault', 'GreenCrate', 'Sprout & Co'],
      spikes: true,
    }),
    widget({
      id: 'share',
      kind: 'chart',
      title: 'Share of voice',
      viz: 'donut',
      series: ['Veggie Vault', 'GreenCrate', 'Sprout & Co', 'Harvest Box', 'Leaf & Ladle', 'Other'],
    }),
    widget({
      id: 'topics',
      kind: 'chart',
      title: 'Top topics by engagement',
      viz: 'bar',
      measure: 'engagements',
      legend: true,
      series: [
        '#PlantBased',
        'Meal prep',
        'Protein bowls',
        'Summer menu',
        'Smoothie Week',
        'Zero waste',
        'Gut health',
        'Vegan snacks',
      ],
    }),
    widget({ id: 'stories', kind: 'stories', title: 'Top stories', viz: 'table' }),
    widget({ id: 'voices', kind: 'voices', title: 'Top voices', viz: 'table' }),
    widget({ id: 'spikes', kind: 'spikes', title: 'Spike alerts', viz: 'table' }),
  ]
  return {
    widgets: Object.fromEntries(widgets.map((w) => [w.id, w])),
    rows: {
      'row-1': ['overview'],
      'row-2': ['mentions'],
      'row-3': ['share', 'topics'],
      'row-4': ['stories'],
      'row-5': ['voices', 'spikes'],
    },
  }
}

/**
 * Every other topic monitor and custom report: no frame of its own, so the
 * same widgets drawn from its own topics — the overview, the trend, and the
 * share of voice beside a breakdown of the topics by engagement.
 */
function generated(report: Report): BoardFixture {
  const widgets = [
    widget({ id: 'overview', kind: 'overview', title: 'Overview', viz: 'metric' }),
    widget({
      id: 'mentions',
      kind: 'chart',
      title: 'Mentions over time',
      viz: 'line',
      series: report.topics,
    }),
    widget({
      id: 'share',
      kind: 'chart',
      title: 'Share of voice',
      viz: 'donut',
      series: [...report.topics, 'Other'],
    }),
    widget({
      id: 'engagement',
      kind: 'chart',
      title: 'Engagement by topic',
      viz: 'bar',
      measure: 'engagements',
      series: report.topics,
    }),
  ]
  return {
    widgets: Object.fromEntries(widgets.map((w) => [w.id, w])),
    rows: { 'row-1': ['overview'], 'row-2': ['mentions'], 'row-3': ['share', 'engagement'] },
  }
}

// ---------------------------------------------------------------------------
// Templates: the board each New report type opens on
// ---------------------------------------------------------------------------

/** A board from widgets laid out as rows of ids. */
function laidOut(widgets: Widget[], rows: string[][]): BoardFixture {
  return {
    widgets: Object.fromEntries(widgets.map((w) => [w.id, w])),
    rows: Object.fromEntries(rows.map((row, i) => [`row-${i + 1}`, row])),
  }
}

/** The networks a brand posts to, as series of its own engagement. */
export const OWNED_NETWORKS = ['Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'Threads']

/**
 * What each type of report is made of. Every one draws from the report's own
 * topics, first the subject, so a Competitive report on four brands and a
 * Crisis report on one keyword are the same numbers the rest of Measure has
 * for them. Media monitoring is NewsWhip Spike's shape: what was just found,
 * how far it is predicted to go, media interest against public interest, and
 * what is spiking.
 */
function template(type: ReportType, report: Report): BoardFixture {
  const topics = report.topics
  const subject = topics.slice(0, 1)
  const sources = report.sources ?? 'all'
  const w = (spec: Parameters<typeof widget>[0]) => widget({ sources, ...spec })
  const overview = w({ id: 'overview', kind: 'overview', title: 'Overview', viz: 'metric' })
  switch (type) {
    case 'media':
      return laidOut(
        [
          overview,
          w({ id: 'feed', kind: 'feed', title: 'Live feed', viz: 'table' }),
          w({
            id: 'timeline',
            kind: 'timeline',
            title: 'Media vs public interest',
            viz: 'line',
            series: subject,
          }),
          w({ id: 'spikes', kind: 'spikes', title: 'Spike alerts', viz: 'table' }),
          w({ id: 'voices', kind: 'voices', title: 'Top outlets & authors', viz: 'table' }),
        ],
        [['overview'], ['feed'], ['timeline'], ['spikes', 'voices']],
      )
    case 'listening':
      return laidOut(
        [
          overview,
          w({
            id: 'mentions',
            kind: 'chart',
            title: 'Mentions over time',
            viz: 'line',
            series: topics,
            spikes: true,
          }),
          w({ id: 'sentiment', kind: 'sentiment', title: 'Sentiment', viz: 'donut' }),
          w({ id: 'voices', kind: 'voices', title: 'Top voices', viz: 'table' }),
          w({ id: 'stories', kind: 'stories', title: 'Top stories', viz: 'table' }),
        ],
        [['overview'], ['mentions'], ['sentiment', 'voices'], ['stories']],
      )
    case 'competitive':
      return laidOut(
        [
          overview,
          w({ id: 'share', kind: 'chart', title: 'Share of voice', viz: 'donut', series: topics }),
          w({
            id: 'engagement',
            kind: 'chart',
            title: 'Engagement by brand',
            viz: 'bar',
            measure: 'engagements',
            series: topics,
          }),
          w({
            id: 'mentions',
            kind: 'chart',
            title: 'Mentions by brand',
            viz: 'line',
            series: topics,
          }),
          w({
            id: 'breakdown',
            kind: 'chart',
            title: 'Brand breakdown',
            viz: 'table',
            series: topics,
          }),
          w({ id: 'stories', kind: 'stories', title: 'Top stories', viz: 'table' }),
        ],
        [['overview'], ['share', 'engagement'], ['mentions'], ['breakdown'], ['stories']],
      )
    case 'crisis':
      return laidOut(
        [
          overview,
          w({
            id: 'timeline',
            kind: 'timeline',
            title: 'How the story is spreading',
            viz: 'line',
            series: subject,
          }),
          w({ id: 'spikes', kind: 'spikes', title: 'Spike alerts', viz: 'table' }),
          w({ id: 'sentiment', kind: 'sentiment', title: 'Sentiment', viz: 'donut' }),
          w({ id: 'voices', kind: 'voices', title: 'Who is amplifying it', viz: 'table' }),
          w({ id: 'feed', kind: 'feed', title: 'Latest coverage', viz: 'table' }),
        ],
        [['overview'], ['timeline'], ['spikes', 'sentiment'], ['voices'], ['feed']],
      )
    case 'campaign':
      return laidOut(
        [
          overview,
          w({
            id: 'mentions',
            kind: 'chart',
            title: 'Mentions over time',
            viz: 'area',
            series: topics,
            compare: true,
          }),
          w({
            id: 'reach',
            kind: 'chart',
            title: 'Reach by topic',
            viz: 'bar',
            measure: 'reach',
            series: topics,
          }),
          w({ id: 'voices', kind: 'voices', title: 'Top voices', viz: 'table' }),
          w({ id: 'stories', kind: 'stories', title: 'Earned coverage', viz: 'table' }),
        ],
        [['overview'], ['mentions'], ['reach', 'voices'], ['stories']],
      )
    case 'trend':
      return laidOut(
        [
          w({ id: 'trending', kind: 'trending', title: 'Trending near your brand', viz: 'table' }),
          w({
            id: 'growth',
            kind: 'chart',
            title: 'Topic growth',
            viz: 'line',
            series: topics,
          }),
          w({
            id: 'share',
            kind: 'chart',
            title: 'Share of conversation',
            viz: 'donut',
            series: topics,
          }),
          w({ id: 'stories', kind: 'stories', title: 'Stories driving it', viz: 'table' }),
        ],
        [['growth'], ['trending', 'share'], ['stories']],
      )
    case 'performance':
      return laidOut(
        [
          overview,
          w({
            id: 'networks',
            kind: 'chart',
            title: 'Engagement by network',
            viz: 'line',
            measure: 'engagements',
            series: OWNED_NETWORKS,
          }),
          w({
            id: 'network-share',
            kind: 'chart',
            title: 'Engagement share',
            viz: 'donut',
            measure: 'engagements',
            series: OWNED_NETWORKS,
          }),
          w({
            id: 'network-table',
            kind: 'chart',
            title: 'Network breakdown',
            viz: 'table',
            measure: 'engagements',
            series: OWNED_NETWORKS,
          }),
          w({ id: 'posts', kind: 'posts', title: 'Your top posts', viz: 'table' }),
        ],
        [['overview'], ['networks'], ['network-share', 'network-table'], ['posts']],
      )
    case 'blank':
      return { widgets: {}, rows: {} }
  }
}

/**
 * The widget an empty board's Add widget puts on it: the subject's mentions
 * over time, which the Edit panel then turns into whatever was wanted.
 */
export function starterWidget(report: Report, id: string): Widget {
  return widget({
    id,
    kind: 'chart',
    title: 'Mentions over time',
    viz: 'line',
    series: report.topics.length ? report.topics : [report.name],
    sources: report.sources ?? 'all',
  })
}

/** The board a report opens on, or nothing for a built-in report, which has no design. */
export function boardFixture(report: Report): BoardFixture | undefined {
  if (report.kind === 'builtin') return undefined
  if (report.type) return template(report.type, report)
  return report.id === 'brand-pulse' ? brandPulse() : generated(report)
}

// ---------------------------------------------------------------------------
// Brand Pulse's lists, from the file
// ---------------------------------------------------------------------------

export const stories: Story[] = [
  {
    id: 's1',
    title: "Veggie Vault's new Protein Plates sell out in 48 hours",
    outlet: 'Food & Wine Daily',
    source: 'news',
    sourceLabel: 'News',
    hoursAgo: 3,
    engagements: 182_400,
    velocity: 12_100,
    sentiment: 'Positive',
  },
  {
    id: 's2',
    title: "I tried every Veggie Vault bowl so you don't have to",
    outlet: '@plantpowerpaige',
    source: 'tiktok',
    sourceLabel: 'TikTok',
    hoursAgo: 5,
    engagements: 96_800,
    velocity: 8_400,
    sentiment: 'Positive',
  },
  {
    id: 's3',
    title: "Is Veggie Vault's packaging actually compostable?",
    outlet: 'r/ZeroWaste',
    source: 'reddit',
    sourceLabel: 'Reddit',
    hoursAgo: 8,
    engagements: 41_200,
    velocity: 2_900,
    sentiment: 'Negative',
  },
  {
    id: 's4',
    title: 'GreenCrate vs Veggie Vault: which meal kit wins summer?',
    outlet: 'The Kitchn',
    source: 'web',
    sourceLabel: 'Web',
    hoursAgo: 12,
    engagements: 38_900,
    velocity: 1_700,
    sentiment: 'Neutral',
  },
  {
    id: 's5',
    title: 'Summer Menu drop: the Mango Chili Grain Bowl is here',
    outlet: '@veggie_vault',
    source: 'instagram',
    sourceLabel: 'Instagram',
    hoursAgo: 24,
    engagements: 27_500,
    velocity: 640,
    sentiment: 'Positive',
  },
  {
    id: 's6',
    title: "Plant-based meal prep is 2026's fastest-growing food habit",
    outlet: 'Bloomberg',
    source: 'news',
    sourceLabel: 'News',
    hoursAgo: 26,
    engagements: 22_100,
    velocity: 1_100,
    sentiment: 'Neutral',
  },
]

export const voices: Voice[] = [
  {
    id: 'v1',
    name: 'Paige Patel',
    handle: '@plantpowerpaige',
    source: 'tiktok',
    mentions: 34,
    reach: 1_200_000,
  },
  {
    id: 'v2',
    name: 'Food & Wine Daily',
    handle: 'foodandwinedaily.com',
    source: 'web',
    mentions: 12,
    reach: 3_800_000,
  },
  {
    id: 'v3',
    name: 'Marcus Lee',
    handle: '@marcuseatsgreen',
    source: 'instagram',
    mentions: 9,
    reach: 640_000,
  },
  {
    id: 'v4',
    name: 'Dana Okafor',
    handle: '@danacooksplants',
    source: 'threads',
    mentions: 7,
    reach: 210_000,
  },
  {
    id: 'v5',
    name: 'r/MealPrepSunday',
    handle: 'reddit.com/r/MealPrepSunday',
    source: 'reddit',
    mentions: 6,
    reach: 3_100_000,
  },
]

export const spikes: Spike[] = [
  {
    id: 'k1',
    title: '"compostable" mentions spiking',
    detail: '412 mentions in 6h · mostly Reddit',
    icon: 'zap',
    change: '+340%',
    tone: 'red',
  },
  {
    id: 'k2',
    title: 'Protein Plates sell-out story taking off',
    detail: '182K engagements · 12 outlets picked it up',
    icon: 'up',
    change: '+210%',
    tone: 'green',
  },
  {
    id: 'k3',
    title: '@plantpowerpaige review going viral',
    detail: '96.8K engagements on TikTok in 5h',
    icon: 'flame',
    change: '+165%',
    tone: 'green',
  },
  {
    id: 'k4',
    title: 'GreenCrate summer promo gaining share',
    detail: 'Share of voice up 4 pts this week',
    icon: 'megaphone',
    change: '+4 pts',
    tone: 'yellow',
  },
  {
    id: 'k5',
    title: '#SmoothieWeek slowing down',
    detail: 'Mentions back to baseline after Monday',
    icon: 'down',
    change: '−32%',
    tone: 'neutral',
  },
]

/**
 * Media monitoring's live feed: what was found in the last hour or so, newest
 * first, each with the interactions it is predicted to reach in its first 24
 * hours. The prediction is what NewsWhip Spike sorts on, so a two-minute-old
 * article can outrank an older one with more so far.
 */
export const feed: FeedItem[] = [
  {
    id: 'f1',
    title: 'Veggie Vault confirms compostable trays are coming to every box',
    outlet: 'Grocery Dive',
    source: 'news',
    sourceLabel: 'News',
    hoursAgo: 0,
    foundMinutes: 2,
    engagements: 1_240,
    predicted: 58_000,
    velocity: 4_100,
    sentiment: 'Positive',
  },
  {
    id: 'f2',
    title: 'Thread: my Veggie Vault box arrived with half the ice packs melted',
    outlet: '@samcooksslow',
    source: 'threads',
    sourceLabel: 'Threads',
    hoursAgo: 0,
    foundMinutes: 6,
    engagements: 880,
    predicted: 21_000,
    velocity: 1_900,
    sentiment: 'Negative',
  },
  {
    id: 'f3',
    title: 'The meal-kit price war: GreenCrate cuts boxes to $7.99 a plate',
    outlet: 'Bloomberg',
    source: 'news',
    sourceLabel: 'News',
    hoursAgo: 0,
    foundMinutes: 11,
    engagements: 3_600,
    predicted: 44_000,
    velocity: 3_200,
    sentiment: 'Neutral',
  },
  {
    id: 'f4',
    title: 'Protein Plates restock day — full haul and taste test',
    outlet: '@plantpowerpaige',
    source: 'tiktok',
    sourceLabel: 'TikTok',
    hoursAgo: 0,
    foundMinutes: 18,
    engagements: 12_400,
    predicted: 120_000,
    velocity: 9_800,
    sentiment: 'Positive',
  },
  {
    id: 'f5',
    title: 'Is Veggie Vault’s packaging actually compostable? An update',
    outlet: 'r/ZeroWaste',
    source: 'reddit',
    sourceLabel: 'Reddit',
    hoursAgo: 0,
    foundMinutes: 26,
    engagements: 2_100,
    predicted: 9_500,
    velocity: 640,
    sentiment: 'Negative',
  },
  {
    id: 'f6',
    title: '12 plant-based meal kits ranked for summer 2026',
    outlet: 'The Kitchn',
    source: 'web',
    sourceLabel: 'Web',
    hoursAgo: 0,
    foundMinutes: 41,
    engagements: 1_700,
    predicted: 14_000,
    velocity: 820,
    sentiment: 'Neutral',
  },
  {
    id: 'f7',
    title: 'Mango Chili Bowl is the best thing on the summer menu, fight me',
    outlet: '@marcuseatsgreen',
    source: 'instagram',
    sourceLabel: 'Instagram',
    hoursAgo: 1,
    foundMinutes: 58,
    engagements: 6_300,
    predicted: 31_000,
    velocity: 2_400,
    sentiment: 'Positive',
  },
]
