import type { ReportRange } from '../../../data/reports'
import type { GroupBy, Report, Widget } from '../../../data/types'
import { ChartWidget } from './ChartWidget'
import { SpikesWidget, StoriesWidget, VoicesWidget } from './ListWidgets'
import { OverviewWidget } from './OverviewWidget'

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
      return <StoriesWidget />
    case 'voices':
      return <VoicesWidget />
    case 'spikes':
      return <SpikesWidget />
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
