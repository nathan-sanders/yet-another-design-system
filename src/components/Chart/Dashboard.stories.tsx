import { Ellipsis } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { AreaSeries } from '../AreaSeries'
import { BentoGrid } from '../BentoGrid'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Donut } from '../Donut'
import { HeatMap } from '../HeatMap'
import { LineSeries } from '../LineSeries'
import { MetricCard, MetricGrid } from '../Metric'
import { Radar } from '../Radar'
import { Spark } from '../Spark'
import { TreeMap } from '../TreeMap'
import { VerticalBar } from '../VerticalBar'
import { formatFullNumber } from './axes'
import {
  dailyData,
  heatMapData,
  hourlyData,
  monthlyData,
  radarData,
  sliceData,
  treeMapData,
} from './sample-data'

/**
 * The whole point of the exercise.
 *
 * Everything below is composed from components that already existed —
 * `BentoGrid`, `ContentBlock`, `Card`, `Badge` — with charts as their content.
 * **A chart has no card, no title and no overflow menu of its own**, because
 * those belong to `ContentBlock` and it already has them. That line is the one
 * `ContentBlock`'s own record draws about a metric, holding for eight more
 * components.
 *
 * It lives here rather than under any one chart because it is not about any one
 * chart. It is the integration test that the family agrees with itself: one
 * color order, one legend, one tooltip, one set of axis rules, in one grid.
 */
const meta = {
  title: 'Data Viz/Dashboard',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const SERIES = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'signups', label: 'Signups' },
  { key: 'conversions', label: 'Conversions' },
]

const HEAT = heatMapData()
const SLICES = sliceData(6)
const TOTAL = SLICES.reduce((sum, row) => sum + (row.sessions as number), 0)

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ContentBlock className="h-full">
      <ContentBlock.Header
        actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label={`${title} options`} />}
      >
        {title}
      </ContentBlock.Header>
      <ContentBlock.Content>{children}</ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * The reference dashboard, rebuilt: a metric row, a line series, a donut and a
 * radar — the four blocks of the screenshot this project started from.
 *
 * Note the metric row collapses to **two** columns on a phone rather than one.
 * That is the only thing separating `MetricGrid` from `BentoGrid`, and the
 * reason it exists.
 */
export const Reference: Story = {
  render: () => (
    <BentoGrid columns={4}>
      <BentoGrid.Cell colSpan={4}>
        <Block title="Metric grid">
          <MetricGrid>
            <MetricCard label="Total sessions" value="12,480" trend={8} />
            <MetricCard label="Signups" value="3,204" trend={12} />
            <MetricCard label="Conversion" value="4.2%" trend={-3} />
            <MetricCard label="Churn" value="1.8%" trend={-6} goodDirection="down" />
          </MetricGrid>
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={4}>
        <Block title="Line series">
          <LineSeries
            data={dailyData(31)}
            xKey="date"
            series={SERIES}
            label="Sessions, signups and conversions over 31 days"
            height={260}
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="Donut chart">
          <Donut
            data={SLICES}
            nameKey="browser"
            valueKey="sessions"
            label="Sessions by browser"
            height={260}
            interactiveLegend
            center={
              <>
                <span className="text-content-subtle text-sm">Total</span>
                <span className="text-content-emphasized text-2xl font-semibold">
                  {formatFullNumber(TOTAL)}
                </span>
              </>
            }
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="Radar chart">
          <Radar
            data={radarData(5)}
            axisKey="dimension"
            series={[
              { key: 'modelA', label: 'Model A' },
              { key: 'modelB', label: 'Model B' },
              { key: 'modelC', label: 'Model C' },
            ]}
            label="Three models across five dimensions"
            height={260}
            interactiveLegend
          />
        </Block>
      </BentoGrid.Cell>
    </BentoGrid>
  ),
}

/**
 * Every chart in the library, on one page.
 *
 * Worth looking at as a whole: the same twelve colors in the same order, one
 * legend, one tooltip and one set of axis rules across nine very different
 * forms. Switch the theme and the neutral in the toolbar — nothing here writes
 * a `dark:` variant, and the grid and axes follow the ramp while the series
 * colors deliberately do not.
 */
export const Everything: Story = {
  render: () => (
    <BentoGrid columns={4}>
      <BentoGrid.Cell colSpan={4}>
        <Block title="This month">
          <MetricGrid>
            <MetricCard
              label="Total sessions"
              value="12,480"
              trend={8}
              spark={<Spark data={dailyData(14)} dataKey="sessions" type="line" height={32} decorative />}
            />
            <MetricCard
              label="Signups"
              value="3,204"
              trend={12}
              spark={<Spark data={dailyData(14)} dataKey="signups" type="line" height={32} decorative />}
            />
            <MetricCard
              label="Conversion"
              value="4.2%"
              trend={-3}
              spark={<Spark data={dailyData(14)} dataKey="conversions" type="bar" height={32} decorative />}
            />
            <MetricCard label="Churn" value="1.8%" trend={-6} goodDirection="down" />
          </MetricGrid>
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="Sessions over time">
          <LineSeries
            data={dailyData(31)}
            xKey="date"
            series={SERIES}
            label="Sessions, signups and conversions over 31 days"
            height={220}
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="Volume">
          <AreaSeries
            data={dailyData(31)}
            xKey="date"
            series={[
              { key: 'sessions', label: 'Sessions' },
              { key: 'signups', label: 'Signups' },
            ]}
            label="Sessions and signups over 31 days"
            height={220}
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="By day">
          <VerticalBar
            data={dailyData(14)}
            xKey="date"
            series={SERIES}
            label="Sessions, signups and conversions over 14 days"
            stacked
            height={220}
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="This year">
          <LineSeries
            data={monthlyData()}
            xKey="date"
            series={[
              { key: 'sessions', label: 'Sessions' },
              { key: 'signups', label: 'Signups' },
            ]}
            label="Sessions and signups over 12 months"
            height={220}
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={4}>
        <Block title="When people visit">
          <HeatMap
            rows={HEAT.rows}
            columns={HEAT.columns}
            values={HEAT.values}
            label="Sessions by day of week and hour"
            valueLabel="Sessions"
            cellHeight={26}
          />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="By channel">
          <TreeMap groups={treeMapData()} label="Sessions by channel" height={240} />
        </Block>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <Block title="Last 24 hours">
          <LineSeries
            data={hourlyData()}
            xKey="date"
            series={[{ key: 'sessions', label: 'Sessions' }]}
            label="Sessions over the last 24 hours"
            height={240}
          />
        </Block>
      </BentoGrid.Cell>
    </BentoGrid>
  ),
}
