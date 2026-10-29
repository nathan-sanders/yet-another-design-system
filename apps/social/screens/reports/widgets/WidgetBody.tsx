import type { DiscoverRange } from '../../../data/discover'
import { RANGES, type ReportRange } from '../../../data/reports'
import type { GroupBy, Report, Widget } from '../../../data/types'
import {
  CampaignPostsWidget,
  CreatorPostsWidget,
  HashtagsWidget,
  TargetsWidget,
} from '../../campaigns/MeasureWidgets'
import { topPosts } from '../../discover/topPosts'
import { SentimentBody, TopPostsGrid, TrendingList } from '../../discover/widgets'
import { ChartWidget } from './ChartWidget'
import { SpikesWidget, StoriesWidget, VoicesWidget } from './ListWidgets'
import { FeedWidget, TimelineWidget } from './MonitoringWidgets'
import { OverviewWidget } from './OverviewWidget'

/** Discover has three ranges to a report's seven; a board's range picks the nearest. */
function discoverRange(range: ReportRange): DiscoverRange {
  if (range === 'today' || range === 'yesterday') return '24h'
  return range === '7d' ? '7d' : '30d'
}

/** Whatever a widget draws, by its kind — the one switch the board and the detail page share. */
export function WidgetBody({
  report,
  widget,
  range,
  groupBy,
  height,
  wide,
}: {
  report: Report
  widget: Widget
  range: ReportRange
  groupBy: GroupBy
  height: number
  /** Room for four metric cards across rather than two. */
  wide: boolean
}) {
  const columns = wide ? 4 : 2
  switch (widget.kind) {
    case 'overview':
      return <OverviewWidget report={report} widget={widget} range={range} columns={columns} />
    case 'stories':
      return <StoriesWidget report={report} widget={widget} range={range} />
    case 'voices':
      return <VoicesWidget report={report} widget={widget} range={range} />
    case 'spikes':
      return <SpikesWidget report={report} widget={widget} range={range} />
    case 'feed':
      return <FeedWidget report={report} widget={widget} range={range} />
    case 'timeline':
      return (
        <TimelineWidget
          report={report}
          widget={widget}
          range={range}
          groupBy={groupBy}
          height={height}
        />
      )
    case 'sentiment':
      return <SentimentBody range={discoverRange(range)} />
    case 'trending':
      return <TrendingList range={discoverRange(range)} />
    case 'posts':
      return <TopPostsGrid posts={topPosts(RANGES.find((r) => r.value === range)!.days)} />
    // A campaign's own (`screens/campaigns/MeasureWidgets.tsx`).
    case 'targets':
      return <TargetsWidget report={report} columns={columns} />
    case 'hashtags':
      return <HashtagsWidget report={report} />
    case 'campaign-posts':
      return <CampaignPostsWidget report={report} />
    case 'creator-posts':
      return <CreatorPostsWidget report={report} />
    case 'chart':
      return (
        <ChartWidget
          report={report}
          widget={widget}
          range={range}
          groupBy={groupBy}
          height={height}
          columns={columns}
        />
      )
  }
}
