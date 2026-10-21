import {
  Activity,
  ChartArea,
  ChartLine,
  ChartNoAxesColumn,
  ChartPie,
  Gauge,
  Heart,
  LayoutGrid,
  Newspaper,
  Rss,
  Send,
  Table2,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { widget } from '../../data/reports'
import type { Report, Widget } from '../../data/types'

export type CatalogGroup = 'Charts' | 'Monitoring' | 'Lists'

/** One widget the Add widget panel offers. `make` builds it for the report it is added to. */
export interface CatalogEntry {
  id: string
  group: CatalogGroup
  title: string
  description: string
  /** Words a search should also find it by: what it is drawn as, mostly. */
  keywords: string
  icon: LucideIcon
  make: (report: Report, id: string) => Widget
}

/** A chart's series: the report's topics, or the report itself when it tracks none. */
const seriesOf = (report: Report) => (report.topics.length ? report.topics : [report.name])
const subjectOf = (report: Report) => seriesOf(report).slice(0, 1)
const sourcesOf = (report: Report) => report.sources ?? 'all'

/**
 * Every widget a report board can hold, for the Add widget panel. Code-first:
 * the file has no catalog. Each entry is a widget one of the templates in
 * `data/reports.ts` already puts on a board, so whatever is added draws with
 * the same numbers as the rest of Measure.
 */
export const CATALOG: CatalogEntry[] = [
  {
    id: 'mentions',
    keywords: 'line chart trend',
    group: 'Charts',
    title: 'Mentions over time',
    description: 'A line per topic, day by day',
    icon: ChartLine,
    make: (report, id) =>
      widget({
        id,
        kind: 'chart',
        title: 'Mentions over time',
        viz: 'line',
        series: seriesOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'engagements',
    keywords: 'area chart trend',
    group: 'Charts',
    title: 'Engagements over time',
    description: 'How much people engaged, stacked by topic',
    icon: ChartArea,
    make: (report, id) =>
      widget({
        id,
        kind: 'chart',
        title: 'Engagements over time',
        viz: 'area',
        measure: 'engagements',
        series: seriesOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'share',
    keywords: 'donut pie chart',
    group: 'Charts',
    title: 'Share of voice',
    description: 'Each topic’s part of the conversation',
    icon: ChartPie,
    make: (report, id) =>
      widget({
        id,
        kind: 'chart',
        title: 'Share of voice',
        viz: 'donut',
        series: seriesOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'reach',
    keywords: 'bar chart',
    group: 'Charts',
    title: 'Reach by topic',
    description: 'How many people each topic reached',
    icon: ChartNoAxesColumn,
    make: (report, id) =>
      widget({
        id,
        kind: 'chart',
        title: 'Reach by topic',
        viz: 'bar',
        measure: 'reach',
        series: seriesOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'totals',
    keywords: 'metric number kpi',
    group: 'Charts',
    title: 'Mention totals',
    description: 'One number per topic, with its change',
    icon: Gauge,
    make: (report, id) =>
      widget({
        id,
        kind: 'chart',
        title: 'Mention totals',
        viz: 'metric',
        series: seriesOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'breakdown',
    keywords: 'table',
    group: 'Charts',
    title: 'Breakdown',
    description: 'Every topic’s numbers in a table',
    icon: Table2,
    make: (report, id) =>
      widget({
        id,
        kind: 'chart',
        title: 'Breakdown',
        viz: 'table',
        series: seriesOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'overview',
    keywords: 'metric number kpi summary',
    group: 'Monitoring',
    title: 'Overview',
    description: 'Mentions, engagements, reach and sentiment',
    icon: LayoutGrid,
    make: (report, id) =>
      widget({
        id,
        kind: 'overview',
        title: 'Overview',
        viz: 'metric',
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'spikes',
    keywords: 'table alert',
    group: 'Monitoring',
    title: 'Spike alerts',
    description: 'Moments the conversation jumped',
    icon: Zap,
    make: (report, id) =>
      widget({
        id,
        kind: 'spikes',
        title: 'Spike alerts',
        viz: 'table',
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'timeline',
    keywords: 'line chart media',
    group: 'Monitoring',
    title: 'Media vs public interest',
    description: 'What was written against what people engaged with',
    icon: Activity,
    make: (report, id) =>
      widget({
        id,
        kind: 'timeline',
        title: 'Media vs public interest',
        viz: 'line',
        series: subjectOf(report),
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'feed',
    keywords: 'table news articles',
    group: 'Monitoring',
    title: 'Live feed',
    description: 'New coverage as it is found',
    icon: Rss,
    make: (report, id) =>
      widget({ id, kind: 'feed', title: 'Live feed', viz: 'table', sources: sourcesOf(report) }),
  },
  {
    id: 'sentiment',
    keywords: 'gauge donut positive negative',
    group: 'Monitoring',
    title: 'Sentiment',
    description: 'How people feel, and why',
    icon: Heart,
    make: (report, id) =>
      widget({
        id,
        kind: 'sentiment',
        title: 'Sentiment',
        viz: 'donut',
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'stories',
    keywords: 'table news articles',
    group: 'Lists',
    title: 'Top stories',
    description: 'The coverage that traveled furthest',
    icon: Newspaper,
    make: (report, id) =>
      widget({
        id,
        kind: 'stories',
        title: 'Top stories',
        viz: 'table',
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'voices',
    keywords: 'table authors outlets',
    group: 'Lists',
    title: 'Top voices',
    description: 'The outlets and people talking most',
    icon: Users,
    make: (report, id) =>
      widget({ id, kind: 'voices', title: 'Top voices', viz: 'table', sources: sourcesOf(report) }),
  },
  {
    id: 'trending',
    keywords: 'table topics',
    group: 'Lists',
    title: 'Trending topics',
    description: 'What is rising near your brand',
    icon: TrendingUp,
    make: (report, id) =>
      widget({
        id,
        kind: 'trending',
        title: 'Trending topics',
        viz: 'table',
        sources: sourcesOf(report),
      }),
  },
  {
    id: 'posts',
    keywords: 'grid published',
    group: 'Lists',
    title: 'Your top posts',
    description: 'Your own best published posts',
    icon: Send,
    make: (report, id) =>
      widget({
        id,
        kind: 'posts',
        title: 'Your top posts',
        viz: 'table',
        sources: sourcesOf(report),
      }),
  },
]

export const CATALOG_GROUPS: CatalogGroup[] = ['Charts', 'Monitoring', 'Lists']

/** The id a catalog tile carries while it is dragged, so the board can tell it from a widget. */
export const catalogDragId = (entry: CatalogEntry) => `catalog:${entry.id}`

/** What a catalog tile's drag carries in `data`. */
export interface CatalogDragData {
  source: 'catalog'
  entry: CatalogEntry
}

export function isCatalogDrag(data: unknown): data is CatalogDragData {
  return (data as CatalogDragData | undefined)?.source === 'catalog'
}

/** Entries whose title, description, group or keywords have `query` in them. */
export function searchCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return CATALOG
  return CATALOG.filter((entry) =>
    [entry.title, entry.description, entry.group, entry.keywords].some((text) =>
      text.toLowerCase().includes(q),
    ),
  )
}
