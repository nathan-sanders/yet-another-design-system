import { useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Ellipsis, X } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'

import { AreaSeries } from '../AreaSeries'
import { BentoGrid } from '../BentoGrid'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Donut } from '../Donut'
import {
  COL_SPAN,
  DragAndDrop,
  DragHandle,
  GRID_COLUMNS,
  MAX_BLOCKS_PER_ROW,
  MIN_SPAN,
  Sortable,
  createBoard,
  dragEnd,
  dragOver,
  maxSpan,
  removeBlock,
  resizeBlock,
  resizeRow,
  rowSpans,
  type ColumnSpan,
} from '../DragAndDrop'
import { ResizeHandle } from '../Resize'
import { HeatMap } from '../HeatMap'
import { LineSeries } from '../LineSeries'
import { MetricCard, MetricGrid } from '../Metric'
import { Radar } from '../Radar'
import { Spark } from '../Spark'
import { TreeMap } from '../TreeMap'
import { VerticalBar } from '../VerticalBar'
import { formatFullNumber } from './axes'
import { cn } from '../../lib/cn'
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

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/** A row's default height, and how far a hand can take it either way. */
const ROW_HEIGHT = 320
const MIN_ROW_HEIGHT = 200
const MAX_ROW_HEIGHT = 600
/**
 * What a block spends on itself before the plot: the 48px header, the 16px
 * under the content, and a legend row with the 16px gap under it. A chart
 * without a legend sits 40px short, which is slack, not overflow.
 */
const CHART_CHROME = 104
/** `gap-4` between the columns, which the span arithmetic has to know about. */
const GRID_GAP = 16

/**
 * Every block the dashboard can hold, by id: a title and the chart, drawn at
 * whatever height the row is. The board only ever holds ids, which is what
 * lets a row's members change without the charts knowing.
 */
const CHARTS: Record<string, { title: string; chart: (height: number) => ReactNode }> = {
  sessions: {
    title: 'Sessions over time',
    chart: (height) => (
      <LineSeries
        data={dailyData(31)}
        xKey="date"
        series={SERIES}
        label="Sessions, signups and conversions over 31 days"
        height={height}
      />
    ),
  },
  volume: {
    title: 'Volume',
    chart: (height) => (
      <AreaSeries
        data={dailyData(31)}
        xKey="date"
        series={[
          { key: 'sessions', label: 'Sessions' },
          { key: 'signups', label: 'Signups' },
        ]}
        label="Sessions and signups over 31 days"
        height={height}
      />
    ),
  },
  'by-day': {
    title: 'By day',
    chart: (height) => (
      <VerticalBar
        data={dailyData(14)}
        xKey="date"
        series={SERIES}
        label="Sessions, signups and conversions over 14 days"
        stacked
        height={height}
      />
    ),
  },
  'this-year': {
    title: 'This year',
    chart: (height) => (
      <LineSeries
        data={monthlyData()}
        xKey="date"
        series={[
          { key: 'sessions', label: 'Sessions' },
          { key: 'signups', label: 'Signups' },
        ]}
        label="Sessions and signups over 12 months"
        height={height}
      />
    ),
  },
  'by-channel': {
    title: 'By channel',
    chart: (height) => <TreeMap groups={treeMapData()} label="Sessions by channel" height={height} />,
  },
  browser: {
    title: 'By browser',
    chart: (height) => (
      <Donut
        data={SLICES}
        nameKey="browser"
        valueKey="sessions"
        label="Sessions by browser"
        height={height}
        interactiveLegend
      />
    ),
  },
  models: {
    title: 'Models',
    chart: (height) => (
      <Radar
        data={radarData(5)}
        axisKey="dimension"
        series={[
          { key: 'modelA', label: 'Model A' },
          { key: 'modelB', label: 'Model B' },
          { key: 'modelC', label: 'Model C' },
        ]}
        label="Three models across five dimensions"
        height={height}
        interactiveLegend
      />
    ),
  },
}

const LAYOUT = {
  'row-1': ['sessions', 'volume'],
  'row-2': ['by-day', 'this-year', 'by-channel'],
  'row-3': ['browser', 'models'],
}

function ChartBlock({
  id,
  span,
  max,
  height,
  onRemove,
  onResize,
}: {
  id: string
  span: ColumnSpan
  /** The widest this block may go; `undefined` for the last block, which has no handle. */
  max?: number
  /** The row's height; the chart gets what is left after the block's own chrome. */
  height: number
  onRemove: (id: string) => void
  onResize: (id: string, next: number) => void
}) {
  const item = useRef<HTMLDivElement>(null)
  const { title, chart } = CHARTS[id]
  return (
    <Sortable.Item
      ref={item}
      id={id}
      label={title}
      role="listitem"
      className={cn(COL_SPAN[span], 'h-(--row-height) rounded-lg')}
    >
      <ContentBlock>
        <ContentBlock.Header
          actions={
            <>
              <DragHandle />
              <Button
                appearance="ghost"
                startIcon={X}
                aria-label={`Remove ${title}`}
                data-drag-ignore
                onClick={() => onRemove(id)}
              />
            </>
          }
        >
          {title}
        </ContentBlock.Header>
        <ContentBlock.Content>{chart(height - CHART_CHROME)}</ContentBlock.Content>
      </ContentBlock>
      {max !== undefined && (
        <ResizeHandle
          label={`Resize ${title}`}
          orientation="vertical"
          value={span}
          min={MIN_SPAN}
          max={max}
          unit={() => {
            const grid = item.current?.parentElement
            return grid ? (grid.getBoundingClientRect().width + GRID_GAP) / GRID_COLUMNS : 1
          }}
          valueText={(value) => `${value} of ${GRID_COLUMNS} columns`}
          onResize={(next) => onResize(id, next)}
          className="absolute inset-y-0 right-0 translate-x-full"
        />
      )}
    </Sortable.Item>
  )
}

const renderComposable: Story['render'] = function ComposableStory() {
  const [board, setBoard] = useState(() => createBoard(LAYOUT))
  const snapshot = useRef(board)

  return (
    <DragAndDrop
      onDragStart={() => {
        snapshot.current = board
      }}
      onDragOver={({ active, over }) => {
        if (over) setBoard((current) => dragOver(current, active.id, over.id))
      }}
      onDragEnd={({ active, over }) => {
        setBoard((current) => dragEnd(current, active.id, over ? over.id : null))
      }}
      onDragCancel={() => setBoard(snapshot.current)}
    >
      <div className="flex flex-col">
        {board.order.map((row, index) => {
          const items = board.containers[row]
          const spans = rowSpans(board, row) as ColumnSpan[]
          const height = board.heights[row] ?? ROW_HEIGHT
          const name = `Row ${index + 1}`
          return (
            <div
              key={row}
              className="flex flex-col"
              style={{ '--row-height': `${height}px` } as CSSProperties}
            >
              <Sortable
                id={row}
                label={name}
                items={items}
                capacity={MAX_BLOCKS_PER_ROW}
                strategy={horizontalListSortingStrategy}
                role="list"
                aria-label={name}
                // A floor, so a row emptied mid-drag keeps a rect its block can come back to.
                className="grid min-h-16 min-w-0 grid-cols-12 gap-4 rounded-lg"
              >
                {items.map((id, position) => (
                  <ChartBlock
                    key={id}
                    id={id}
                    span={spans[position]}
                    max={position < items.length - 1 ? maxSpan(spans, position) : undefined}
                    height={height}
                    onRemove={(block) => setBoard((current) => removeBlock(current, block))}
                    onResize={(block, span) =>
                      setBoard((current) => resizeBlock(current, block, span))
                    }
                  />
                ))}
              </Sortable>
              <ResizeHandle
                label={`Resize ${name} height`}
                orientation="horizontal"
                value={height}
                min={MIN_ROW_HEIGHT}
                max={MAX_ROW_HEIGHT}
                step={8}
                largeStep={40}
                valueText={(value) => `${value} pixels`}
                onResize={(value) => setBoard((current) => resizeRow(current, row, value))}
              />
            </div>
          )
        })}
      </div>
    </DragAndDrop>
  )
}

/**
 * The dashboard you can rearrange: the same charts as `Everything`, on the
 * drag foundation's rows instead of a `BentoGrid`. Carry a block by its grip
 * (or from anywhere on it with a pointer) into another row and the rows
 * re-share their columns; drag the strip between two blocks to resize by the
 * column, or the strip under a row to change its height — and the charts
 * follow, because a chart's `height` is a number the row now owns. Mixpanel
 * Boards, with this library's parts.
 *
 * **Why this is a third story and not a change to `Everything`.** `Everything`
 * is the family's integration test — every chart, one grid, one set of rules —
 * and a `BentoGrid` is the right thing for a dashboard whose layout is the
 * designer's. This one is for a dashboard whose layout is the *user's*, which
 * is a different product decision; the board's state, and the arithmetic
 * under it, come from `DragAndDrop`'s `board.ts`, so nothing here is a second
 * copy of that logic.
 *
 * Nothing moves on load: `ComposableKeyboard` renders the identical tree and
 * drives it.
 */
export const Composable: Story = { render: renderComposable }

/**
 * The same dashboard, driven: the spans the grid rendered, a block resized by
 * the column, a row resized by height with the chart's plot following, and a
 * block carried up into the row above — all by keyboard.
 */
export const ComposableKeyboard: Story = {
  render: renderComposable,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const row = (n: number) => canvas.getByRole('list', { name: `Row ${n}` })
    // The row's own items, not the legends' — a chart legend is a list too.
    const blocks = (n: number) => Array.from(row(n).querySelectorAll(':scope > [role="listitem"]'))
    const spans = (n: number) => blocks(n).map((item) => getComputedStyle(item).gridColumnEnd)
    const plotHeight = (label: string) =>
      (canvas.getByRole('img', { name: label }).parentElement as HTMLElement).style.height

    await step('the grid renders the spans the arithmetic says', async () => {
      await expect(spans(1)).toEqual(['span 6', 'span 6'])
      await expect(spans(2)).toEqual(['span 4', 'span 4', 'span 4'])
      await expect(spans(3)).toEqual(['span 6', 'span 6'])
    })

    await step('the handle between two charts resizes by the column', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Sessions over time' })
      handle.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(spans(1)).toEqual(['span 7', 'span 5'])
      await userEvent.keyboard('{Home}')
      await expect(spans(1)).toEqual(['span 3', 'span 9'])
    })

    await step('the handle under a row resizes it, and the plots follow', async () => {
      const label = 'Sessions, signups and conversions over 31 days'
      await expect(plotHeight(label)).toBe(`${ROW_HEIGHT - CHART_CHROME}px`)
      const handle = canvas.getByRole('separator', { name: 'Resize Row 1 height' })
      handle.focus()
      await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(ROW_HEIGHT + 40))
      await expect(plotHeight(label)).toBe(`${ROW_HEIGHT + 40 - CHART_CHROME}px`)
      await expect(blocks(1)[0].getBoundingClientRect().height).toBe(ROW_HEIGHT + 40)
    })

    await step('a chart is carried up into the row above', async () => {
      const handle = canvas.getByRole('button', { name: 'Move By channel' })
      handle.focus()
      await userEvent.keyboard(' ')
      await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'))
      await userEvent.keyboard('{ArrowUp}')
      await waitFor(() =>
        expect(within(row(1)).getByRole('button', { name: 'Move By channel' })).toBeInTheDocument(),
      )
      await userEvent.keyboard(' ')
      await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/dropped in Row 1/))
      // Row 1 had a hand-sized block at 3; the other two share nine. Where the
      // carried block landed among them is the collision's choice, so the
      // spans are compared as a set.
      await expect([...spans(1)].sort()).toEqual(['span 3', 'span 4', 'span 5'])
      await expect(spans(2)).toEqual(['span 6', 'span 6'])
    })

    await step('removing a chart re-shares its row', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Remove Models' }))
      await expect(spans(3)).toEqual(['span 12'])
    })
  },
}
